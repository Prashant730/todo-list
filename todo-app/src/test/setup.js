import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock environment variables
vi.mock('../config/env', () => ({
  default: {
    geminiApiKey: 'test-api-key',
    appName: 'Test Todo App',
    storageKey: 'test-todo-app',
    analyticsCacheKey: 'test-analytics-cache',
    isDevelopment: true,
    isProduction: false,
  },
}))

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mock AI response',
        },
      }),
    }),
  })),
}))

// Mock date-fns to avoid timezone issues in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns')
  return {
    ...actual,
    format: vi.fn().mockImplementation((date, formatStr) => {
      if (formatStr === 'MMM d') return 'Jan 1'
      if (formatStr === 'yyyy-MM-dd') return '2024-01-01'
      return '2024-01-01T12:00:00'
    }),
  }
})

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
