/**
 * ANALYTICS SERVICE - Deep Productivity Analysis
 *
 * This service contains all analytics computation logic.
 * All calculations are done server-side using MongoDB aggregation pipelines.
 *
 * DESIGN PRINCIPLES:
 * 1. No fake AI - all insights are derived from actual data patterns
 * 2. Every metric has a clear definition and purpose
 * 3. Aggregations are optimized for performance
 * 4. Results include explanations of what they mean
 */

const Task = require('../models/Task')
const Goal = require('../models/Goal')
const mongoose = require('mongoose')

class AnalyticsService {
  /**
   * A. COMPLETION ANALYTICS
   * Measures: tasks created vs completed, completion rate, overdue percentage, avg completion time
   * Why: Core productivity metrics - are you finishing what you start?
   */
  async getCompletionAnalytics(userId, period = 'weekly') {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          // Tasks created in period
          createdInPeriod: [
            { $match: { createdAt: { $gte: startDate } } },
            { $count: 'count' },
          ],
          // Tasks completed in period
          completedInPeriod: [
            { $match: { completedAt: { $gte: startDate, $lte: now } } },
            { $count: 'count' },
          ],
          // Overall stats
          overall: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } },
                overdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$completed', false] },
                          { $ne: ['$dueDate', null] },
                          { $lt: ['$dueDate', now] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
          // Average completion time (for completed tasks with both timestamps)
          avgCompletionTime: [
            {
              $match: {
                completed: true,
                completedAt: { $exists: true },
                createdAt: { $exists: true },
              },
            },
            {
              $project: {
                completionTimeMs: { $subtract: ['$completedAt', '$createdAt'] },
              },
            },
            {
              $group: {
                _id: null,
                avgMs: { $avg: '$completionTimeMs' },
                minMs: { $min: '$completionTimeMs' },
                maxMs: { $max: '$completionTimeMs' },
              },
            },
          ],
          // Daily breakdown for trend analysis
          dailyBreakdown: [
            { $match: { createdAt: { $gte: startDate } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                created: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]

    const [result] = await Task.aggregate(pipeline)

    const created = result.createdInPeriod[0]?.count || 0
    const completed = result.completedInPeriod[0]?.count || 0
    const overall = result.overall[0] || { total: 0, completed: 0, overdue: 0 }
    const avgTime = result.avgCompletionTime[0] || {
      avgMs: 0,
      minMs: 0,
      maxMs: 0,
    }

    const completionRate =
      overall.total > 0 ? (overall.completed / overall.total) * 100 : 0
    const overduePercentage =
      overall.total - overall.completed > 0
        ? (overall.overdue / (overall.total - overall.completed)) * 100
        : 0

    return {
      period,
      metrics: {
        tasksCreated: created,
        tasksCompleted: completed,
        totalTasks: overall.total,
        totalCompleted: overall.completed,
        totalOverdue: overall.overdue,
        completionRate: Math.round(completionRate * 10) / 10,
        overduePercentage: Math.round(overduePercentage * 10) / 10,
        avgCompletionTimeHours:
          Math.round((avgTime.avgMs / (1000 * 60 * 60)) * 10) / 10,
        minCompletionTimeHours:
          Math.round((avgTime.minMs / (1000 * 60 * 60)) * 10) / 10,
        maxCompletionTimeHours:
          Math.round((avgTime.maxMs / (1000 * 60 * 60)) * 10) / 10,
      },
      dailyBreakdown: result.dailyBreakdown,
      interpretation: this._interpretCompletionMetrics(
        completionRate,
        overduePercentage,
        created,
        completed
      ),
    }
  }

  /**
   * B. TIME-BASED PRODUCTIVITY
   * Measures: most productive hours, most productive days, completion time by hour bucket
   * Why: Identifies when you work best - enables scheduling optimization
   */
  async getTimePatterns(userId) {
    const pipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          completedAt: { $exists: true },
        },
      },
      {
        $facet: {
          // Completions by hour of day
          byHour: [
            {
              $group: {
                _id: { $hour: '$completedAt' },
                count: { $sum: 1 },
                avgCompletionTimeMs: {
                  $avg: { $subtract: ['$completedAt', '$createdAt'] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Completions by day of week (1=Sunday, 7=Saturday)
          byDayOfWeek: [
            {
              $group: {
                _id: { $dayOfWeek: '$completedAt' },
                count: { $sum: 1 },
                avgCompletionTimeMs: {
                  $avg: { $subtract: ['$completedAt', '$createdAt'] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Completions by hour bucket (morning, afternoon, evening, night)
          byTimeBucket: [
            {
              $addFields: {
                hourBucket: {
                  $switch: {
                    branches: [
                      {
                        case: { $lt: [{ $hour: '$completedAt' }, 6] },
                        then: 'night',
                      },
                      {
                        case: { $lt: [{ $hour: '$completedAt' }, 12] },
                        then: 'morning',
                      },
                      {
                        case: { $lt: [{ $hour: '$completedAt' }, 18] },
                        then: 'afternoon',
                      },
                      {
                        case: { $lt: [{ $hour: '$completedAt' }, 22] },
                        then: 'evening',
                      },
                    ],
                    default: 'night',
                  },
                },
              },
            },
            {
              $group: {
                _id: '$hourBucket',
                count: { $sum: 1 },
                avgCompletionTimeMs: {
                  $avg: { $subtract: ['$completedAt', '$createdAt'] },
                },
              },
            },
          ],
        },
      },
    ]

    const [result] = await Task.aggregate(pipeline)

    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]

    // Find most productive hour
    const mostProductiveHour = result.byHour.reduce(
      (max, curr) => (curr.count > (max?.count || 0) ? curr : max),
      null
    )

    // Find most productive day
    const mostProductiveDay = result.byDayOfWeek.reduce(
      (max, curr) => (curr.count > (max?.count || 0) ? curr : max),
      null
    )

    // Format hour data with labels
    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const found = result.byHour.find((h) => h._id === i)
      return {
        hour: i,
        label: `${i.toString().padStart(2, '0')}:00`,
        completions: found?.count || 0,
        avgCompletionTimeHours: found
          ? Math.round((found.avgCompletionTimeMs / (1000 * 60 * 60)) * 10) / 10
          : 0,
      }
    })

    // Format day data with labels
    const dailyData = result.byDayOfWeek.map((d) => ({
      dayOfWeek: d._id,
      dayName: dayNames[d._id - 1],
      completions: d.count,
      avgCompletionTimeHours:
        Math.round((d.avgCompletionTimeMs / (1000 * 60 * 60)) * 10) / 10,
    }))

    // Format bucket data
    const bucketOrder = ['morning', 'afternoon', 'evening', 'night']
    const bucketData = bucketOrder.map((bucket) => {
      const found = result.byTimeBucket.find((b) => b._id === bucket)
      return {
        bucket,
        label: bucket.charAt(0).toUpperCase() + bucket.slice(1),
        completions: found?.count || 0,
        avgCompletionTimeHours: found
          ? Math.round((found.avgCompletionTimeMs / (1000 * 60 * 60)) * 10) / 10
          : 0,
      }
    })

    return {
      mostProductiveHour: mostProductiveHour
        ? {
            hour: mostProductiveHour._id,
            label: `${mostProductiveHour._id.toString().padStart(2, '0')}:00`,
            completions: mostProductiveHour.count,
          }
        : null,
      mostProductiveDay: mostProductiveDay
        ? {
            dayOfWeek: mostProductiveDay._id,
            dayName: dayNames[mostProductiveDay._id - 1],
            completions: mostProductiveDay.count,
          }
        : null,
      hourlyDistribution: hourlyData,
      dailyDistribution: dailyData,
      timeBucketDistribution: bucketData,
      interpretation: this._interpretTimePatterns(
        mostProductiveHour,
        mostProductiveDay,
        bucketData
      ),
    }
  }

  /**
   * C. PRIORITY VS REALITY ANALYSIS
   * Measures: completion delay by priority, missed deadlines by priority, actual effort vs assigned priority
   * Why: Reveals if priority assignments match actual behavior - are "high priority" tasks really treated as urgent?
   */
  async getPriorityAnalysis(userId) {
    const now = new Date()

    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          // Stats by priority
          byPriority: [
            {
              $group: {
                _id: '$priority',
                total: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } },
                // Missed deadlines (overdue and not completed, or completed after due date)
                missedDeadlines: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ['$dueDate', null] },
                          {
                            $or: [
                              {
                                $and: [
                                  { $eq: ['$completed', false] },
                                  { $lt: ['$dueDate', now] },
                                ],
                              },
                              {
                                $and: [
                                  { $eq: ['$completed', true] },
                                  { $gt: ['$completedAt', '$dueDate'] },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                // Average completion time
                avgCompletionTimeMs: {
                  $avg: {
                    $cond: [
                      { $and: ['$completed', { $ne: ['$completedAt', null] }] },
                      { $subtract: ['$completedAt', '$createdAt'] },
                      null,
                    ],
                  },
                },
                // Average delay (for tasks with due dates that were completed)
                avgDelayMs: {
                  $avg: {
                    $cond: [
                      {
                        $and: [
                          '$completed',
                          { $ne: ['$dueDate', null] },
                          { $ne: ['$completedAt', null] },
                        ],
                      },
                      { $subtract: ['$completedAt', '$dueDate'] },
                      null,
                    ],
                  },
                },
                // Tasks with due dates
                withDueDate: {
                  $sum: { $cond: [{ $ne: ['$dueDate', null] }, 1, 0] },
                },
              },
            },
          ],
          // Time to start by priority (procrastination indicator)
          timeToStart: [
            {
              $match: { startedAt: { $exists: true } },
            },
            {
              $group: {
                _id: '$priority',
                avgTimeToStartMs: {
                  $avg: { $subtract: ['$startedAt', '$createdAt'] },
                },
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]

    const [result] = await Task.aggregate(pipeline)

    const priorities = ['high', 'medium', 'low']
    const priorityData = priorities.map((priority) => {
      const stats = result.byPriority.find((p) => p._id === priority) || {
        total: 0,
        completed: 0,
        missedDeadlines: 0,
        avgCompletionTimeMs: 0,
        avgDelayMs: 0,
        withDueDate: 0,
      }
      const timeToStart = result.timeToStart.find((t) => t._id === priority)

      const completionRate =
        stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
      const missedDeadlineRate =
        stats.withDueDate > 0
          ? (stats.missedDeadlines / stats.withDueDate) * 100
          : 0

      return {
        priority,
        total: stats.total,
        completed: stats.completed,
        completionRate: Math.round(completionRate * 10) / 10,
        missedDeadlines: stats.missedDeadlines,
        missedDeadlineRate: Math.round(missedDeadlineRate * 10) / 10,
        avgCompletionTimeHours: stats.avgCompletionTimeMs
          ? Math.round((stats.avgCompletionTimeMs / (1000 * 60 * 60)) * 10) / 10
          : 0,
        avgDelayHours: stats.avgDelayMs
          ? Math.round((stats.avgDelayMs / (1000 * 60 * 60)) * 10) / 10
          : 0,
        avgTimeToStartHours: timeToStart?.avgTimeToStartMs
          ? Math.round((timeToStart.avgTimeToStartMs / (1000 * 60 * 60)) * 10) /
            10
          : 0,
      }
    })

    // Calculate priority effectiveness score
    // High priority should have: higher completion rate, lower delay, faster start
    const highPriority = priorityData.find((p) => p.priority === 'high')
    const lowPriority = priorityData.find((p) => p.priority === 'low')
    const totalTasks = priorityData.reduce((sum, p) => sum + p.total, 0)

    // If no tasks, return 0 (no data to analyze)
    let priorityEffectiveness = 0

    if (totalTasks === 0) {
      // No data - return 0
      priorityEffectiveness = 0
    } else if (
      highPriority &&
      lowPriority &&
      highPriority.total > 0 &&
      lowPriority.total > 0
    ) {
      // We have both high and low priority tasks to compare
      priorityEffectiveness = 50 // Start at neutral when we have data

      // High priority should be completed faster
      if (
        highPriority.avgCompletionTimeHours < lowPriority.avgCompletionTimeHours
      ) {
        priorityEffectiveness += 15
      }
      // High priority should have higher completion rate
      if (highPriority.completionRate > lowPriority.completionRate) {
        priorityEffectiveness += 15
      }
      // High priority should be started sooner
      if (highPriority.avgTimeToStartHours < lowPriority.avgTimeToStartHours) {
        priorityEffectiveness += 10
      }
      // High priority should have fewer missed deadlines
      if (highPriority.missedDeadlineRate < lowPriority.missedDeadlineRate) {
        priorityEffectiveness += 10
      }
    } else if (totalTasks > 0) {
      // We have tasks but not enough variety to compare - calculate based on completion
      const overallCompletionRate =
        (priorityData.reduce((sum, p) => sum + p.completed, 0) / totalTasks) *
        100
      priorityEffectiveness = Math.round(overallCompletionRate)
    }

    return {
      byPriority: priorityData,
      priorityEffectivenessScore: Math.min(100, priorityEffectiveness),
      interpretation: this._interpretPriorityAnalysis(
        priorityData,
        priorityEffectiveness
      ),
    }
  }

  /**
   * D. FOCUS & CONTEXT SWITCHING ANALYSIS
   * Measures: category switches, average uninterrupted focus duration, frequently abandoned tasks
   * Why: Context switching is expensive - this reveals if you're fragmenting your attention
   */
  async getFocusAnalysis(userId) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const pipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          completedAt: { $gte: thirtyDaysAgo },
        },
      },
      { $sort: { completedAt: 1 } },
      {
        $group: {
          _id: null,
          tasks: {
            $push: {
              category: '$category',
              categories: '$categories',
              completedAt: '$completedAt',
            },
          },
        },
      },
    ]

    const [taskSequence] = await Task.aggregate(pipeline)

    // Calculate context switches (when consecutive tasks have different categories)
    let contextSwitches = 0
    let focusStreaks = []
    let currentStreak = 1

    if (taskSequence?.tasks?.length > 1) {
      const tasks = taskSequence.tasks
      for (let i = 1; i < tasks.length; i++) {
        const prevCat =
          tasks[i - 1].category?.toString() ||
          tasks[i - 1].categories?.[0]?.toString()
        const currCat =
          tasks[i].category?.toString() || tasks[i].categories?.[0]?.toString()

        if (prevCat !== currCat) {
          contextSwitches++
          focusStreaks.push(currentStreak)
          currentStreak = 1
        } else {
          currentStreak++
        }
      }
      focusStreaks.push(currentStreak)
    }

    // Get abandoned/reopened tasks
    const abandonedPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [
            { reopenCount: { $gt: 0 } },
            {
              $and: [
                { status: { $in: ['pending', 'in_progress'] } },
                {
                  createdAt: {
                    $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              ],
            },
          ],
        },
      },
      {
        $facet: {
          reopened: [
            { $match: { reopenCount: { $gt: 0 } } },
            { $sort: { reopenCount: -1 } },
            { $limit: 10 },
            { $project: { title: 1, reopenCount: 1, status: 1, createdAt: 1 } },
          ],
          stale: [
            {
              $match: {
                completed: false,
                createdAt: {
                  $lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            { $sort: { createdAt: 1 } },
            { $limit: 10 },
            {
              $project: {
                title: 1,
                status: 1,
                createdAt: 1,
                daysOld: {
                  $divide: [
                    { $subtract: [now, '$createdAt'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
            },
          ],
        },
      },
    ]

    const [abandonedResult] = await Task.aggregate(abandonedPipeline)

    // Category distribution for focus analysis
    const categoryPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          completedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $ifNull: ['$category', { $arrayElemAt: ['$categories', 0] }] },
          count: { $sum: 1 },
          avgCompletionTimeMs: {
            $avg: { $subtract: ['$completedAt', '$createdAt'] },
          },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $sort: { count: -1 } },
    ]

    const categoryDistribution = await Task.aggregate(categoryPipeline)

    const avgFocusStreak =
      focusStreaks.length > 0
        ? focusStreaks.reduce((a, b) => a + b, 0) / focusStreaks.length
        : 0
    const maxFocusStreak =
      focusStreaks.length > 0 ? Math.max(...focusStreaks) : 0
    const totalTasksInPeriod = taskSequence?.tasks?.length || 0
    const contextSwitchRate =
      totalTasksInPeriod > 1
        ? (contextSwitches / (totalTasksInPeriod - 1)) * 100
        : 0

    return {
      contextSwitches,
      contextSwitchRate: Math.round(contextSwitchRate * 10) / 10,
      avgFocusStreak: Math.round(avgFocusStreak * 10) / 10,
      maxFocusStreak,
      totalTasksAnalyzed: totalTasksInPeriod,
      frequentlyReopenedTasks: abandonedResult?.reopened || [],
      staleTasks: abandonedResult?.stale || [],
      categoryDistribution: categoryDistribution.map((c) => ({
        categoryId: c._id,
        categoryName: c.categoryInfo?.[0]?.name || 'Uncategorized',
        taskCount: c.count,
        avgCompletionTimeHours: c.avgCompletionTimeMs
          ? Math.round((c.avgCompletionTimeMs / (1000 * 60 * 60)) * 10) / 10
          : 0,
      })),
      interpretation: this._interpretFocusAnalysis(
        contextSwitchRate,
        avgFocusStreak,
        abandonedResult
      ),
    }
  }

  /**
   * E. GOAL ALIGNMENT ANALYSIS
   * Measures: weekly goals, tasks linked to goals, goal completion rate, task-to-goal alignment ratio
   * Why: Are your daily tasks actually moving you toward your stated goals?
   */
  async getGoalAlignment(userId) {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get goals with their linked tasks
    const goalPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          $or: [{ status: 'active' }, { endDate: { $gte: thirtyDaysAgo } }],
        },
      },
      {
        $lookup: {
          from: 'tasks',
          let: { goalId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$goalId', '$$goalId'] },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: ['$completed', 1, 0] } },
              },
            },
          ],
          as: 'taskStats',
        },
      },
      {
        $project: {
          title: 1,
          type: 1,
          status: 1,
          startDate: 1,
          endDate: 1,
          targetTaskCount: 1,
          linkedTasks: {
            $ifNull: [{ $arrayElemAt: ['$taskStats.total', 0] }, 0],
          },
          completedTasks: {
            $ifNull: [{ $arrayElemAt: ['$taskStats.completed', 0] }, 0],
          },
        },
      },
    ]

    const goals = await Goal.aggregate(goalPipeline)

    // Get task alignment stats
    const taskAlignmentPipeline = [
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          linkedToGoal: {
            $sum: { $cond: [{ $ne: ['$goalId', null] }, 1, 0] },
          },
          completedLinked: {
            $sum: {
              $cond: [
                { $and: ['$completed', { $ne: ['$goalId', null] }] },
                1,
                0,
              ],
            },
          },
          completedUnlinked: {
            $sum: {
              $cond: [
                { $and: ['$completed', { $eq: ['$goalId', null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]

    const [taskAlignment] = await Task.aggregate(taskAlignmentPipeline)

    const totalTasks = taskAlignment?.total || 0
    const linkedTasks = taskAlignment?.linkedToGoal || 0
    const alignmentRatio = totalTasks > 0 ? (linkedTasks / totalTasks) * 100 : 0

    // Calculate goal completion rates
    const activeGoals = goals.filter((g) => g.status === 'active')
    const completedGoals = goals.filter((g) => g.status === 'completed')
    const avgGoalProgress =
      activeGoals.length > 0
        ? activeGoals.reduce((sum, g) => {
            const progress =
              g.targetTaskCount > 0
                ? (g.completedTasks / g.targetTaskCount) * 100
                : g.linkedTasks > 0
                ? (g.completedTasks / g.linkedTasks) * 100
                : 0
            return sum + progress
          }, 0) / activeGoals.length
        : 0

    return {
      goals: goals.map((g) => ({
        ...g,
        completionRate:
          g.linkedTasks > 0
            ? Math.round((g.completedTasks / g.linkedTasks) * 100 * 10) / 10
            : 0,
        progress:
          g.targetTaskCount > 0
            ? Math.round((g.completedTasks / g.targetTaskCount) * 100 * 10) / 10
            : g.linkedTasks > 0
            ? Math.round((g.completedTasks / g.linkedTasks) * 100 * 10) / 10
            : 0,
      })),
      summary: {
        totalGoals: goals.length,
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        avgGoalProgress: Math.round(avgGoalProgress * 10) / 10,
        totalTasksInPeriod: totalTasks,
        tasksLinkedToGoals: linkedTasks,
        alignmentRatio: Math.round(alignmentRatio * 10) / 10,
      },
      interpretation: this._interpretGoalAlignment(
        alignmentRatio,
        avgGoalProgress,
        goals.length
      ),
    }
  }

  /**
   * F. PROCRASTINATION DETECTION
   * Measures: tasks postponed >3 times, tasks overdue >X days, tasks created but never started
   * Why: Identifies avoidance patterns - which tasks are you avoiding and why?
   */
  async getProcrastinationAnalysis(userId) {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const pipeline = [
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          // Tasks postponed more than 3 times
          frequentlyPostponed: [
            { $match: { postponeCount: { $gt: 3 } } },
            { $sort: { postponeCount: -1 } },
            { $limit: 10 },
            {
              $project: {
                title: 1,
                priority: 1,
                postponeCount: 1,
                dueDate: 1,
                status: 1,
                createdAt: 1,
              },
            },
          ],
          // Tasks overdue more than 7 days
          severelyOverdue: [
            {
              $match: {
                completed: false,
                dueDate: { $lt: sevenDaysAgo },
              },
            },
            {
              $addFields: {
                daysOverdue: {
                  $divide: [
                    { $subtract: [now, '$dueDate'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
            },
            { $sort: { daysOverdue: -1 } },
            { $limit: 10 },
            {
              $project: {
                title: 1,
                priority: 1,
                dueDate: 1,
                daysOverdue: 1,
                createdAt: 1,
              },
            },
          ],
          // Tasks created but never started (pending for >3 days)
          neverStarted: [
            {
              $match: {
                status: 'pending',
                startedAt: { $exists: false },
                createdAt: {
                  $lt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $addFields: {
                daysSinceCreation: {
                  $divide: [
                    { $subtract: [now, '$createdAt'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
            },
            { $sort: { daysSinceCreation: -1 } },
            { $limit: 10 },
            {
              $project: {
                title: 1,
                priority: 1,
                daysSinceCreation: 1,
                createdAt: 1,
              },
            },
          ],
          // Overall procrastination stats
          stats: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                totalPostponed: {
                  $sum: { $cond: [{ $gt: ['$postponeCount', 0] }, 1, 0] },
                },
                frequentlyPostponed: {
                  $sum: { $cond: [{ $gt: ['$postponeCount', 3] }, 1, 0] },
                },
                totalOverdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$completed', false] },
                          { $ne: ['$dueDate', null] },
                          { $lt: ['$dueDate', now] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                severelyOverdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$completed', false] },
                          { $ne: ['$dueDate', null] },
                          { $lt: ['$dueDate', sevenDaysAgo] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                neverStarted: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'pending'] },
                          { $not: { $ifNull: ['$startedAt', false] } },
                          {
                            $lt: [
                              '$createdAt',
                              new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
                            ],
                          },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                avgPostponeCount: { $avg: '$postponeCount' },
              },
            },
          ],
          // Procrastination by priority (are high priority tasks being avoided?)
          byPriority: [
            {
              $group: {
                _id: '$priority',
                totalPostponed: {
                  $sum: { $cond: [{ $gt: ['$postponeCount', 0] }, 1, 0] },
                },
                avgPostponeCount: { $avg: '$postponeCount' },
                overdue: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$completed', false] },
                          { $ne: ['$dueDate', null] },
                          { $lt: ['$dueDate', now] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]

    const [result] = await Task.aggregate(pipeline)
    const stats = result.stats[0] || {
      totalTasks: 0,
      totalPostponed: 0,
      frequentlyPostponed: 0,
      totalOverdue: 0,
      severelyOverdue: 0,
      neverStarted: 0,
      avgPostponeCount: 0,
    }

    // Calculate procrastination score (0-100, higher = more procrastination)
    let procrastinationScore = 0
    if (stats.totalTasks > 0) {
      const postponeRate = (stats.totalPostponed / stats.totalTasks) * 100
      const overdueRate = (stats.totalOverdue / stats.totalTasks) * 100
      const neverStartedRate = (stats.neverStarted / stats.totalTasks) * 100

      procrastinationScore = Math.min(
        100,
        Math.round(
          postponeRate * 0.3 + overdueRate * 0.4 + neverStartedRate * 0.3
        )
      )
    }

    return {
      frequentlyPostponedTasks: result.frequentlyPostponed.map((t) => ({
        ...t,
        daysOverdue: t.dueDate
          ? Math.max(0, Math.floor((now - t.dueDate) / (1000 * 60 * 60 * 24)))
          : 0,
      })),
      severelyOverdueTasks: result.severelyOverdue.map((t) => ({
        ...t,
        daysOverdue: Math.round(t.daysOverdue),
      })),
      neverStartedTasks: result.neverStarted.map((t) => ({
        ...t,
        daysSinceCreation: Math.round(t.daysSinceCreation),
      })),
      stats: {
        totalTasks: stats.totalTasks,
        tasksPostponed: stats.totalPostponed,
        frequentlyPostponed: stats.frequentlyPostponed,
        totalOverdue: stats.totalOverdue,
        severelyOverdue: stats.severelyOverdue,
        neverStarted: stats.neverStarted,
        avgPostponeCount: Math.round(stats.avgPostponeCount * 10) / 10,
      },
      byPriority: result.byPriority.map((p) => ({
        priority: p._id || 'medium',
        tasksPostponed: p.totalPostponed,
        avgPostponeCount: Math.round((p.avgPostponeCount || 0) * 10) / 10,
        overdue: p.overdue,
      })),
      procrastinationScore,
      interpretation: this._interpretProcrastination(
        procrastinationScore,
        stats,
        result.byPriority
      ),
    }
  }

  /**
   * PRODUCTIVITY SCORE - Transparent, Justified Calculation
   *
   * Formula:
   *   Score = (CompletionRate × 0.30) + (OnTimeRate × 0.25) + (FocusScore × 0.20) + (100 - ProcrastinationScore) × 0.25
   *
   * Weights Justification:
   * - Completion Rate (30%): Core measure - are you finishing tasks?
   * - On-Time Rate (25%): Deadline adherence - are you meeting commitments?
   * - Focus Score (20%): Deep work indicator - are you avoiding context switching?
   * - Anti-Procrastination (25%): Behavioral health - are you avoiding avoidance?
   *
   * Each component is normalized to 0-100 scale.
   */
  async getProductivityScore(userId) {
    // Get all component metrics
    const [completion, _timePatterns, _priority, focus, procrastination] =
      await Promise.all([
        this.getCompletionAnalytics(userId, 'weekly'),
        this.getTimePatterns(userId),
        this.getPriorityAnalysis(userId),
        this.getFocusAnalysis(userId),
        this.getProcrastinationAnalysis(userId),
      ])

    // Check if user has any data to analyze
    const hasData = completion.metrics.total > 0

    // Component 1: Completion Rate (0-100)
    const completionRate = hasData ? completion.metrics.completionRate : 0

    // Component 2: On-Time Rate (0-100)
    // If no tasks with due dates, this should be 0 (no data), not 100
    const hasOverdueData = completion.metrics.total > 0
    const onTimeRate = hasOverdueData
      ? 100 - completion.metrics.overduePercentage
      : 0

    // Component 3: Focus Score (0-100)
    // Based on context switch rate (lower is better) and average focus streak
    // If no tasks analyzed, score should be 0 (no data)
    const hasFocusData = focus.totalTasksAnalyzed > 0
    let focusScore = 0
    if (hasFocusData) {
      const contextSwitchPenalty = Math.min(focus.contextSwitchRate, 100)
      const focusBonus = Math.min(focus.avgFocusStreak * 10, 50) // Max 50 points from streaks
      focusScore = Math.max(
        0,
        Math.min(100, 100 - contextSwitchPenalty + focusBonus)
      )
    }

    // Component 4: Anti-Procrastination Score (0-100)
    // If no tasks, score should be 0 (no data), not 100
    const hasProcrastinationData = procrastination.stats.totalTasks > 0
    const antiProcrastinationScore = hasProcrastinationData
      ? 100 - procrastination.procrastinationScore
      : 0

    // Calculate weighted score
    const weights = {
      completion: 0.3,
      onTime: 0.25,
      focus: 0.2,
      antiProcrastination: 0.25,
    }

    // If no data at all, return 0 score
    if (!hasData) {
      return {
        score: 0,
        grade: 'N/A',
        gradeDescription:
          'No data available - complete some tasks to see your score',
        components: {
          completionRate: {
            value: 0,
            weight: weights.completion,
            contribution: 0,
            description: 'Percentage of tasks completed',
          },
          onTimeRate: {
            value: 0,
            weight: weights.onTime,
            contribution: 0,
            description: 'Percentage of tasks completed by deadline',
          },
          focusScore: {
            value: 0,
            weight: weights.focus,
            contribution: 0,
            description: 'Measure of sustained focus (low context switching)',
          },
          antiProcrastinationScore: {
            value: 0,
            weight: weights.antiProcrastination,
            contribution: 0,
            description: 'Inverse of procrastination behaviors',
          },
        },
        formula:
          'Score = (CompletionRate × 0.30) + (OnTimeRate × 0.25) + (FocusScore × 0.20) + (AntiProcrastination × 0.25)',
        interpretation:
          'Start completing tasks to see your productivity score.',
      }
    }

    const weightedScore =
      completionRate * weights.completion +
      onTimeRate * weights.onTime +
      focusScore * weights.focus +
      antiProcrastinationScore * weights.antiProcrastination

    const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)))

    // Determine grade
    let grade, gradeDescription
    if (finalScore >= 90) {
      grade = 'A+'
      gradeDescription = 'Exceptional productivity'
    } else if (finalScore >= 80) {
      grade = 'A'
      gradeDescription = 'Excellent productivity'
    } else if (finalScore >= 70) {
      grade = 'B'
      gradeDescription = 'Good productivity'
    } else if (finalScore >= 60) {
      grade = 'C'
      gradeDescription = 'Average productivity'
    } else if (finalScore >= 50) {
      grade = 'D'
      gradeDescription = 'Below average productivity'
    } else {
      grade = 'F'
      gradeDescription = 'Needs significant improvement'
    }

    return {
      score: finalScore,
      grade,
      gradeDescription,
      components: {
        completionRate: {
          value: Math.round(completionRate * 10) / 10,
          weight: weights.completion,
          contribution:
            Math.round(completionRate * weights.completion * 10) / 10,
          description: 'Percentage of tasks completed',
        },
        onTimeRate: {
          value: Math.round(onTimeRate * 10) / 10,
          weight: weights.onTime,
          contribution: Math.round(onTimeRate * weights.onTime * 10) / 10,
          description: 'Percentage of tasks completed by deadline',
        },
        focusScore: {
          value: Math.round(focusScore * 10) / 10,
          weight: weights.focus,
          contribution: Math.round(focusScore * weights.focus * 10) / 10,
          description: 'Measure of sustained focus (low context switching)',
        },
        antiProcrastinationScore: {
          value: Math.round(antiProcrastinationScore * 10) / 10,
          weight: weights.antiProcrastination,
          contribution:
            Math.round(
              antiProcrastinationScore * weights.antiProcrastination * 10
            ) / 10,
          description: 'Inverse of procrastination behaviors',
        },
      },
      formula:
        'Score = (CompletionRate × 0.30) + (OnTimeRate × 0.25) + (FocusScore × 0.20) + (AntiProcrastination × 0.25)',
      interpretation: this._interpretProductivityScore(finalScore, {
        completionRate,
        onTimeRate,
        focusScore,
        antiProcrastinationScore,
      }),
    }
  }

  /**
   * WEEKLY/MONTHLY REPORT GENERATOR
   * Generates structured, data-driven reports with NO generic text.
   * Every sentence is tied to actual metrics.
   */
  async generateReport(userId, type = 'weekly') {
    const period = type === 'monthly' ? 'monthly' : 'weekly'

    // Gather all analytics
    const [
      completion,
      timePatterns,
      priority,
      focus,
      goals,
      procrastination,
      productivityScore,
    ] = await Promise.all([
      this.getCompletionAnalytics(userId, period),
      this.getTimePatterns(userId),
      this.getPriorityAnalysis(userId),
      this.getFocusAnalysis(userId),
      this.getGoalAlignment(userId),
      this.getProcrastinationAnalysis(userId),
      this.getProductivityScore(userId),
    ])

    // Generate summary paragraph (data-driven)
    const summaryParts = []

    summaryParts.push(
      `This ${period} period, you completed ${completion.metrics.tasksCompleted} out of ${completion.metrics.tasksCreated} tasks created, ` +
        `achieving a ${completion.metrics.completionRate}% completion rate.`
    )

    if (timePatterns.mostProductiveDay) {
      summaryParts.push(
        `Your most productive day was ${timePatterns.mostProductiveDay.dayName} with ${timePatterns.mostProductiveDay.completions} completions.`
      )
    }

    if (timePatterns.mostProductiveHour) {
      summaryParts.push(
        `Peak productivity occurred at ${timePatterns.mostProductiveHour.label}.`
      )
    }

    if (completion.metrics.avgCompletionTimeHours > 0) {
      summaryParts.push(
        `Average task completion time was ${completion.metrics.avgCompletionTimeHours} hours.`
      )
    }

    // Key Wins (data-driven)
    const wins = []

    if (completion.metrics.completionRate >= 70) {
      wins.push({
        metric: 'High Completion Rate',
        value: `${completion.metrics.completionRate}%`,
        detail: 'You completed more than 70% of your tasks',
      })
    }

    if (productivityScore.score >= 70) {
      wins.push({
        metric: 'Strong Productivity Score',
        value: `${productivityScore.score}/100 (${productivityScore.grade})`,
        detail: productivityScore.gradeDescription,
      })
    }

    if (focus.avgFocusStreak >= 3) {
      wins.push({
        metric: 'Good Focus Consistency',
        value: `${focus.avgFocusStreak} tasks average`,
        detail: 'You maintained focus on similar tasks before switching',
      })
    }

    const highPriority = priority.byPriority.find((p) => p.priority === 'high')
    if (highPriority && highPriority.completionRate >= 80) {
      wins.push({
        metric: 'High Priority Execution',
        value: `${highPriority.completionRate}% completion`,
        detail: 'You effectively handled high-priority tasks',
      })
    }

    if (procrastination.procrastinationScore <= 20) {
      wins.push({
        metric: 'Low Procrastination',
        value: `Score: ${procrastination.procrastinationScore}/100`,
        detail: 'Minimal task avoidance behavior detected',
      })
    }

    // Bottlenecks (data-driven)
    const bottlenecks = []

    if (completion.metrics.overduePercentage > 20) {
      bottlenecks.push({
        metric: 'High Overdue Rate',
        value: `${completion.metrics.overduePercentage}%`,
        detail: `${completion.metrics.totalOverdue} tasks are past their due date`,
        severity: completion.metrics.overduePercentage > 40 ? 'high' : 'medium',
      })
    }

    if (procrastination.stats.frequentlyPostponed > 0) {
      bottlenecks.push({
        metric: 'Frequently Postponed Tasks',
        value: `${procrastination.stats.frequentlyPostponed} tasks`,
        detail: 'Tasks postponed more than 3 times indicate avoidance',
        severity:
          procrastination.stats.frequentlyPostponed > 5 ? 'high' : 'medium',
      })
    }

    if (focus.contextSwitchRate > 50) {
      bottlenecks.push({
        metric: 'High Context Switching',
        value: `${focus.contextSwitchRate}% switch rate`,
        detail: 'Frequent category changes reduce deep work efficiency',
        severity: focus.contextSwitchRate > 70 ? 'high' : 'medium',
      })
    }

    if (procrastination.stats.neverStarted > 3) {
      bottlenecks.push({
        metric: 'Stale Tasks',
        value: `${procrastination.stats.neverStarted} tasks`,
        detail: 'Tasks created but never started for over 3 days',
        severity: procrastination.stats.neverStarted > 10 ? 'high' : 'medium',
      })
    }

    if (goals.summary.alignmentRatio < 30 && goals.summary.totalGoals > 0) {
      bottlenecks.push({
        metric: 'Low Goal Alignment',
        value: `${goals.summary.alignmentRatio}%`,
        detail: 'Most tasks are not linked to your stated goals',
        severity: 'medium',
      })
    }

    // Actionable Suggestions (specific, not generic)
    const suggestions = []

    if (timePatterns.mostProductiveHour) {
      suggestions.push({
        action: 'Schedule Important Tasks',
        detail: `Block ${timePatterns.mostProductiveHour.label} for high-priority work based on your completion patterns`,
        basedOn: `${timePatterns.mostProductiveHour.completions} tasks completed at this hour`,
      })
    }

    if (procrastination.frequentlyPostponedTasks.length > 0) {
      const topPostponed = procrastination.frequentlyPostponedTasks[0]
      suggestions.push({
        action: 'Address Avoided Task',
        detail: `"${topPostponed.title}" has been postponed ${topPostponed.postponeCount} times. Consider breaking it into smaller subtasks or delegating.`,
        basedOn: 'Frequently postponed task analysis',
      })
    }

    if (focus.contextSwitchRate > 40) {
      suggestions.push({
        action: 'Batch Similar Tasks',
        detail:
          'Group tasks by category and complete them in focused blocks to reduce context switching',
        basedOn: `Current context switch rate: ${focus.contextSwitchRate}%`,
      })
    }

    if (highPriority && highPriority.avgTimeToStartHours > 24) {
      suggestions.push({
        action: 'Start High-Priority Tasks Sooner',
        detail: `High-priority tasks take ${highPriority.avgTimeToStartHours} hours on average to start. Consider tackling them first thing.`,
        basedOn: 'Priority vs Reality analysis',
      })
    }

    if (goals.summary.alignmentRatio < 50 && goals.summary.totalGoals > 0) {
      suggestions.push({
        action: 'Link Tasks to Goals',
        detail: `Only ${goals.summary.alignmentRatio}% of tasks are linked to goals. When creating tasks, assign them to relevant goals.`,
        basedOn: 'Goal alignment analysis',
      })
    }

    return {
      reportType: type,
      generatedAt: new Date().toISOString(),
      period: {
        type: period,
        tasksAnalyzed: completion.metrics.totalTasks,
      },
      summary: summaryParts.join(' '),
      productivityScore: {
        score: productivityScore.score,
        grade: productivityScore.grade,
        description: productivityScore.gradeDescription,
      },
      keyWins: wins,
      bottlenecks: bottlenecks.sort(
        (a, b) =>
          (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0)
      ),
      actionableSuggestions: suggestions,
      detailedMetrics: {
        completion: completion.metrics,
        timePatterns: {
          mostProductiveHour: timePatterns.mostProductiveHour,
          mostProductiveDay: timePatterns.mostProductiveDay,
        },
        priority: priority.byPriority,
        focus: {
          contextSwitchRate: focus.contextSwitchRate,
          avgFocusStreak: focus.avgFocusStreak,
        },
        procrastination: procrastination.stats,
        goals: goals.summary,
      },
    }
  }

  // ============ INTERPRETATION HELPERS ============
  // These generate human-readable explanations tied to actual data

  _interpretCompletionMetrics(
    completionRate,
    overduePercentage,
    created,
    completed
  ) {
    const parts = []

    if (completionRate >= 80) {
      parts.push(
        `Strong completion rate of ${completionRate.toFixed(
          1
        )}% indicates effective task execution.`
      )
    } else if (completionRate >= 50) {
      parts.push(
        `Completion rate of ${completionRate.toFixed(
          1
        )}% shows moderate task throughput.`
      )
    } else {
      parts.push(
        `Low completion rate of ${completionRate.toFixed(
          1
        )}% suggests task overload or scope issues.`
      )
    }

    if (overduePercentage > 30) {
      parts.push(
        `High overdue rate (${overduePercentage.toFixed(
          1
        )}%) indicates deadline management issues.`
      )
    }

    if (created > completed * 2) {
      parts.push(
        `Creating tasks faster than completing them (${created} created vs ${completed} completed).`
      )
    }

    return parts.join(' ')
  }

  _interpretTimePatterns(mostProductiveHour, mostProductiveDay, bucketData) {
    const parts = []

    if (mostProductiveHour) {
      const hour = mostProductiveHour._id
      if (hour >= 6 && hour < 12) {
        parts.push(
          'Morning productivity peak suggests you are a morning person.'
        )
      } else if (hour >= 12 && hour < 18) {
        parts.push(
          'Afternoon productivity peak indicates post-lunch effectiveness.'
        )
      } else if (hour >= 18 && hour < 22) {
        parts.push(
          'Evening productivity peak suggests you work better later in the day.'
        )
      } else {
        parts.push(
          'Late night productivity peak - consider if this aligns with your health goals.'
        )
      }
    }

    if (mostProductiveDay) {
      const dayNum = mostProductiveDay._id
      if (dayNum === 1 || dayNum === 7) {
        parts.push(
          'Weekend productivity is high - you may be catching up on tasks.'
        )
      } else if (dayNum === 2) {
        parts.push('Monday productivity suggests strong week starts.')
      } else if (dayNum === 6) {
        parts.push(
          'Friday productivity indicates end-of-week push to complete tasks.'
        )
      }
    }

    return parts.join(' ') || 'Insufficient data to determine time patterns.'
  }

  _interpretPriorityAnalysis(priorityData, effectivenessScore) {
    const parts = []
    const high = priorityData.find((p) => p.priority === 'high')
    const low = priorityData.find((p) => p.priority === 'low')

    if (effectivenessScore >= 70) {
      parts.push(
        'Priority system is working well - high priority tasks are being handled appropriately.'
      )
    } else if (effectivenessScore >= 50) {
      parts.push('Priority system is moderately effective.')
    } else {
      parts.push(
        'Priority assignments may not reflect actual task importance or urgency.'
      )
    }

    if (high && low) {
      if (high.avgCompletionTimeHours > low.avgCompletionTimeHours) {
        parts.push(
          'High priority tasks take longer than low priority - consider if they are appropriately scoped.'
        )
      }
      if (high.missedDeadlineRate > low.missedDeadlineRate) {
        parts.push(
          'High priority tasks miss more deadlines - may indicate unrealistic expectations.'
        )
      }
    }

    return parts.join(' ')
  }

  _interpretFocusAnalysis(contextSwitchRate, avgFocusStreak, abandonedResult) {
    const parts = []

    if (contextSwitchRate < 30) {
      parts.push('Low context switching indicates good focus discipline.')
    } else if (contextSwitchRate < 60) {
      parts.push(
        'Moderate context switching - some room for improvement in batching similar tasks.'
      )
    } else {
      parts.push('High context switching rate reduces deep work effectiveness.')
    }

    if (avgFocusStreak >= 5) {
      parts.push(
        `Strong focus streaks (avg ${avgFocusStreak.toFixed(
          1
        )} tasks) before switching categories.`
      )
    }

    if (abandonedResult?.reopened?.length > 3) {
      parts.push(
        'Multiple reopened tasks suggest unclear completion criteria or premature marking as done.'
      )
    }

    if (abandonedResult?.stale?.length > 5) {
      parts.push(
        'Several stale tasks may indicate over-commitment or unclear priorities.'
      )
    }

    return parts.join(' ')
  }

  _interpretGoalAlignment(alignmentRatio, avgProgress, totalGoals) {
    if (totalGoals === 0) {
      return 'No goals defined. Consider setting weekly goals to improve task alignment and purpose.'
    }

    const parts = []

    if (alignmentRatio >= 70) {
      parts.push(
        `Strong goal alignment (${alignmentRatio.toFixed(
          1
        )}%) - most tasks contribute to stated objectives.`
      )
    } else if (alignmentRatio >= 40) {
      parts.push(
        `Moderate goal alignment (${alignmentRatio.toFixed(
          1
        )}%) - consider linking more tasks to goals.`
      )
    } else {
      parts.push(
        `Low goal alignment (${alignmentRatio.toFixed(
          1
        )}%) - daily tasks may not be moving you toward goals.`
      )
    }

    if (avgProgress >= 70) {
      parts.push('Good progress on active goals.')
    } else if (avgProgress < 30) {
      parts.push(
        'Goals are progressing slowly - may need to prioritize goal-linked tasks.'
      )
    }

    return parts.join(' ')
  }

  _interpretProcrastination(score, stats, byPriority) {
    const parts = []

    if (score <= 20) {
      parts.push(
        'Minimal procrastination detected - good task initiation habits.'
      )
    } else if (score <= 50) {
      parts.push(
        'Moderate procrastination patterns - some tasks are being avoided.'
      )
    } else {
      parts.push(
        'Significant procrastination detected - consider addressing root causes.'
      )
    }

    if (stats.frequentlyPostponed > 0) {
      parts.push(
        `${stats.frequentlyPostponed} tasks have been postponed more than 3 times.`
      )
    }

    if (stats.neverStarted > 0) {
      parts.push(`${stats.neverStarted} tasks were created but never started.`)
    }

    // Check if high priority tasks are being avoided
    const highPriority = byPriority.find((p) => p._id === 'high')
    if (highPriority && highPriority.avgPostponeCount > 2) {
      parts.push(
        'High priority tasks are being postponed frequently - may indicate task anxiety or unclear requirements.'
      )
    }

    return parts.join(' ')
  }

  _interpretProductivityScore(score, components) {
    const parts = []

    if (score >= 80) {
      parts.push('Excellent overall productivity.')
    } else if (score >= 60) {
      parts.push('Good productivity with room for improvement.')
    } else if (score >= 40) {
      parts.push('Moderate productivity - focus on the weakest component.')
    } else {
      parts.push('Productivity needs attention across multiple areas.')
    }

    // Identify weakest component
    const componentScores = [
      { name: 'Completion Rate', value: components.completionRate },
      { name: 'On-Time Rate', value: components.onTimeRate },
      { name: 'Focus Score', value: components.focusScore },
      {
        name: 'Anti-Procrastination',
        value: components.antiProcrastinationScore,
      },
    ]

    const weakest = componentScores.reduce((min, curr) =>
      curr.value < min.value ? curr : min
    )

    if (weakest.value < 50) {
      parts.push(
        `Weakest area: ${weakest.name} (${weakest.value.toFixed(1)}%).`
      )
    }

    return parts.join(' ')
  }
}

module.exports = new AnalyticsService()
