import { FiAlertCircle, FiRefreshCw, FiSettings } from 'react-icons/fi';

export default function AIError({ error, resetError, onConfigureAPI }) {
  const isAPIKeyError = error?.message?.includes('API key') || error?.message?.includes('401');
  const isQuotaError = error?.message?.includes('quota') || error?.message?.includes('429');

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
      <FiAlertCircle className="mx-auto mb-4 text-orange-500" size={48} />
      <h3 className="text-lg font-semibold text-orange-800 mb-2">
        AI Service Error
      </h3>
      <p className="text-orange-600 mb-4">
        {error?.message || 'AI features are temporarily unavailable.'}
      </p>
      <div className="space-y-2">
        {isAPIKeyError ? (
          <button
            onClick={onConfigureAPI}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <FiSettings size={16} />
            Configure API Key
          </button>
        ) : (
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            <FiRefreshCw size={16} />
            Try Again
          </button>
        )}
        {isQuotaError && (
          <p className="text-sm text-orange-500">
            API quota exceeded. Please wait a few minutes before trying again.
          </p>
        )}
      </div>
    </div>
  );
}