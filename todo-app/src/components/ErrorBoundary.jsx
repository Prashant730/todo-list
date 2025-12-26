import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
          <div className="max-w-md w-full bg-[var(--bg-secondary)] rounded-xl p-6 text-center border border-[var(--border-color)]">
            <FiAlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              The application encountered an unexpected error. This has been logged for investigation.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition"
              >
                Try Again
              </button>
              <button 
                onClick={this.handleReload}
                className="flex-1 btn-primary px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <FiRefreshCw size={16} /> Reload App
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-3 bg-[var(--bg-primary)] rounded text-xs overflow-auto max-h-40 text-red-500">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;