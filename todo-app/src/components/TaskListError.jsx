import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export default function TaskListError({ error, resetError }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <FiAlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Task List Error
      </h3>
      <p className="text-red-600 mb-4">
        {error?.message || 'Something went wrong while loading your tasks.'}
      </p>
      <div className="space-y-2">
        <button
          onClick={resetError}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <FiRefreshCw size={16} />
          Try Again
        </button>
        <p className="text-sm text-red-500">
          If this problem persists, try refreshing the page or clearing your browser data.
        </p>
      </div>
    </div>
  );
}