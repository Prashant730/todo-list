/**
 * ANALYTICS ROUTES - Deep Productivity Analysis API
 *
 * All analytics computation is done in the analyticsService.
 * Controllers are thin - they just handle request/response.
 */

const express = require('express')
const auth = require('../middleware/auth')
const analyticsService = require('../services/analyticsService')

const router = express.Router()

/**
 * GET /api/analytics/completion
 * Completion Analytics: tasks created vs completed, completion rate, overdue %, avg completion time
 */
router.get('/completion', auth, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query
    const data = await analyticsService.getCompletionAnalytics(
      req.userId,
      period
    )
    res.json({ success: true, data })
  } catch (error) {
    console.error('Completion analytics error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/time-patterns
 * Time-Based Productivity: most productive hours/days, completion time by hour bucket
 */
router.get('/time-patterns', auth, async (req, res) => {
  try {
    const data = await analyticsService.getTimePatterns(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Time patterns error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/priority
 * Priority vs Reality: completion delay by priority, missed deadlines, actual effort vs assigned priority
 */
router.get('/priority', auth, async (req, res) => {
  try {
    const data = await analyticsService.getPriorityAnalysis(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Priority analysis error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/focus
 * Focus & Context Switching: category switches, avg focus duration, abandoned/reopened tasks
 */
router.get('/focus', auth, async (req, res) => {
  try {
    const data = await analyticsService.getFocusAnalysis(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Focus analysis error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/goals
 * Goal Alignment: weekly goals, tasks linked to goals, goal completion rate, alignment ratio
 */
router.get('/goals', auth, async (req, res) => {
  try {
    const data = await analyticsService.getGoalAlignment(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Goal alignment error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/procrastination
 * Procrastination Detection: frequently postponed, severely overdue, never started tasks
 */
router.get('/procrastination', auth, async (req, res) => {
  try {
    const data = await analyticsService.getProcrastinationAnalysis(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Procrastination analysis error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/productivity-score
 * Transparent Productivity Score with formula explanation
 */
router.get('/productivity-score', auth, async (req, res) => {
  try {
    const data = await analyticsService.getProductivityScore(req.userId)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Productivity score error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

/**
 * GET /api/analytics/summary
 * Quick summary for dashboard (backward compatible)
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const [completion, productivityScore] = await Promise.all([
      analyticsService.getCompletionAnalytics(req.userId, 'weekly'),
      analyticsService.getProductivityScore(req.userId),
    ])

    res.json({
      success: true,
      data: {
        total: completion.metrics.totalTasks,
        completed: completion.metrics.totalCompleted,
        active:
          completion.metrics.totalTasks - completion.metrics.totalCompleted,
        overdue: completion.metrics.totalOverdue,
        completionRate: completion.metrics.completionRate,
        productivityScore: productivityScore.score,
        grade: productivityScore.grade,
      },
    })
  } catch (error) {
    console.error('Summary error:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
