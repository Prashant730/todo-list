import { FiLoader, FiZap, FiBarChart, FiDownload, FiUpload } from 'react-icons/fi';

const LoadingSpinner = ({ size = 20, className = '' }) => (
  <FiLoader className={`animate-spin ${className}`} size={size} />
);

export const TasksLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center gap-3">
      <LoadingSpinner size={24} className="text-[var(--accent)]" />
      <span className="text-[var(--text-secondary)]">Loading tasks...</span>
    </div>
  </div>
);

export const AILoading = ({ message = 'AI is thinking...' }) => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center gap-3">
      <FiZap className="animate-pulse text-purple-500" size={24} />
      <span className="text-[var(--text-secondary)]">{message}</span>
    </div>
  </div>
);

export const AnalyticsLoading = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center gap-3">
      <FiBarChart className="animate-bounce text-green-500" size={24} />
      <span className="text-[var(--text-secondary)]">Generating analytics...</span>
    </div>
  </div>
);

export const ExportLoading = () => (
  <div className="flex items-center gap-2">
    <FiDownload className="animate-bounce" size={16} />
    <span>Exporting...</span>
  </div>
);

export const ImportLoading = () => (
  <div className="flex items-center gap-2">
    <FiUpload className="animate-bounce" size={16} />
    <span>Importing...</span>
  </div>
);

export const InlineLoading = ({ message, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <LoadingSpinner size={16} className="text-[var(--accent)]" />
    <span className="text-sm text-[var(--text-secondary)]">{message}</span>
  </div>
);

export const ButtonLoading = ({ children, loading, loadingText, ...props }) => (
  <button {...props} disabled={loading || props.disabled}>
    {loading ? (
      <div className="flex items-center gap-2">
        <LoadingSpinner size={16} />
        {loadingText || 'Loading...'}
      </div>
    ) : (
      children
    )}
  </button>
);

// Skeleton loaders
export const TaskCardSkeleton = () => (
  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-3 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 bg-[var(--bg-tertiary)] rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
      </div>
      <div className="flex gap-1">
        <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded"></div>
        <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded"></div>
      </div>
    </div>
  </div>
);

export const TaskListSkeleton = ({ count = 5 }) => (
  <div>
    {Array.from({ length: count }, (_, i) => (
      <TaskCardSkeleton key={i} />
    ))}
  </div>
);

export default LoadingSpinner;