// Environment configuration
export const config = {
  // AI Provider API Keys (priority: Groq > DeepSeek > Gemini)
  groqApiKey: import.meta.env.VITE_GROQ_API_KEY,
  deepseekApiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY,

  appName: import.meta.env.VITE_APP_NAME || 'Advanced Todo App',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  storageKey: import.meta.env.VITE_STORAGE_KEY || 'advanced-todo-app',
  analyticsCacheKey:
    import.meta.env.VITE_ANALYTICS_CACHE_KEY || 'ai-analytics-cache',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}

export default config
