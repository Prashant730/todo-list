/**
 * DEEP ANALYSIS REPORT COMPONENT
 *
 * Displays comprehensive productivity analytics fetched from backend.
 * NO frontend computation - all data comes from API.
 * Each chart represents ONE clear insight with explanation.
 */

import { useState, useEffect } from 'react'
import {
  FiTrendingUp, FiClock, FiTarget, FiZap, FiRefreshCw,
  FiBarChart2, FiPieChart, FiActivity, FiCalendar, FiAward,
  FiAlertTriangle, FiCheckCircle, FiXCircle, FiArrowUp, FiArrowDown
} from 'react-icons/fi'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts'
import analyticsApi from '../services/analyticsApi'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function DeepAnalysisReport() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState('overview')
  const [report, setReport] = useState(null)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [comprehensive, weeklyReport] = await Promise.all([
        analyticsApi.getComprehensive(),
        analyticsApi.getWeeklyReport()
      ])
      setAnalytics(comprehensive)
      setReport(weeklyReport)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiRefreshCw className="animate-spin text-blue-500" size={32} />
        <span className="ml-3 text-[var(--text-secondary)]">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
        <FiAlertTriangle className="mx-auto text-red-500 mb-3" size={32} />
        <p className="text-red-500">{error}</p>
        <button onClick={fetchAnalytics} className="mt-4 btn-primary px-4 py-2 rounded-lg">
          Retry
        </button>
      </div>
    )
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
    { id: 'completion', label: 'Completion', icon: FiCheckCircle },
    { id: 'time', label: 'Time Patterns', icon: FiClock },
    { id: 'priority', label: 'Priority', icon: FiTarget },
    { id: 'focus', label: 'Focus', icon: FiActivity },
    { id: 'procrastination', label: 'Procrastination', icon: FiAlertTriangle },
    { id: 'report', label: 'Weekly Report', icon: FiCalendar }
  ]

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-4">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeSection === section.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
        <button
          onClick={fetchAnalytics}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
        >
          <FiRefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* OVERVIEW SECTION */}
      {activeSection === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Productivity Score Card */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FiAward className="text-yellow-500" />
                  Productivity Score
                </h2>
                <p className="text-[var(--text-secondary)] mt-1">
                  {analytics.productivityScore.formula}
                </p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-green-500">
                  {analytics.productivityScore.score}
                </div>
                <div className="text-xl font-semibold text-[var(--text-secondary)]">
                  Grade: {analytics.productivityScore.grade}
                </div>
              </div>
            </div>

            {/* Score Components */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {Object.entries(analytics.productivityScore.components).map(([key, comp]) => (
                <div key={key} className="bg-[var(--bg-primary)] p-4 rounded-lg">
                  <div className="text-sm text-[var(--text-secondary)]">{comp.description}</div>
                  <div className="text-2xl font-bold mt-1">{comp.value}%</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    Weight: {(comp.weight * 100).toFixed(0)}% → {comp.contribution.toFixed(1)} pts
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm bg-[var(--bg-primary)] p-3 rounded-lg">
              {analytics.productivityScore.interpretation}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Completion Rate"
              value={`${analytics.completion.metrics.completionRate}%`}
              icon={FiCheckCircle}
              color="green"
            />
            <StatCard
              label="Overdue Tasks"
              value={analytics.completion.metrics.totalOverdue}
              icon={FiAlertTriangle}
              color="red"
            />
            <StatCard
              label="Avg Completion Time"
              value={`${analytics.completion.metrics.avgCompletionTimeHours}h`}
              icon={FiClock}
              color="blue"
            />
            <StatCard
              label="Context Switch Rate"
              value={`${analytics.focus.contextSwitchRate}%`}
              icon={FiActivity}
              color="purple"
            />
          </div>
        </div>
      )}

      {/* COMPLETION ANALYTICS SECTION */}
      {activeSection === 'completion' && analytics && (
        <div className="space-y-6">
          <SectionHeader
            title="Completion Analytics"
            description="Tasks created vs completed, completion rate, overdue percentage"
          />

          {/* Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard label="Tasks Created" value={analytics.completion.metrics.tasksCreated} />
            <MetricCard label="Tasks Completed" value={analytics.completion.metrics.tasksCompleted} />
            <MetricCard label="Completion Rate" value={`${analytics.completion.metrics.completionRate}%`} />
            <MetricCard label="Overdue %" value={`${analytics.completion.metrics.overduePercentage}%`} />
            <MetricCard label="Avg Time" value={`${analytics.completion.metrics.avgCompletionTimeHours}h`} />
          </div>

          {/* Daily Breakdown Chart */}
          {analytics.completion.dailyBreakdown?.length > 0 && (
            <ChartCard title="Daily Task Creation vs Completion" explanation="Shows how many tasks were created and completed each day. A healthy pattern shows completions keeping pace with creations.">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.completion.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="_id" stroke="var(--text-secondary)" fontSize={12} />
                  <YAxis stroke="var(--text-secondary)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                  <Legend />
                  <Bar dataKey="created" fill="#3B82F6" name="Created" />
                  <Bar dataKey="completed" fill="#10B981" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <InterpretationBox text={analytics.completion.interpretation} />
        </div>
      )}

      {/* TIME PATTERNS SECTION */}
      {activeSection === 'time' && analytics && (
        <div className="space-y-6">
          <SectionHeader
            title="Time-Based Productivity"
            description="When are you most productive? Identifies optimal hours and days for deep work."
          />

          {/* Peak Productivity Cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {analytics.timePatterns.mostProductiveHour && (
              <div className="bg-[var(--bg-primary)] p-6 rounded-xl border-l-4 border-blue-500">
                <div className="text-sm text-[var(--text-secondary)]">Most Productive Hour</div>
                <div className="text-3xl font-bold text-blue-500 mt-1">
                  {analytics.timePatterns.mostProductiveHour.label}
                </div>
                <div className="text-sm mt-2">
                  {analytics.timePatterns.mostProductiveHour.completions} tasks completed at this hour
                </div>
              </div>
            )}
            {analytics.timePatterns.mostProductiveDay && (
              <div className="bg-[var(--bg-primary)] p-6 rounded-xl border-l-4 border-green-500">
                <div className="text-sm text-[var(--text-secondary)]">Most Productive Day</div>
                <div className="text-3xl font-bold text-green-500 mt-1">
                  {analytics.timePatterns.mostProductiveDay.dayName}
                </div>
                <div className="text-sm mt-2">
                  {analytics.timePatterns.mostProductiveDay.completions} tasks completed on this day
                </div>
              </div>
            )}
          </div>

          {/* Hourly Distribution Chart */}
          <ChartCard title="Hourly Completion Distribution" explanation="Shows when you complete tasks throughout the day. Use this to schedule important work during peak hours.">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.timePatterns.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="label" stroke="var(--text-secondary)" fontSize={10} interval={2} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                <Area type="monotone" dataKey="completions" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Daily Distribution Chart */}
          <ChartCard title="Daily Completion Pattern" explanation="Shows which days of the week you're most productive. Consider batching similar tasks on your peak days.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.timePatterns.dailyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="dayName" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                <Bar dataKey="completions" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Time Bucket Distribution */}
          <ChartCard title="Time of Day Distribution" explanation="Morning (6-12), Afternoon (12-18), Evening (18-22), Night (22-6). Identifies your natural work rhythm.">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.timePatterns.timeBucketDistribution.filter(b => b.completions > 0)}
                  dataKey="completions"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ label, completions }) => `${label}: ${completions}`}
                >
                  {analytics.timePatterns.timeBucketDistribution.map((entry, index) => (
                    <Cell key={entry.bucket} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <InterpretationBox text={analytics.timePatterns.interpretation} />
        </div>
      )}

      {/* PRIORITY ANALYSIS SECTION */}
      {activeSection === 'priority' && analytics && (
        <div className="space-y-6">
          <SectionHeader
            title="Priority vs Reality Analysis"
            description="Are high-priority tasks actually being treated as urgent? Reveals if priority assignments match behavior."
          />

          {/* Priority Effectiveness Score */}
          <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Priority Effectiveness Score</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Measures if high-priority tasks are completed faster with fewer missed deadlines
                </p>
              </div>
              <div className="text-4xl font-bold text-orange-500">
                {analytics.priority.priorityEffectivenessScore}/100
              </div>
            </div>
          </div>

          {/* Priority Breakdown Table */}
          <div className="bg-[var(--bg-primary)] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Completed</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Completion %</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Missed Deadlines</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Avg Time (h)</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Time to Start (h)</th>
                </tr>
              </thead>
              <tbody>
                {analytics.priority.byPriority.map(p => (
                  <tr key={p.priority} className="border-t border-[var(--border-color)]">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        p.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                        p.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {p.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{p.total}</td>
                    <td className="px-4 py-3 text-right">{p.completed}</td>
                    <td className="px-4 py-3 text-right">{p.completionRate}%</td>
                    <td className="px-4 py-3 text-right">{p.missedDeadlines} ({p.missedDeadlineRate}%)</td>
                    <td className="px-4 py-3 text-right">{p.avgCompletionTimeHours}</td>
                    <td className="px-4 py-3 text-right">{p.avgTimeToStartHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Priority Completion Chart */}
          <ChartCard title="Completion Rate by Priority" explanation="High priority tasks should have higher completion rates. If not, priority assignments may not reflect actual importance.">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.priority.byPriority}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="priority" stroke="var(--text-secondary)" fontSize={12} />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }} />
                <Bar dataKey="completionRate" fill="#3B82F6" name="Completion %" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <InterpretationBox text={analytics.priority.interpretation} />
        </div>
      )}

      {/* FOCUS ANALYSIS SECTION */}
      {activeSection === 'focus' && analytics && (
        <div className="space-y-6">
          <SectionHeader
            title="Focus & Context Switching"
            description="Context switching is expensive. This reveals if you're fragmenting your attention across categories."
          />

          {/* Focus Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Context Switches"
              value={analytics.focus.contextSwitches}
              subtext="Category changes"
            />
            <MetricCard
              label="Switch Rate"
              value={`${analytics.focus.contextSwitchRate}%`}
              subtext="Lower is better"
            />
            <MetricCard
              label="Avg Focus Streak"
              value={analytics.focus.avgFocusStreak}
              subtext="Tasks before switching"
            />
            <MetricCard
              label="Max Focus Streak"
              value={analytics.focus.maxFocusStreak}
              subtext="Best streak"
            />
          </div>

          {/* Category Distribution */}
          {analytics.focus.categoryDistribution?.length > 0 && (
            <ChartCard title="Task Distribution by Category" explanation="Shows where you spend your effort. Uneven distribution may indicate neglected areas.">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.focus.categoryDistribution}
                    dataKey="taskCount"
                    nameKey="categoryName"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ categoryName, taskCount }) => `${categoryName}: ${taskCount}`}
                  >
                    {analytics.focus.categoryDistribution.map((entry, index) => (
                      <Cell key={entry.categoryId} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Frequently Reopened Tasks */}
          {analytics.focus.frequentlyReopenedTasks?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FiAlertTriangle className="text-orange-500" />
                Frequently Reopened Tasks
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Tasks marked complete then reopened indicate unclear completion criteria or premature marking.
              </p>
              <div className="space-y-2">
                {analytics.focus.frequentlyReopenedTasks.map(task => (
                  <div key={task._id} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-orange-500 text-sm">Reopened {task.reopenCount}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stale Tasks */}
          {analytics.focus.staleTasks?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FiClock className="text-purple-500" />
                Stale Tasks (7+ days old)
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Tasks sitting untouched for over a week may indicate over-commitment or unclear priorities.
              </p>
              <div className="space-y-2">
                {analytics.focus.staleTasks.map(task => (
                  <div key={task._id} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-purple-500 text-sm">{Math.round(task.daysOld)} days old</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <InterpretationBox text={analytics.focus.interpretation} />
        </div>
      )}

      {/* PROCRASTINATION SECTION */}
      {activeSection === 'procrastination' && analytics && (
        <div className="space-y-6">
          <SectionHeader
            title="Procrastination Detection"
            description="Identifies avoidance patterns - which tasks are you avoiding and why?"
          />

          {/* Procrastination Score */}
          <div className={`rounded-xl p-6 ${
            analytics.procrastination.procrastinationScore > 50
              ? 'bg-red-500/10 border border-red-500/20'
              : analytics.procrastination.procrastinationScore > 25
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-green-500/10 border border-green-500/20'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Procrastination Score</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  0 = No procrastination, 100 = Severe procrastination
                </p>
              </div>
              <div className={`text-4xl font-bold ${
                analytics.procrastination.procrastinationScore > 50 ? 'text-red-500' :
                analytics.procrastination.procrastinationScore > 25 ? 'text-yellow-500' : 'text-green-500'
              }`}>
                {analytics.procrastination.procrastinationScore}/100
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MetricCard
              label="Tasks Postponed"
              value={analytics.procrastination.stats.tasksPostponed}
              subtext={`of ${analytics.procrastination.stats.totalTasks} total`}
            />
            <MetricCard
              label="Frequently Postponed"
              value={analytics.procrastination.stats.frequentlyPostponed}
              subtext="Postponed 3+ times"
            />
            <MetricCard
              label="Never Started"
              value={analytics.procrastination.stats.neverStarted}
              subtext="Created but not begun"
            />
            <MetricCard
              label="Total Overdue"
              value={analytics.procrastination.stats.totalOverdue}
              subtext="Past due date"
            />
            <MetricCard
              label="Severely Overdue"
              value={analytics.procrastination.stats.severelyOverdue}
              subtext="7+ days overdue"
            />
            <MetricCard
              label="Avg Postpone Count"
              value={analytics.procrastination.stats.avgPostponeCount}
              subtext="Per task"
            />
          </div>

          {/* Frequently Postponed Tasks */}
          {analytics.procrastination.frequentlyPostponedTasks?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-500">
                <FiXCircle />
                Frequently Postponed Tasks
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Tasks postponed more than 3 times indicate avoidance. Consider breaking them into smaller subtasks.
              </p>
              <div className="space-y-2">
                {analytics.procrastination.frequentlyPostponedTasks.map(task => (
                  <div key={task._id} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <div>
                      <span className="font-medium">{task.title}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                    <span className="text-red-500 text-sm">Postponed {task.postponeCount}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Severely Overdue Tasks */}
          {analytics.procrastination.severelyOverdueTasks?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-500">
                <FiAlertTriangle />
                Severely Overdue Tasks (7+ days)
              </h3>
              <div className="space-y-2">
                {analytics.procrastination.severelyOverdueTasks.map(task => (
                  <div key={task._id} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-orange-500 text-sm">{task.daysOverdue} days overdue</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Never Started Tasks */}
          {analytics.procrastination.neverStartedTasks?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-purple-500">
                <FiClock />
                Never Started Tasks
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Tasks created but never started for over 3 days. Consider if these are still relevant.
              </p>
              <div className="space-y-2">
                {analytics.procrastination.neverStartedTasks.map(task => (
                  <div key={task._id} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <span className="font-medium">{task.title}</span>
                    <span className="text-purple-500 text-sm">{task.daysSinceCreation} days since creation</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <InterpretationBox text={analytics.procrastination.interpretation} />
        </div>
      )}

      {/* WEEKLY REPORT SECTION */}
      {activeSection === 'report' && report && (
        <div className="space-y-6">
          <SectionHeader
            title="Weekly Productivity Report"
            description="Data-driven summary with actionable insights. Every sentence is tied to actual metrics."
          />

          {/* Report Header */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">Weekly Summary</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Generated: {new Date(report.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-500">
                  {report.productivityScore.score}/100
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Grade: {report.productivityScore.grade}
                </div>
              </div>
            </div>
            <p className="text-[var(--text-primary)]">{report.summary}</p>
          </div>

          {/* Key Wins */}
          {report.keyWins?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-500">
                <FiCheckCircle />
                Key Wins
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {report.keyWins.map((win, i) => (
                  <div key={i} className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{win.metric}</span>
                      <span className="text-green-500 font-bold">{win.value}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{win.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottlenecks */}
          {report.bottlenecks?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-500">
                <FiAlertTriangle />
                Bottlenecks
              </h3>
              <div className="space-y-3">
                {report.bottlenecks.map((bottleneck, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${
                    bottleneck.severity === 'high'
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}>
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{bottleneck.metric}</span>
                      <span className={`font-bold ${
                        bottleneck.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                      }`}>{bottleneck.value}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{bottleneck.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actionable Suggestions */}
          {report.actionableSuggestions?.length > 0 && (
            <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
              <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-500">
                <FiTarget />
                Actionable Suggestions
              </h3>
              <div className="space-y-4">
                {report.actionableSuggestions.map((suggestion, i) => (
                  <div key={i} className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="font-medium text-blue-500">{suggestion.action}</div>
                    <p className="text-sm mt-1">{suggestion.detail}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      Based on: {suggestion.basedOn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Metrics Summary */}
          <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
            <h3 className="font-semibold mb-4">Detailed Metrics</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-[var(--text-secondary)]">Tasks Created</div>
                <div className="font-bold">{report.detailedMetrics.completion.tasksCreated}</div>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-[var(--text-secondary)]">Tasks Completed</div>
                <div className="font-bold">{report.detailedMetrics.completion.tasksCompleted}</div>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-[var(--text-secondary)]">Completion Rate</div>
                <div className="font-bold">{report.detailedMetrics.completion.completionRate}%</div>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-[var(--text-secondary)]">Overdue Tasks</div>
                <div className="font-bold">{report.detailedMetrics.completion.totalOverdue}</div>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-[var(--text-secondary)]">Context Switch Rate</div>
                <div className="font-bold">{report.detailedMetrics.focus.contextSwitchRate}%</div>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div className="text-[var(--text-secondary)]">Avg Focus Streak</div>
                <div className="font-bold">{report.detailedMetrics.focus.avgFocusStreak} tasks</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ HELPER COMPONENTS ============

function SectionHeader({ title, description }) {
  return (
    <div className="border-b border-[var(--border-color)] pb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  const colorClasses = {
    green: 'border-green-500 text-green-500',
    red: 'border-red-500 text-red-500',
    blue: 'border-blue-500 text-blue-500',
    purple: 'border-purple-500 text-purple-500',
    yellow: 'border-yellow-500 text-yellow-500'
  }

  return (
    <div className={`bg-[var(--bg-primary)] p-4 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
        <Icon size={16} />
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${colorClasses[color].split(' ')[1]}`}>
        {value}
      </div>
    </div>
  )
}

function MetricCard({ label, value, subtext }) {
  return (
    <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center">
      <div className="text-sm text-[var(--text-secondary)]">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtext && <div className="text-xs text-[var(--text-secondary)] mt-1">{subtext}</div>}
    </div>
  )
}

function ChartCard({ title, explanation, children }) {
  return (
    <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-4">{explanation}</p>
      {children}
    </div>
  )
}

function InterpretationBox({ text }) {
  if (!text) return null
  return (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
      <h4 className="font-medium text-blue-500 mb-2 flex items-center gap-2">
        <FiActivity size={16} />
        Interpretation
      </h4>
      <p className="text-sm">{text}</p>
    </div>
  )
}
