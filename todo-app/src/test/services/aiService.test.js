import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from '../../services/aiService.js'

// Mock the config module
vi.mock('../../config/env.js', () => ({
  config: {
    geminiApiKey: 'test-api-key',
    isDevelopment: true,
    isProduction: false,
  },
}))

// Mock the Google Generative AI
const mockGenerateContent = vi.fn()
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}))

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}))

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the service initialization state
    aiService.initialized = false
    aiService.genAI = null
    aiService.model = null

    // Default mock response
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify([
            {
              type: 'priority',
              title: 'Focus on High Priority Tasks',
              description:
                'You have several high priority tasks that need attention.',
            },
          ]),
      },
    })
  })

  it('should generate insights from tasks', async () => {
    const tasks = [
      { title: 'Test task 1', priority: 'high', completed: false },
      { title: 'Test task 2', priority: 'medium', completed: true },
    ]

    const insights = await aiService.generateInsights(tasks)

    expect(insights).toBeInstanceOf(Array)
    expect(insights.length).toBeGreaterThan(0)
    expect(insights[0]).toHaveProperty('type')
    expect(insights[0]).toHaveProperty('title')
    expect(insights[0]).toHaveProperty('description')
  })

  it('should generate task breakdown', async () => {
    const task = {
      title: 'Complete project',
      description: 'Finish the quarterly project',
      priority: 'high',
      dueDate: '2024-12-31T12:00',
    }

    // Mock the breakdown response
    const mockBreakdown = {
      dailyTasks: [
        {
          date: '2024-12-25',
          tasks: [
            {
              title: 'Start project research',
              description: 'Begin initial research',
              priority: 'high',
              estimatedTime: '2 hours',
            },
          ],
        },
      ],
    }

    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify(mockBreakdown),
      },
    })

    const breakdown = await aiService.generateTaskBreakdown(task)

    expect(breakdown).toHaveProperty('dailyTasks')
    expect(breakdown.dailyTasks).toBeInstanceOf(Array)
  })

  it('should handle API errors gracefully', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API key not found'))

    const tasks = [{ title: 'Test task', priority: 'high', completed: false }]

    await expect(aiService.generateInsights(tasks)).rejects.toThrow(
      'Invalid or missing API key. Please check your API key configuration.'
    )
  })

  it('should provide fallback responses when JSON parsing fails', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'Invalid JSON response',
      },
    })

    const tasks = [{ title: 'Test task', priority: 'high', completed: false }]
    const insights = await aiService.generateInsights(tasks)

    expect(insights).toBeInstanceOf(Array)
    expect(insights.length).toBe(1)
    expect(insights[0].type).toBe('general')
  })
})
