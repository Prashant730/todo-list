/**
 * REPORTS ROUTES - Weekly & Monthly Report Generation
 *
 * Generates structured, data-driven reports.
 * NO generic text - every sentence is tied to actual metrics.
 */

const express = require('express')
const auth = require('../middleware/auth')
const analyticsService = require('../services/analyticsService')

const router = express.Router()

/**
 * GET /api/reports/weekly
 * Generate weekly productivity report
 */
router.get('/weekly', auth, async (req, res) => {
  try {
    const report = await analyticsService.generateReport(req.userId, 'weekly')
    res.json({ success: true, data: report })
  } catch (error) {
    console.error('Weekly report error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/reports/monthly
 * Generate monthly productivity report
 */
router.get('/monthly', auth, async (req, res) => {
  try {
    const report = await analyticsService.generateReport(req.userId, 'monthly')
    res.json({ success: true, data: report })
  } catch (error) {
    console.error('Monthly report error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/reports/comprehensive
 * Get all analytics data in one call (for dashboard)
 */
router.get('/comprehensive', auth, async (req, res) => {
  try {
    const [
      completion,
      timePatterns,
      priority,
      focus,
      goals,
      procrastination,
      productivityScore,
    ] = await Promise.all([
      analyticsService.getCompletionAnalytics(req.userId, 'weekly'),
      analyticsService.getTimePatterns(req.userId),
      analyticsService.getPriorityAnalysis(req.userId),
      analyticsService.getFocusAnalysis(req.userId),
      analyticsService.getGoalAlignment(req.userId),
      analyticsService.getProcrastinationAnalysis(req.userId),
      analyticsService.getProductivityScore(req.userId),
    ])

    res.json({
      success: true,
      data: {
        completion,
        timePatterns,
        priority,
        focus,
        goals,
        procrastination,
        productivityScore,
      },
    })
  } catch (error) {
    console.error('Comprehensive report error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
