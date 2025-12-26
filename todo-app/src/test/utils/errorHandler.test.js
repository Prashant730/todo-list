import { describe, it, expect, vi } from 'vitest'
import {
  AppError,
  errorCodes,
  handleApiError,
  handleStorageError,
  showErrorNotification,
} from '../../utils/errorHandler'

describe('Error Handler Utils', () => {
  describe('AppError', () => {
    it('should create error with message and code', () => {
      const error = new AppError('Test message', 'TEST_CODE', {
        detail: 'test',
      })

      expect(error.message).toBe('Test message')
      expect(error.code).toBe('TEST_CODE')
      expect(error.details).toEqual({ detail: 'test' })
      expect(error.name).toBe('AppError')
    })

    it('should create error with default code', () => {
      const error = new AppError('Test message')
      expect(error.code).toBe('UNKNOWN_ERROR')
    })
  })

  describe('handleApiError', () => {
    it('should handle API key error', () => {
      const error = new Error('API key not found')
      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(errorCodes.API_KEY_MISSING)
      expect(result.message).toContain('Invalid or missing API key')
    })

    it('should handle rate limit error', () => {
      const error = new Error('quota exceeded')
      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(errorCodes.RATE_LIMIT_EXCEEDED)
      expect(result.message).toContain('rate limit exceeded')
    })

    it('should handle network error', () => {
      const error = new Error('network timeout')
      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(errorCodes.NETWORK_ERROR)
      expect(result.message).toContain('Network error')
    })

    it('should handle NetworkError type', () => {
      const error = new Error('Connection failed')
      error.name = 'NetworkError'
      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(errorCodes.NETWORK_ERROR)
    })

    it('should handle generic error', () => {
      const error = new Error('Unknown error')
      const result = handleApiError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(errorCodes.API_REQUEST_FAILED)
      expect(result.message).toContain('unexpected error')
    })
  })

  describe('handleStorageError', () => {
    it('should handle storage error', () => {
      const error = new Error('Storage full')
      const result = handleStorageError(error)

      expect(result).toBeInstanceOf(AppError)
      expect(result.code).toBe(errorCodes.STORAGE_ERROR)
      expect(result.message).toContain('Failed to save data')
    })
  })

  describe('showErrorNotification', () => {
    it('should call notification function with error', () => {
      const mockNotificationFn = vi.fn()
      const error = new AppError('Test error')

      showErrorNotification(error, mockNotificationFn)

      expect(mockNotificationFn).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'Test error',
        duration: 5000,
      })
    })

    it('should handle error without message', () => {
      const mockNotificationFn = vi.fn()
      const error = {}

      showErrorNotification(error, mockNotificationFn)

      expect(mockNotificationFn).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred',
        duration: 5000,
      })
    })

    it('should not crash if notification function is not provided', () => {
      const error = new AppError('Test error')
      expect(() => showErrorNotification(error)).not.toThrow()
    })

    it('should not crash if notification function is not a function', () => {
      const error = new AppError('Test error')
      expect(() => showErrorNotification(error, 'not a function')).not.toThrow()
    })
  })
})
