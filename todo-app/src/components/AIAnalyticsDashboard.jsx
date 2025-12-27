import { useState, useEffect, useMemo } from 'react';
import { FiTrendingUp, FiClock, FiTarget, FiZap, FiRefreshCw, FiBarChart2, FiPieChart, FiActivity, FiCalendar, FiUser, FiStar, FiAward, FiAlertTriangle, FiRotateCcw, FiCheckCircle, FiList } from 'react-icons/fi';
import { aiService } from '../services/aiService.js';
import { useTodo } from '../context/TodoContext';
import { format, parseISO, differenceInDays, differenceInHours, startOfWeek, endOfWeek, isWithinInterval, subDays, getHours, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { handleApiError, showErrorNotification } from '../utils/errorHandler';
import { TaskPieChart, TaskBarChart, TaskLineChart, TaskAreaChart, TaskPictogram, MultiBarChart, DonutChart } from './Charts';

export default function AIAnalyticsDashboard() {
  const { state, dispatch } = useTodo();
  const [analysis, setAnalysis] = useState(() => {
    const cached = localStorage.getItem('ai-analytics-cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('report');
  const [error, setError] = useState(null);

  // Comprehensive data analysis
  const detailedStats = useMemo(() => {
    const tasks = state.tasks;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Basic stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeTasks = tasks.filter(t => !t.completed).length;
    const overdueTasks = tasks.filter(t => t.dueDate && !t.completed && new Date(t.dueDate) < now).length;
    const completionRate = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

    // Time-based analysis
    const completionTimes = tasks.filter(t => t.completedAt).map(t => {
      const completed = parseISO(t.completedAt);
      return {
        hour: getHours(completed),
        day: getDay(completed),
        task: t
      };
    });

    // Hourly distribution for charts
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      name: `${hour}:00`,
      count: completionTimes.filter(t => t.hour === hour).length,
      value: completionTimes.filter(t => t.hour === hour).length
    })).filter(h => h.count > 0);

    // Daily distribution for charts
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyDistribution = dayNames.map((day, index) => ({
      day,
      name: day,
      count: completionTimes.filter(t => t.day === index).length,
      value: completionTimes.filter(t => t.day === index).length
    }));

    // Priority distribution for pie chart
    const priorityDistribution = [
      { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#EF4444' },
      { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#F59E0B' },
      { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#10B981' }
    ].filter(p => p.value > 0);

    // Status distribution for donut chart
    const statusDistribution = [
      { name: 'Completed', value: completedTasks, color: '#10B981' },
      { name: 'Active', value: activeTasks, color: '#3B82F6' },
      { name: 'Overdue', value: overdueTasks, color: '#EF4444' }
    ].filter(s => s.value > 0);

    // Task lifecycle analysis
    const taskLifecycles = tasks.filter(t => t.completed && t.completedAt).map(t => {
      const created = parseISO(t.createdAt);
      const completed = parseISO(t.completedAt);
      const lifecycle = differenceInHours(completed, created);
      return { ...t, lifecycle };
    });

    const avgLifecycle = taskLifecycles.length ?
      taskLifecycles.reduce((sum, t) => sum + t.lifecycle, 0) / taskLifecycles.length : 0;

    // Priority analysis with completion rates
    const priorityStats = {
      high: { total: 0, completed: 0, avgTime: 0 },
      medium: { total: 0, completed: 0, avgTime: 0 },
      low: { total: 0, completed: 0, avgTime: 0 }
    };

    tasks.forEach(t => {
      const priority = t.priority || 'medium';
      priorityStats[priority].total++;
      if (t.completed) {
        priorityStats[priority].completed++;
        if (t.completedAt) {
          const lifecycle = differenceInHours(parseISO(t.completedAt), parseISO(t.createdAt));
          priorityStats[priority].avgTime += lifecycle;
        }
      }
    });

    Object.keys(priorityStats).forEach(priority => {
      if (priorityStats[priority].completed > 0) {
        priorityStats[priority].avgTime /= priorityStats[priority].completed;
      }
    });

    // Priority completion chart data
    const priorityCompletionData = Object.entries(priorityStats).map(([priority, stats]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total ? (stats.completed / stats.total) * 100 : 0,
      avgTime: stats.avgTime
    }));

    // Category performance
    const categoryStats = {};
    tasks.forEach(t => {
      const categories = t.categories || (t.category ? [t.category] : []);
      categories.forEach(category => {
        if (!categoryStats[category]) {
          categoryStats[category] = {
            total: 0,
            completed: 0,
            overdue: 0,
            avgTime: 0,
            completedTimes: []
          };
        }
        categoryStats[category].total++;
        if (t.completed) {
          categoryStats[category].completed++;
          if (t.completedAt) {
            const lifecycle = differenceInHours(parseISO(t.completedAt), parseISO(t.createdAt));
            categoryStats[category].completedTimes.push(lifecycle);
          }
        }
        if (t.dueDate && !t.completed && new Date(t.dueDate) < now) {
          categoryStats[category].overdue++;
        }
      });
    });

    Object.keys(categoryStats).forEach(cat => {
      const times = categoryStats[cat].completedTimes;
      categoryStats[cat].avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    });

    // Category chart data
    const categoryChartData = Object.entries(categoryStats).map(([category, stats]) => ({
      name: category,
      total: stats.total,
      completed: stats.completed,
      completionRate: stats.total ? (stats.completed / stats.total) * 100 : 0,
      value: stats.completed
    }));

    // Streak analysis
    const streakData = [];
    for (let i = 29; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const completed = tasks.filter(t => t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dayStr).length;
      streakData.push({
        date: dayStr,
        name: format(day, 'M/d'),
        completed,
        value: completed
      });
    }

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    streakData.forEach((day, index) => {
      if (day.completed > 0) {
        tempStreak++;
        if (index === streakData.length - 1) currentStreak = tempStreak;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 0;
      }
    });

    // Procrastination analysis
    const procrastinationData = tasks.filter(t => t.dueDate && t.completedAt).map(t => {
      const due = parseISO(t.dueDate);
      const completed = parseISO(t.completedAt);
      const daysLate = differenceInDays(completed, due);
      return { ...t, daysLate };
    });

    const onTimeRate = procrastinationData.length ?
      (procrastinationData.filter(t => t.daysLate <= 0).length / procrastinationData.length) * 100 : 0;

    // Weekly patterns
    const weeklyPatterns = Array.from({ length: 4 }, (_, weekIndex) => {
      const weekStart = subDays(now, (weekIndex + 1) * 7);
      const weekEnd = subDays(now, weekIndex * 7);
      const weekTasks = tasks.filter(t => t.completedAt &&
        isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd }));
      return {
        week: `Week ${4 - weekIndex}`,
        name: `W${4 - weekIndex}`,
        completed: weekTasks.length,
        value: weekTasks.length,
        categories: [...new Set(weekTasks.map(t => t.categories || []).flat().filter(Boolean))]
      };
    });

    // Productivity score calculation
    const productivityScore = Math.round(
      (completionRate * 0.4) +
      (onTimeRate * 0.3) +
      (currentStreak * 2) +
      (Math.min(avgLifecycle / 24, 10) * 3)
    );

    return {
      // Basic stats
      totalTasks,
      completedTasks,
      activeTasks,
      overdueTasks,
      completionRate,

      // Chart data
      hourlyDistribution,
      dailyDistribution,
      priorityDistribution,
      statusDistribution,
      priorityCompletionData,
      categoryChartData,
      streakData,
      weeklyPatterns,

      // Other metrics
      avgLifecycle,
      priorityStats,
      categoryStats,
      currentStreak,
      maxStreak,
      onTimeRate,
      productivityScore,
      procrastinationData,
      taskLifecycles
    };
  }, [state.tasks]);

  // Generate AI analysis
  const generateAIAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const analyticsResult = await aiService.generateAnalytics(detailedStats);
      setAnalysis(analyticsResult);
      localStorage.setItem('ai-analytics-cache', JSON.stringify(analyticsResult));
    } catch (error) {
      console.error('Analytics generation error:', error);
      setError(error.message || 'Failed to generate AI analytics');
      handleApiError(error, showErrorNotification);
    } finally {
      setLoading(false);
    }
  };

  // Reset productivity data
  const resetProductivityData = () => {
    if (confirm('Are you sure you want to reset all productivity data? This will:\n\n• Mark all completed tasks as incomplete\n• Clear completion dates and analytics\n• Reset your productivity score to 0\n\nThis action cannot be undone.')) {
      dispatch({ type: 'RESET_PRODUCTIVITY' });
      setAnalysis(null);
      // Clear the cached analysis from state as well
      localStorage.removeItem('ai-analytics-cache');
    }
  };

  const tabs = [
    { id: 'report', label: 'Deep Analysis Report', icon: FiBarChart2 },
    { id: 'patterns', label: 'Visual Analytics', icon: FiActivity },
    { id: 'insights', label: 'AI Insights', icon: FiStar },
    { id: 'recommendations', label: 'Actions', icon: FiTarget }
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <FiTrendingUp className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AI Analytics Dashboard</h3>
            <p className="text-sm text-[var(--text-secondary)]">Deep productivity analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={generateAIAnalysis} disabled={loading}
            className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
            <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
            {loading ? 'Analyzing...' : 'Generate Analysis'}
          </button>
          <button onClick={resetProductivityData}
            className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition border border-red-500/20">
            <FiRotateCcw size={16} />
            Reset Data
          </button>
          <button onClick={() => {
            // Add some sample tasks for demonstration
            const sampleTasks = [
              { title: 'Complete React Project', priority: 'high', categories: ['📝 Projects'], completed: true },
              { title: 'Study for Math Exam', priority: 'high', categories: ['📚 Assignments'], completed: true },
              { title: 'Read Chapter 5', priority: 'medium', categories: ['📖 Study'], completed: false },
              { title: 'Gym Workout', priority: 'low', categories: ['🎯 Personal'], completed: true },
              { title: 'Team Meeting', priority: 'medium', categories: ['💼 Career'], completed: true }
            ];
            dispatch({ type: 'ADD_MULTIPLE_TASKS', payload: sampleTasks });
          }}
            className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition border border-blue-500/20">
            <FiZap size={16} />
            Add Sample Data
          </button>
        </div>
      </div>

      <div className="flex border-b border-[var(--border-color)]">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-tertiary)]'
            }`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'report' && (
          <div className="space-y-6">
            {/* Generate Deep Analysis Button */}
            {!analysis && (
              <div className="text-center py-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                <FiStar size={48} className="mx-auto mb-4 text-blue-500" />
                <h3 className="text-xl font-semibold mb-2">Generate Deep AI Analysis</h3>
                <p className="text-[var(--text-secondary)] mb-6 max-w-2xl mx-auto">
                  Get comprehensive insights about your productivity patterns including Task Status Distribution,
                  Priority Distribution, Daily Activity Pattern, Category Performance, 30-Day Activity Streak,
                  Weekly Completion Patterns, and Priority Analysis.
                </p>
                <button onClick={generateAIAnalysis} disabled={loading}
                  className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2 mx-auto text-lg">
                  <FiStar size={20} />
                  {loading ? 'Generating Analysis...' : 'Generate Deep Analysis'}
                </button>
              </div>
            )}

            {/* Comprehensive Analytics Report */}
            {analysis && (
              <div className="space-y-8">
                {/* Report Header */}
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <FiTrendingUp className="text-white" size={24} />
                      </div>
                      Deep Productivity Analysis Report
                    </h2>
                    <button onClick={generateAIAnalysis} disabled={loading}
                      className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2">
                      <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                      Refresh Analysis
                    </button>
                  </div>
                  <p className="text-lg text-[var(--text-secondary)]">{analysis.productivityProfile}</p>
                </div>

                {/* Key Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-500">{detailedStats.productivityScore}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Productivity Score</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-500">{detailedStats.completionRate.toFixed(1)}%</div>
                    <div className="text-sm text-[var(--text-secondary)]">Completion Rate</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-purple-500">
                    <div className="text-2xl font-bold text-purple-500">{detailedStats.currentStreak}</div>
                    <div className="text-sm text-[var(--text-secondary)]">Current Streak</div>
                  </div>
                  <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-orange-500">
                    <div className="text-2xl font-bold text-orange-500">{detailedStats.avgLifecycle.toFixed(1)}h</div>
                    <div className="text-sm text-[var(--text-secondary)]">Avg Task Time</div>
                  </div>
                </div>

                {/* Core Analytics - The 7 Requested Reports */}
                <div className="grid gap-6">
                  {/* 1. Task Status Distribution */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiCheckCircle className="text-green-500" />
                      1. Task Status Distribution
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <DonutChart
                        data={detailedStats.statusDistribution}
                        title="Current Status Breakdown"
                        centerText={`${detailedStats.totalTasks}`}
                        centerSubtext="Total Tasks"
                      />
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[var(--text-secondary)]">AI Analysis:</div>
                        <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                          {analysis.keyMetrics?.taskStatusAnalysis || 'Task status distribution shows your current workflow balance.'}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-green-500/10 p-2 rounded">
                            <div className="font-bold text-green-500">{detailedStats.completedTasks}</div>
                            <div className="text-xs">Completed</div>
                          </div>
                          <div className="bg-blue-500/10 p-2 rounded">
                            <div className="font-bold text-blue-500">{detailedStats.activeTasks}</div>
                            <div className="text-xs">Active</div>
                          </div>
                          <div className="bg-red-500/10 p-2 rounded">
                            <div className="font-bold text-red-500">{detailedStats.overdueTasks}</div>
                            <div className="text-xs">Overdue</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Priority Distribution */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiTarget className="text-red-500" />
                      2. Priority Distribution
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <TaskPieChart
                        data={detailedStats.priorityDistribution}
                        title="Priority Breakdown"
                      />
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[var(--text-secondary)]">AI Analysis:</div>
                        <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                          {analysis.keyMetrics?.priorityEffectiveness || 'Priority distribution reflects your task management approach.'}
                        </p>
                        <div className="space-y-2">
                          {Object.entries(detailedStats.priorityStats).map(([priority, stats]) => (
                            <div key={priority} className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded">
                              <span className="capitalize font-medium">{priority}</span>
                              <span className="text-sm">{stats.completed}/{stats.total} ({stats.total ? ((stats.completed/stats.total)*100).toFixed(0) : 0}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Daily Activity Pattern */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiActivity className="text-blue-500" />
                      3. Daily Activity Pattern
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <TaskBarChart
                        data={detailedStats.dailyDistribution}
                        title="Completion by Day of Week"
                        xKey="name"
                        yKey="value"
                        color="#3B82F6"
                      />
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[var(--text-secondary)]">AI Analysis:</div>
                        <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                          {analysis.keyMetrics?.dailyProductivityPeak || 'Daily patterns show your most productive days of the week.'}
                        </p>
                        {detailedStats.hourlyDistribution.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-2">Peak Hours:</div>
                            <div className="flex flex-wrap gap-1">
                              {detailedStats.hourlyDistribution.slice(0, 3).map((hour, i) => (
                                <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs">
                                  {hour.hour}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Category Performance */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiList className="text-purple-500" />
                      4. Category Performance
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <TaskPictogram
                        data={detailedStats.categoryChartData.slice(0, 6)}
                        title="Tasks by Category"
                        icon={FiCheckCircle}
                        maxValue={Math.max(...detailedStats.categoryChartData.map(c => c.completed), 1)}
                      />
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[var(--text-secondary)]">AI Analysis:</div>
                        <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                          {analysis.keyMetrics?.categoryInsights || 'Category performance shows which areas need attention.'}
                        </p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {detailedStats.categoryChartData.map((cat, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded text-sm">
                              <span className="font-medium">{cat.name}</span>
                              <span>{cat.completionRate.toFixed(0)}% ({cat.completed}/{cat.total})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. 30-Day Activity Streak */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiZap className="text-yellow-500" />
                      5. 30-Day Activity Streak
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                          <div className="text-2xl font-bold text-yellow-500">{detailedStats.currentStreak}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Current Streak</div>
                        </div>
                        <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                          <div className="text-2xl font-bold text-orange-500">{detailedStats.maxStreak}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Best Streak</div>
                        </div>
                        <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                          <div className="text-2xl font-bold text-green-500">{detailedStats.streakData.filter(d => d.completed > 0).length}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Active Days</div>
                        </div>
                        <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                          <div className="text-2xl font-bold text-blue-500">{(detailedStats.streakData.reduce((sum, d) => sum + d.completed, 0) / 30).toFixed(1)}</div>
                          <div className="text-xs text-[var(--text-secondary)]">Daily Avg</div>
                        </div>
                      </div>
                      <TaskLineChart
                        data={detailedStats.streakData}
                        title="30-Day Activity Timeline"
                        xKey="name"
                        yKey="value"
                        color="#10B981"
                      />
                      <div className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                        <div className="font-medium text-[var(--text-secondary)] mb-1">AI Analysis:</div>
                        {analysis.keyMetrics?.streakAnalysis || 'Consistency patterns show your commitment to productivity.'}
                      </div>
                    </div>
                  </div>

                  {/* 6. Weekly Completion Patterns */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiCalendar className="text-indigo-500" />
                      6. Weekly Completion Patterns
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <TaskAreaChart
                        data={detailedStats.weeklyPatterns}
                        title="Weekly Trends"
                        xKey="name"
                        yKey="value"
                        color="#8B5CF6"
                      />
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-[var(--text-secondary)]">AI Analysis:</div>
                        <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                          {analysis.keyMetrics?.weeklyTrends || 'Weekly patterns reveal your productivity cycles.'}
                        </p>
                        <div className="space-y-2">
                          {detailedStats.weeklyPatterns.map((week, i) => (
                            <div key={i} className="flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded">
                              <span className="font-medium">{week.week}</span>
                              <span className="text-sm">{week.completed} tasks</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7. Priority Analysis: Total vs Completed */}
                  <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <FiAward className="text-emerald-500" />
                      7. Priority Analysis: Total vs Completed
                    </h3>
                    <div className="space-y-4">
                      <MultiBarChart
                        data={detailedStats.priorityCompletionData}
                        title="Priority Completion Comparison"
                        series={[
                          { key: 'total', color: '#94A3B8' },
                          { key: 'completed', color: '#10B981' }
                        ]}
                      />
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-[var(--text-secondary)]">Completion Rates by Priority:</div>
                          {detailedStats.priorityCompletionData.map((priority, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                              <span className="font-medium capitalize">{priority.name}</span>
                              <div className="text-right">
                                <div className="font-bold">{priority.completionRate.toFixed(1)}%</div>
                                <div className="text-xs text-[var(--text-secondary)]">{priority.completed}/{priority.total}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-[var(--text-secondary)]">AI Analysis:</div>
                          <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                            {analysis.keyMetrics?.priorityCompletionGap || 'Priority completion analysis shows effectiveness of task prioritization.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Section */}
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FiStar className="text-purple-500" />
                    Analysis Summary
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 text-green-600">Key Strengths</h4>
                      <ul className="space-y-1">
                        {analysis.strengths?.slice(0, 3).map((strength, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-orange-600">Improvement Areas</h4>
                      <ul className="space-y-1">
                        {analysis.weaknesses?.slice(0, 3).map((weakness, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-orange-500 mt-1">⚠</span>
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-500">{detailedStats.productivityScore}</div>
                <div className="text-xs text-[var(--text-secondary)]">Productivity Score</div>
              </div>
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-500">{detailedStats.completionRate.toFixed(1)}%</div>
                <div className="text-xs text-[var(--text-secondary)]">Completion Rate</div>
              </div>
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-500">{detailedStats.currentStreak}</div>
                <div className="text-xs text-[var(--text-secondary)]">Current Streak</div>
              </div>
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-500">{detailedStats.avgLifecycle.toFixed(1)}h</div>
                <div className="text-xs text-[var(--text-secondary)]">Avg Task Time</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Task Status Donut Chart */}
              <DonutChart
                data={detailedStats.statusDistribution}
                title="Task Status Distribution"
                centerText={`${detailedStats.totalTasks}`}
                centerSubtext="Total Tasks"
              />

              {/* Priority Distribution Pie Chart */}
              <TaskPieChart
                data={detailedStats.priorityDistribution}
                title="Priority Distribution"
              />

              {/* Daily Activity Bar Chart */}
              <TaskBarChart
                data={detailedStats.dailyDistribution}
                title="Daily Activity Pattern"
                xKey="name"
                yKey="value"
                color="#3B82F6"
              />

              {/* Category Performance Pictogram */}
              <TaskPictogram
                data={detailedStats.categoryChartData.slice(0, 6)}
                title="Category Performance"
                icon={FiCheckCircle}
                maxValue={Math.max(...detailedStats.categoryChartData.map(c => c.completed), 1)}
              />
            </div>

            {/* Full Width Charts */}
            <div className="space-y-6">
              {/* 30-Day Streak Line Chart */}
              <TaskLineChart
                data={detailedStats.streakData}
                title="30-Day Activity Streak"
                xKey="name"
                yKey="value"
                color="#10B981"
              />

              {/* Weekly Patterns Area Chart */}
              <TaskAreaChart
                data={detailedStats.weeklyPatterns}
                title="Weekly Completion Patterns"
                xKey="name"
                yKey="value"
                color="#8B5CF6"
              />

              {/* Priority vs Completion Multi-Bar Chart */}
              <MultiBarChart
                data={detailedStats.priorityCompletionData}
                title="Priority Analysis: Total vs Completed"
                series={[
                  { key: 'total', color: '#94A3B8' },
                  { key: 'completed', color: '#10B981' }
                ]}
              />
            </div>

            {/* Hourly Distribution (if data exists) */}
            {detailedStats.hourlyDistribution.length > 0 && (
              <TaskBarChart
                data={detailedStats.hourlyDistribution}
                title="Hourly Completion Distribution"
                xKey="name"
                yKey="value"
                color="#F59E0B"
              />
            )}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Streak Analytics Section */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiZap className="text-yellow-500" />
                Streak Analytics
              </h3>

              {/* Streak Metrics Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-yellow-500">
                  <div className="text-3xl font-bold text-yellow-500">{detailedStats.currentStreak}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Current Streak</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {detailedStats.currentStreak > 0 ? 'Days active' : 'Days inactive'}
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-orange-500">
                  <div className="text-3xl font-bold text-orange-500">{detailedStats.maxStreak}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Best Streak</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Personal record</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-green-500">
                  <div className="text-3xl font-bold text-green-500">{detailedStats.streakData.filter(d => d.completed > 0).length}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Active Days</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Last 30 days</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-blue-500">
                  <div className="text-3xl font-bold text-blue-500">{(detailedStats.streakData.reduce((sum, d) => sum + d.completed, 0) / 30).toFixed(1)}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Daily Average</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">Tasks per day</div>
                </div>
              </div>

              {/* 30-Day Activity Timeline */}
              <TaskLineChart
                data={detailedStats.streakData}
                title="30-Day Activity Timeline"
                xKey="name"
                yKey="value"
                color="#10B981"
              />

              {/* GitHub-style Activity Heatmap */}
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg mt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiActivity className="text-green-500" />
                  Activity Heatmap (Last 30 Days)
                </h4>
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {detailedStats.streakData.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 min-w-[28px]">
                      <div
                        className={`w-7 h-7 rounded-sm border border-[var(--border-color)] transition-all hover:scale-110 cursor-pointer ${
                          day.completed === 0
                            ? 'bg-[var(--bg-tertiary)]'
                            : day.completed === 1
                            ? 'bg-green-200'
                            : day.completed === 2
                            ? 'bg-green-400'
                            : day.completed >= 3
                            ? 'bg-green-600'
                            : 'bg-green-300'
                        }`}
                        title={`${day.name}: ${day.completed} tasks completed`}
                      />
                      {i % 7 === 0 && (
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          {day.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-[var(--text-secondary)]">
                  <span>Less active</span>
                  <div className="flex items-center gap-2">
                    <span>Activity level:</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-[var(--bg-tertiary)] rounded-sm border border-[var(--border-color)]" title="0 tasks"></div>
                      <div className="w-3 h-3 bg-green-200 rounded-sm border border-[var(--border-color)]" title="1 task"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-sm border border-[var(--border-color)]" title="2 tasks"></div>
                      <div className="w-3 h-3 bg-green-600 rounded-sm border border-[var(--border-color)]" title="3+ tasks"></div>
                    </div>
                  </div>
                  <span>More active</span>
                </div>
              </div>

              {/* Streak Insights */}
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                  <h5 className="font-medium mb-2 text-green-600">Streak Achievements</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Longest streak:</span>
                      <span className="font-bold">{detailedStats.maxStreak} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current momentum:</span>
                      <span className={`font-bold ${detailedStats.currentStreak > 0 ? 'text-green-500' : 'text-orange-500'}`}>
                        {detailedStats.currentStreak > 0 ? `${detailedStats.currentStreak} days` : 'Broken'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consistency rate:</span>
                      <span className="font-bold">{((detailedStats.streakData.filter(d => d.completed > 0).length / 30) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                  <h5 className="font-medium mb-2 text-blue-600">Weekly Breakdown</h5>
                  <div className="space-y-2 text-sm">
                    {Array.from({ length: 4 }, (_, weekIndex) => {
                      const weekStart = weekIndex * 7;
                      const weekEnd = Math.min((weekIndex + 1) * 7, 30);
                      const weekData = detailedStats.streakData.slice(weekStart, weekEnd);
                      const weekTotal = weekData.reduce((sum, d) => sum + d.completed, 0);
                      const weekActive = weekData.filter(d => d.completed > 0).length;

                      return (
                        <div key={weekIndex} className="flex justify-between">
                          <span>Week {4 - weekIndex}:</span>
                          <span className="font-bold">{weekTotal} tasks ({weekActive}/7 days)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Daily and Weekly Patterns */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Daily Productivity Radar-style Bar Chart */}
              <TaskBarChart
                data={detailedStats.dailyDistribution}
                title="Daily Productivity Pattern"
                xKey="name"
                yKey="value"
                color="#8B5CF6"
              />

              {/* Priority Completion Rates */}
              <TaskPieChart
                data={detailedStats.priorityCompletionData.map(p => ({
                  name: p.name,
                  value: p.completed
                }))}
                title="Completed Tasks by Priority"
              />
            </div>

            {/* Time-based Analysis */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Hourly Activity (if data exists) */}
              {detailedStats.hourlyDistribution.length > 0 && (
                <TaskAreaChart
                  data={detailedStats.hourlyDistribution}
                  title="Hourly Activity Pattern"
                  xKey="name"
                  yKey="value"
                  color="#F59E0B"
                />
              )}

              {/* Category Performance Pictogram */}
              <TaskPictogram
                data={detailedStats.categoryChartData.map(c => ({
                  name: c.name,
                  value: c.total
                }))}
                title="Tasks by Category"
                icon={FiList}
                maxValue={Math.max(...detailedStats.categoryChartData.map(c => c.total), 1)}
              />
            </div>

            {/* Priority Analysis Multi-Bar */}
            <MultiBarChart
              data={detailedStats.priorityCompletionData}
              title="Priority Analysis: Total vs Completed vs Average Time"
              series={[
                { key: 'total', color: '#94A3B8' },
                { key: 'completed', color: '#10B981' },
                { key: 'avgTime', color: '#F59E0B' }
              ]}
            />
          </div>
        )}

        {activeTab === 'insights' && analysis && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FiUser className="text-purple-500" /> Productivity Profile
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">{analysis.productivityProfile}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-green-600">
                  <FiAward /> Strengths
                </h4>
                <ul className="space-y-2">
                  {analysis.strengths?.map((strength, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2 text-orange-600">
                  <FiAlertTriangle /> Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {analysis.weaknesses?.map((weakness, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500 mt-1">⚠</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
              <h4 className="font-medium mb-3">Behavioral Patterns</h4>
              <div className="grid gap-2">
                {analysis.behavioralPatterns?.map((pattern, i) => (
                  <div key={i} className="text-sm p-2 bg-[var(--bg-secondary)] rounded">
                    {pattern}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && analysis && (
          <div className="space-y-6">
            <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FiTarget className="text-blue-500" /> Actionable Recommendations
              </h4>
              <div className="space-y-3">
                {analysis.actionableRecommendations?.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm flex-1">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3">Predictive Insights</h4>
                <div className="space-y-2">
                  {analysis.predictiveInsights?.map((insight, i) => (
                    <div key={i} className="text-sm p-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded border-l-4 border-purple-500">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3">Gamification Ideas</h4>
                <div className="space-y-2">
                  {analysis.gamificationSuggestions?.map((suggestion, i) => (
                    <div key={i} className="text-sm p-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded border-l-4 border-green-500">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!analysis && !loading && (
          <div className="text-center py-12">
            <FiStar size={64} className="mx-auto mb-4 text-[var(--text-secondary)] opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Deep AI Analysis</h3>
            <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
              Get comprehensive insights about your productivity patterns, behavioral analysis, and personalized recommendations
            </p>
            <button onClick={generateAIAnalysis}
              className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2 mx-auto">
              <FiStar size={18} /> Generate Deep Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}