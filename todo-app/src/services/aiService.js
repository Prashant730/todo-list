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
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(this.apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent(prompt)
    return result.response.text()
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
    const prompt = `Analyze this productivity data:
${JSON.stringify(data, null, 2)}

Return ONLY JSON: {"trends": ["trend1"], "recommendations": ["rec1"], "insights": ["insight1"]}`

    const response = await this.generateContent(prompt)
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      return jsonMatch
        ? JSON.parse(jsonMatch[0])
        : {
            trends: ['Data analyzed'],
            recommendations: ['Keep tracking'],
            insights: ['Good progress'],
          }
    } catch {
      return {
        trends: ['Data analyzed'],
        recommendations: ['Keep tracking'],
        insights: ['Good progress'],
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
