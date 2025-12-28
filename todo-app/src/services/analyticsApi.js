/**
 * ANALYTICS API SERVICE
 *
 * Fetches all analytics from backend.
 * NO frontend computation - all analytics are server-side.
 */

import api from './api'

const analyticsApi = {
  // Completion Analytics
  async getCompletionAnalytics(period = 'weekly') {
    const response = await api.request(`/analytics/completion?period=${period}`)
    return response.data
  },

  // Time-Based Productivity Patterns
  async getTimePatterns() {
    const response = await api.request('/analytics/time-patterns')
    return response.data
  },

  // Priority vs Reality Analysis
  async getPriorityAnalysis() {
    const response = await api.request('/analytics/priority')
    return response.data
  },

  // Focus & Context Switching
  async getFocusAnalysis() {
    const response = await api.request('/analytics/focus')
    return response.data
  },

  // Goal Alignment
  async getGoalAlignment() {
    const response = await api.request('/analytics/goals')
    return response.data
  },

  // Procrastination Detection
  async getProcrastinationAnalysis() {
    const response = await api.request('/analytics/procrastination')
    return response.data
  },

  // Productivity Score
  async getProductivityScore() {
    const response = await api.request('/analytics/productivity-score')
    return response.data
  },

  // Quick Summary (for dashboard cards)
  async getSummary() {
    const response = await api.request('/analytics/summary')
    return response.data
  },

  // Weekly Report
  async getWeeklyReport() {
    const response = await api.request('/reports/weekly')
    return response.data
  },

  // Monthly Report
  async getMonthlyReport() {
    const response = await api.request('/reports/monthly')
    return response.data
  },

  // Comprehensive (all analytics in one call)
  async getComprehensive() {
    const response = await api.request('/reports/comprehensive')
    return response.data
  },
}

export default analyticsApi
