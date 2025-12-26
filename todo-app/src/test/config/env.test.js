import { describe, it, expect } from 'vitest'
import config from '../../config/env'

describe('Environment Configuration', () => {
  it('should have required configuration properties', () => {
    expect(config).toHaveProperty('geminiApiKey')
    expect(config).toHaveProperty('appName')
    expect(config).toHaveProperty('storageKey')
    expect(config).toHaveProperty('analyticsCacheKey')
    expect(config).toHaveProperty('isDevelopment')
    expect(config).toHaveProperty('isProduction')
  })

  it('should have test API key configured', () => {
    expect(config.geminiApiKey).toBe('test-api-key')
  })

  it('should have correct app name', () => {
    expect(config.appName).toBe('Test Todo App')
  })

  it('should be in development mode for tests', () => {
    expect(config.isDevelopment).toBe(true)
    expect(config.isProduction).toBe(false)
  })

  it('should have proper storage keys', () => {
    expect(config.storageKey).toBe('test-todo-app')
    expect(config.analyticsCacheKey).toBe('test-analytics-cache')
  })
})
