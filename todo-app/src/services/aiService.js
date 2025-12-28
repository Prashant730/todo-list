import { config } from '../config/env.js'

class AIService {
  constructor() {
    this.initialized = false
    this.provider = null
    this.apiKey = null
  }

  async initialize() {
    if (this.initialized) return

    // Check for available API keys (priority: Groq > DeepSeek > Gemini)
    if (config.groqApiKey) {
      this.provider = 'groq'
      this.apiKey = config.groqApiKey
    } else if (config.deepseekApiKey) {
      this.provider = 'deepseek'
      this.apiKey = config.deepseekApiKey
    } else if (config.geminiApiKey) {
      this.provider = 'gemini'
      this.apiKey = config.geminiApiKey
    } else {
      throw new Error(
        'No API key found. Please set VITE_GROQ_API_KEY, VITE_DEEPSEEK_API_KEY, or VITE_GEMINI_API_KEY'
      )
    }

    this.initialized = true
    console.log(`AI Service initialized with provider: ${this.provider}`)
  }

  async generateContent(prompt) {
    try {
      await this.initialize()

      if (this.provider === 'groq') {
        return await this.callGroq(prompt)
      } else if (this.provider === 'deepseek') {
        return await this.callDeepSeek(prompt)
      } else {
        return await this.callGemini(prompt)
      }
    } catch (error) {
      console.error('AI Content generation failed:', error)
      const errorMessage = error.message || 'Unknown error'

      if (
        errorMessage.includes('API key') ||
        errorMessage.includes('401') ||
        errorMessage.includes('Unauthorized')
      ) {
        throw new Error(
          'Invalid or missing API key. Please check your API key configuration.'
        )
      } else if (
        errorMessage.includes('quota') ||
        errorMessage.includes('429') ||
        errorMessage.includes('rate')
      ) {
        throw new Error(
          'API quota exceeded. Please wait a moment and try again.'
        )
      } else if (
        errorMessage.includes('network') ||
        errorMessage.includes('fetch')
      ) {
        throw new Error('Network error. Please check your internet connection.')
      } else {
        throw new Error(`AI service error: ${errorMessage}`)
      }
    }
  }

