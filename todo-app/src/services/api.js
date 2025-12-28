// API Service for connecting to backend
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://todo-list-zoa3.onrender.com/api'
    : 'http://localhost:5000/api')

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken() {
    return this.token || localStorage.getItem('auth_token')
  }

  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.getToken()) {
      headers['Authorization'] = `Bearer ${this.getToken()}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'API request failed')
    }

    return data
  }

  // Auth
  async register(email, password, name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    this.setToken(data.data.token)
    return data
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setToken(data.data.token)
    return data
  }

  logout() {
    this.setToken(null)
  }

  async getMe() {
    return this.request('/auth/me')
  }

  async updateProfile(updates) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // Tasks
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters).toString()
    return this.request(`/tasks${params ? `?${params}` : ''}`)
  }

  async createTask(task) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    })
  }

  async createBulkTasks(tasks) {
    return this.request('/tasks/bulk', {
      method: 'POST',
      body: JSON.stringify({ tasks }),
    })
  }

  async updateTask(id, updates) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async toggleTask(id) {
    return this.request(`/tasks/${id}/toggle`, {
      method: 'PATCH',
    })
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  async reorderTasks(tasks) {
    return this.request('/tasks/reorder', {
      method: 'PUT',
      body: JSON.stringify({ tasks }),
    })
  }

  async clearCompleted() {
    return this.request('/tasks/clear-completed', {
      method: 'DELETE',
    })
  }

  // Categories
  async getCategories() {
    return this.request('/categories')
  }

  async createCategory(category) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  async deleteCategory(id) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Templates
  async getTemplates() {
    return this.request('/templates')
  }

  async createTemplate(template) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(template),
    })
  }

  async useTemplate(id) {
    return this.request(`/templates/${id}/use`, {
      method: 'POST',
    })
  }

  async deleteTemplate(id) {
    return this.request(`/templates/${id}`, {
      method: 'DELETE',
    })
  }

  // Analytics
  async getAnalyticsSummary() {
    return this.request('/analytics/summary')
  }

  async getStreaks() {
    return this.request('/analytics/streaks')
  }

  async resetProductivity() {
    return this.request('/analytics/reset', {
      method: 'POST',
    })
  }

  // Settings
  async getSettings() {
    return this.request('/settings')
  }

  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }
}

export const api = new ApiService()
export default api
