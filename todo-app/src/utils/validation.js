// Input validation utilities
export const validateTask = (task) => {
  const errors = {}

  if (!task.title?.trim()) {
    errors.title = 'Title is required'
  } else if (task.title.length > 200) {
    errors.title = 'Title must be less than 200 characters'
  }

  if (task.description && task.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters'
  }

  if (task.dueDate) {
    const dueDate = new Date(task.dueDate)
    if (isNaN(dueDate.getTime())) {
      errors.dueDate = 'Invalid due date'
    }
  }

  if (task.priority && !['low', 'medium', 'high'].includes(task.priority)) {
    errors.priority = 'Invalid priority level'
  }

  if (task.categories && Array.isArray(task.categories)) {
    if (task.categories.length > 5) {
      errors.categories = 'Maximum 5 categories allowed'
    }
    task.categories.forEach((category) => {
      if (typeof category !== 'string' || category.length > 50) {
        errors.categories =
          'Each category must be a string with max 50 characters'
      }
    })
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateApiKey = (apiKey) => {
  if (!apiKey) {
    return { isValid: false, error: 'API key is required' }
  }

  if (typeof apiKey !== 'string') {
    return { isValid: false, error: 'API key must be a string' }
  }

  if (apiKey.length < 10) {
    return { isValid: false, error: 'API key appears to be too short' }
  }

  // Basic format check for Google API keys
  if (!apiKey.startsWith('AIza')) {
    return { isValid: false, error: 'Invalid Google API key format' }
  }

  return { isValid: true }
}

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input

  return input.trim().replace(/[<>]/g, '') // Remove potential HTML tags
  // Don't truncate here - let validation handle length limits
}