  async callGroq(prompt) {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // Fast, free model
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Groq API error: ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async callDeepSeek(prompt) {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`DeepSeek API error: ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async callGemini(prompt) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(this.apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Gemini import/call failed:', error)
      throw new Error('Gemini AI service unavailable')
    }
  }

  async generateInsights(tasks) {
    const taskSummary = tasks.map((task) => ({
      title: task.title,
      priority: task.priority,
      completed: task.completed,
      dueDate: task.dueDate,
      category: task.category,
    }))

    const prompt = `You are a study advisor for students. Analyze these academic tasks and provide 3 actionable insights:
${JSON.stringify(taskSummary, null, 2)}

Focus on: study schedule optimization, exam preparation, assignment deadlines, work-life balance.
Consider student challenges like procrastination, time management, and academic stress.
Return ONLY a JSON array: [{"type": "study|deadline|balance", "title": "Brief title", "description": "Student-focused actionable insight"}]`

    const response = await this.generateContent(prompt)
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      return jsonMatch
        ? JSON.parse(jsonMatch[0])
        : [
            {
              type: 'general',
              title: 'Analysis',
              description: response.substring(0, 200),
            },
          ]
    } catch {
      return [
        {
          type: 'general',
          title: 'AI Analysis',
          description: response.substring(0, 200),
        },
      ]
    }
  }

  async generateTaskBreakdown(task) {
    const prompt = `You are a study advisor. Break down this academic task into manageable study sessions:
Task: ${task.title}
Description: ${task.description || 'No description'}
Due: ${task.dueDate}, Priority: ${task.priority}

Consider student needs: study breaks, research time, review sessions, and avoiding cramming.
Create a realistic study schedule with proper pacing.

Return ONLY JSON: {"dailyTasks": [{"date": "YYYY-MM-DD", "tasks": [{"title": "Study session", "description": "What to focus on", "priority": "high|medium|low", "estimatedTime": "45 min"}]}]}`

    const response = await this.generateContent(prompt)
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.fallbackBreakdown(task)
    } catch {
      return this.fallbackBreakdown(task)
    }
  }

  fallbackBreakdown(task) {
    return {
      dailyTasks: [
        {
          date: new Date().toISOString().split('T')[0],
          tasks: [
            {
              title: `Start: ${task.title}`,
              description: 'Begin working on this task',
              priority: task.priority,
              estimatedTime: '1 hour',
            },
          ],
        },
      ],
    }
  }

  async generateAnalytics(data) {
    const prompt = `You are an expert productivity analyst. Analyze this comprehensive task management data and provide deep insights:

PRODUCTIVITY DATA:
${JSON.stringify(data, null, 2)}

Generate a comprehensive analysis report focusing on these specific areas:

1. TASK STATUS DISTRIBUTION - Analyze completion patterns and task lifecycle
2. PRIORITY DISTRIBUTION - Examine how priorities are managed and completed
3. DAILY ACTIVITY PATTERN - Identify peak productivity hours and daily trends
4. CATEGORY PERFORMANCE - Evaluate performance across different task categories
5. 30-DAY ACTIVITY STREAK - Assess consistency and momentum patterns
6. WEEKLY COMPLETION PATTERNS - Identify weekly productivity cycles
7. PRIORITY ANALYSIS: TOTAL VS COMPLETED - Deep dive into priority management effectiveness

Return ONLY JSON with this exact structure:
{
  "productivityProfile": "2-3 sentence summary of user's productivity style",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "behavioralPatterns": ["pattern1", "pattern2", "pattern3"],
  "actionableRecommendations": ["rec1", "rec2", "rec3", "rec4", "rec5"],
  "predictiveInsights": ["insight1", "insight2", "insight3"],
  "gamificationSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "keyMetrics": {
    "taskStatusAnalysis": "Analysis of completion vs active vs overdue tasks",
    "priorityEffectiveness": "How well priorities are being managed",
    "dailyProductivityPeak": "Best time of day for task completion",
    "categoryInsights": "Which categories perform best/worst",
    "streakAnalysis": "Consistency patterns and momentum",
    "weeklyTrends": "Weekly productivity patterns",
    "priorityCompletionGap": "Gap between high/medium/low priority completion rates"
  }
}`

    const response = await this.generateContent(prompt)
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      return jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            productivityProfile: 'Analysis completed with available data.',
            strengths: ['Task tracking', 'Data collection', 'Consistent usage'],
            weaknesses: ['Need more data', 'Pattern analysis pending'],
            behavioralPatterns: [
              'Regular task creation',
              'Varied completion times',
            ],
            actionableRecommendations: [
              'Continue tracking tasks consistently',
              'Focus on completing high-priority items first',
              'Establish regular review sessions',
              'Set specific time blocks for task completion',
              'Use categories to organize work better',
            ],
            predictiveInsights: [
              'Productivity patterns will become clearer with more data',
              'Consistency in task completion leads to better outcomes',
              'Priority management is key to productivity improvement',
            ],
            gamificationSuggestions: [
              'Set daily completion goals',
              'Create weekly challenges',
              'Track longest completion streaks',
            ],
            keyMetrics: {
              taskStatusAnalysis:
                'Current task distribution shows room for improvement',
              priorityEffectiveness: 'Priority management needs attention',
              dailyProductivityPeak: 'Peak hours not yet identified',
              categoryInsights: 'Category performance varies significantly',
              streakAnalysis: 'Building consistency is important',
              weeklyTrends: 'Weekly patterns emerging',
              priorityCompletionGap: 'Priority completion rates need balancing',
            },
          }
    } catch (error) {
      console.error('Analytics parsing error:', error)
      return {
        productivityProfile: 'Analysis completed with available data.',
        strengths: ['Task tracking', 'Data collection', 'Consistent usage'],
        weaknesses: ['Need more data', 'Pattern analysis pending'],
        behavioralPatterns: [
          'Regular task creation',
          'Varied completion times',
        ],
        actionableRecommendations: [
          'Continue tracking tasks consistently',
          'Focus on completing high-priority items first',
          'Establish regular review sessions',
          'Set specific time blocks for task completion',
          'Use categories to organize work better',
        ],
        predictiveInsights: [
          'Productivity patterns will become clearer with more data',
          'Consistency in task completion leads to better outcomes',
          'Priority management is key to productivity improvement',
        ],
        gamificationSuggestions: [
          'Set daily completion goals',
          'Create weekly challenges',
          'Track longest completion streaks',
        ],
        keyMetrics: {
          taskStatusAnalysis:
            'Current task distribution shows room for improvement',
          priorityEffectiveness: 'Priority management needs attention',
          dailyProductivityPeak: 'Peak hours not yet identified',
          categoryInsights: 'Category performance varies significantly',
          streakAnalysis: 'Building consistency is important',
          weeklyTrends: 'Weekly patterns emerging',
          priorityCompletionGap: 'Priority completion rates need balancing',
        },
      }
    }
  }

  async generateChatResponse(message, context) {
    const prompt = `You are a friendly study advisor and academic coach for students. Context: ${JSON.stringify(
      context
    )}
User: ${message}

Provide helpful, encouraging advice about:
- Study techniques and time management
- Dealing with academic stress and procrastination
- Balancing coursework with personal life
- Exam preparation strategies
- Assignment planning and organization

Keep responses concise, supportive, and student-focused.`

    return await this.generateContent(prompt)
  }
}

export const aiService = new AIService()
export default aiService
