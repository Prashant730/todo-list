// Error handling utilities
export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
  }
}

export const errorCodes = {
  API_KEY_MISSING: 'API_KEY_MISSING',
  API_REQUEST_FAILED: 'API_REQUEST_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
}

export const handleApiError = (error) => {
  console.error('API Error:', error)

  if (error.message?.includes('API key')) {
    return new AppError(
      'Invalid or missing API key. Please check your configuration.',
      errorCodes.API_KEY_MISSING
    )
  }

  if (
    error.message?.includes('quota') ||
    error.message?.includes('rate limit')
  ) {
    return new AppError(
      'API rate limit exceeded. Please try again later.',
      errorCodes.RATE_LIMIT_EXCEEDED
    )
  }

  if (error.message?.includes('network') || error.name === 'NetworkError') {
    return new AppError(
      'Network error. Please check your internet connection.',
      errorCodes.NETWORK_ERROR
    )
  }

  return new AppError(
    'An unexpected error occurred. Please try again.',
    errorCodes.API_REQUEST_FAILED,
    error
  )
}

export const handleStorageError = (error) => {
  console.error('Storage Error:', error)
  return new AppError(
    'Failed to save data. Your browser storage might be full.',
    errorCodes.STORAGE_ERROR,
    error
  )
}

export const showErrorNotification = (error, notificationFn) => {
  if (typeof notificationFn === 'function') {
    notificationFn({
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      duration: 5000,
    })
  }
}
