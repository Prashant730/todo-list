import { useState, useEffect, useMemo } from 'react';
import { FiTrendingUp, FiClock, FiTarget, FiZap, FiRefreshCw, FiBarChart2, FiPieChart, FiActivity, FiCalendar, FiUser, FiStar, FiAward, FiAlertTriangle, FiRotateCcw, FiCheckCircle, FiList, FiPlay, FiTrash2, FiEdit3, FiDatabase } from 'react-icons/fi';
import { aiService } from '../services/aiService.js';
import { useTodo } from '../context/TodoContext';
import { format, parseISO, differenceInDays, differenceInHours, startOfWeek, endOfWeek, isWithinInterval, subDays, getHours, getDay, startOfMonth, endOfMonth, isPast, isToday } from 'date-fns';
import { handleApiError, showErrorNotification } from '../utils/errorHandler';
import { TaskPieChart, TaskBarChart, TaskLineChart, TaskAreaChart, TaskPictogram, MultiBarChart, DonutChart } from './Charts';
import DeepAnalysisReport from './DeepAnalysisReport';
import analyticsApi from '../services/analyticsApi';

export default function AIAnalyticsDashboard() {
  const { state, dispatch } = useTodo();
  const [analysis, setAnalysis] = useState(() => {
    const cached = localStorage.getItem('ai-analytics-cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('deep');
  const [_error, setError] = useState(null);
  const [backendScore, setBackendScore] = useState(null);

  // Fetch productivity score from backend
  useEffect(() => {
    const fetchScore = async () => {
      try {
        const score = await analyticsApi.getProductivityScore();
        setBackendScore(score);
      } catch (err) {
        console.error('Failed to fetch productivity score:', err);
      }
    };
    fetchScore();
  }, [state.tasks]);

  // Comprehensive data analysis
  const detailedStats = useMemo(() => {
    const tasks = state.tasks;
    const now = new Date();
    const _weekStart = startOfWeek(now);
    const _weekEnd = endOfWeek(now);
    const _monthStart = startOfMonth(now);
    const _monthEnd = endOfMonth(now);

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

    // Productivity score calculation - SAME FORMULA AS BACKEND
    // Score = (CompletionRate × 0.30) + (OnTimeRate × 0.25) + (FocusScore × 0.20) + (AntiProcrastination × 0.25)
    // For frontend approximation without full focus/procrastination data:
    const focusScore = 100; // Default when no context switching data
    const antiProcrastinationScore = Math.max(0, 100 - (overdueTasks / Math.max(totalTasks, 1)) * 100);

    const productivityScore = Math.round(
      (completionRate * 0.30) +
      (onTimeRate * 0.25) +
      (focusScore * 0.20) +
      (antiProcrastinationScore * 0.25)
    );

    return {
      totalTasks, completedTasks, activeTasks, overdueTasks, completionRate,
      hourlyDistribution, dailyDistribution, priorityDistribution, statusDistribution,
      priorityCompletionData, categoryChartData, streakData, weeklyPatterns,
      avgLifecycle, priorityStats, categoryStats, currentStreak, maxStreak,
      onTimeRate, productivityScore, procrastinationData, taskLifecycles
    };
  }, [state.tasks]);

  // Local insights (always available, no AI needed)
  const localInsights = useMemo(() => {
    const tasks = state.tasks;
    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && !t.completed);
    const todayTasks = tasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate)) && !t.completed);
    const urgentTasks = tasks.filter(t => t.priority === 'high' && !t.completed);
    const noDueDateTasks = tasks.filter(t => !t.dueDate && !t.completed);
    const staleTasks = tasks.filter(t => {
      if (t.completed) return false;
      const created = parseISO(t.createdAt);
      return differenceInDays(now, created) > 7;
    });

    const categoryStats = {};
    tasks.forEach(t => {
      const categories = t.categories || (t.category ? [t.category] : []);
      categories.forEach(cat => {
        if (!categoryStats[cat]) categoryStats[cat] = { total: 0, completed: 0 };
        categoryStats[cat].total++;
        if (t.completed) categoryStats[cat].completed++;
      });
    });

    let bestCategory = null, bestRate = 0;
    let worstCategory = null, worstRate = 1;
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      const rate = stats.total > 2 ? stats.completed / stats.total : 0;
      if (rate > bestRate) { bestRate = rate; bestCategory = cat; }
      if (rate < worstRate && stats.total > 2) { worstRate = rate; worstCategory = cat; }
    });

    return {
      overdueTasks, todayTasks, urgentTasks, noDueDateTasks, staleTasks,
      bestCategory, worstCategory,
      totalActive: tasks.filter(t => !t.completed).length,
      totalCompleted: tasks.filter(t => t.completed).length,
    };
  }, [state.tasks]);

  // Quick alerts for insights tab
  const quickAlerts = useMemo(() => {
    const alerts = [];
    if (localInsights.overdueTasks.length > 0) {
      alerts.push({ type: 'warning', icon: FiAlertTriangle, color: 'red', text: `${localInsights.overdueTasks.length} overdue task${localInsights.overdueTasks.length > 1 ? 's' : ''} need attention!`, tasks: localInsights.overdueTasks });
    }
    if (localInsights.todayTasks.length > 0) {
      alerts.push({ type: 'tip', icon: FiCalendar, color: 'blue', text: `${localInsights.todayTasks.length} task${localInsights.todayTasks.length > 1 ? 's' : ''} due today`, tasks: localInsights.todayTasks });
    }
    if (detailedStats.currentStreak >= 3) {
      alerts.push({ type: 'achievement', icon: FiZap, color: 'yellow', text: `${detailedStats.currentStreak}-day productivity streak! Keep it up!` });
    }
    if (localInsights.urgentTasks.length > 3) {
      alerts.push({ type: 'suggestion', icon: FiTarget, color: 'orange', text: `${localInsights.urgentTasks.length} high-priority tasks pending - consider delegating or rescheduling`, tasks: localInsights.urgentTasks });
    }
    if (localInsights.noDueDateTasks.length > 0) {
      alerts.push({ type: 'tip', icon: FiClock, color: 'purple', text: `${localInsights.noDueDateTasks.length} tasks without due dates - add deadlines for better planning`, tasks: localInsights.noDueDateTasks });
    }
    if (localInsights.staleTasks.length > 0) {
      alerts.push({ type: 'warning', icon: FiClock, color: 'orange', text: `${localInsights.staleTasks.length} tasks pending for over a week`, tasks: localInsights.staleTasks });
    }
    if (localInsights.bestCategory) {
      alerts.push({ type: 'achievement', icon: FiAward, color: 'green', text: `You're doing great with ${localInsights.bestCategory} tasks!` });
    }
    const scoreToShow = backendScore?.score ?? detailedStats.productivityScore;
    if (scoreToShow > 50) {
      alerts.push({ type: 'achievement', icon: FiStar, color: 'purple', text: `Productivity score: ${scoreToShow} - Above average!` });
    }
    return alerts;
  }, [localInsights, detailedStats, backendScore]);

  // Quick actions for the Actions tab
  const quickActions = useMemo(() => {
    const actions = [];
    if (localInsights.overdueTasks.length > 0) {
      actions.push({
        id: 'complete-overdue', icon: FiCheckCircle, color: 'red',
        title: 'Complete Overdue Tasks',
        description: `Mark ${localInsights.overdueTasks.length} overdue task${localInsights.overdueTasks.length > 1 ? 's' : ''} as done`,
        action: () => { localInsights.overdueTasks.forEach(task => { dispatch({ type: 'TOGGLE_TASK', payload: task.id }); }); }
      });
    }
    if (localInsights.todayTasks.length > 0) {
      actions.push({
        id: 'focus-today', icon: FiTarget, color: 'blue',
        title: 'Focus on Today',
        description: `You have ${localInsights.todayTasks.length} task${localInsights.todayTasks.length > 1 ? 's' : ''} due today`,
        action: () => { dispatch({ type: 'SET_FILTER', payload: { status: 'today' } }); }
      });
    }
    if (localInsights.urgentTasks.length > 0) {
      actions.push({
        id: 'tackle-urgent', icon: FiZap, color: 'orange',
        title: 'Tackle High Priority',
        description: `${localInsights.urgentTasks.length} high-priority task${localInsights.urgentTasks.length > 1 ? 's' : ''} waiting`,
        action: () => { dispatch({ type: 'SET_FILTER', payload: { priority: 'high' } }); }
      });
    }
    if (localInsights.staleTasks.length > 0) {
      actions.push({
        id: 'review-stale', icon: FiEdit3, color: 'purple',
        title: 'Review Stale Tasks',
        description: `${localInsights.staleTasks.length} task${localInsights.staleTasks.length > 1 ? 's' : ''} older than a week`,
        action: () => { alert(`Stale tasks:\n${localInsights.staleTasks.map(t => `• ${t.title}`).join('\n')}`); }
      });
    }
    if (detailedStats.completedTasks > 0) {
      actions.push({
        id: 'clear-completed', icon: FiTrash2, color: 'gray',
        title: 'Clear Completed',
        description: `Remove ${detailedStats.completedTasks} completed task${detailedStats.completedTasks > 1 ? 's' : ''}`,
        action: () => { if (confirm(`Delete ${detailedStats.completedTasks} completed tasks?`)) { dispatch({ type: 'CLEAR_COMPLETED' }); } }
      });
    }
    return actions;
  }, [localInsights, detailedStats, dispatch]);

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
      localStorage.removeItem('ai-analytics-cache');
    }
  };

  const tabs = [
    { id: 'deep', label: 'Deep Analysis', icon: FiDatabase },
    { id: 'report', label: 'Quick Report', icon: FiBarChart2 },
    { id: 'patterns', label: 'Visual Analytics', icon: FiActivity },
    { id: 'insights', label: 'AI Insights', icon: FiStar },
    { id: 'recommendations', label: 'Actions', icon: FiTarget }
  ];

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden" data-analytics-dashboard>
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
        {/* DEEP ANALYSIS TAB - Backend-powered analytics */}
        {activeTab === 'deep' && (
          <DeepAnalysisReport />
        )}

        {/* REPORT TAB - Simplified: Key Metrics + AI Summary only */}
        {activeTab === 'report' && (
          <div className="space-y-6">
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
                  {loading ? 'Generating...' : 'Generate AI Insights'}
                </button>
              </div>
              <p className="text-lg text-[var(--text-secondary)]">
                {analysis?.productivityProfile || 'Click "Generate AI Insights" to get comprehensive analysis of your productivity patterns. View charts in the Visual Analytics tab.'}
              </p>
            </div>

            {/* Key Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-green-500">
                <div className="text-2xl font-bold text-green-500">{backendScore?.score ?? detailedStats.productivityScore}</div>
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

            {/* Quick Stats Summary */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiCheckCircle className="text-green-500" /> Task Overview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Total Tasks:</span><span className="font-bold">{detailedStats.totalTasks}</span></div>
                  <div className="flex justify-between"><span>Completed:</span><span className="font-bold text-green-500">{detailedStats.completedTasks}</span></div>
                  <div className="flex justify-between"><span>Active:</span><span className="font-bold text-blue-500">{detailedStats.activeTasks}</span></div>
                  <div className="flex justify-between"><span>Overdue:</span><span className="font-bold text-red-500">{detailedStats.overdueTasks}</span></div>
                </div>
              </div>
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiTarget className="text-red-500" /> Priority Breakdown
                </h4>
                <div className="space-y-2 text-sm">
                  {Object.entries(detailedStats.priorityStats).map(([priority, stats]) => (
                    <div key={priority} className="flex justify-between">
                      <span className="capitalize">{priority}:</span>
                      <span className="font-bold">{stats.completed}/{stats.total}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiZap className="text-yellow-500" /> Streak Stats
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Current Streak:</span><span className="font-bold text-yellow-500">{detailedStats.currentStreak} days</span></div>
                  <div className="flex justify-between"><span>Best Streak:</span><span className="font-bold text-orange-500">{detailedStats.maxStreak} days</span></div>
                  <div className="flex justify-between"><span>On-Time Rate:</span><span className="font-bold">{detailedStats.onTimeRate.toFixed(0)}%</span></div>
                </div>
              </div>
            </div>

            {/* AI Summary Section - Only show when AI analysis is available */}
            {analysis && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiStar className="text-purple-500" />
                  AI Analysis Summary
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
            )}

            {!analysis && (
              <div className="text-center py-8 bg-[var(--bg-primary)] rounded-xl">
                <FiBarChart2 className="mx-auto text-green-500 mb-3" size={32} />
                <p className="text-[var(--text-secondary)] mb-4">Generate AI analysis for detailed insights and recommendations</p>
                <button onClick={generateAIAnalysis} disabled={loading}
                  className="btn-primary px-6 py-2 rounded-lg inline-flex items-center gap-2">
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                  {loading ? 'Analyzing...' : 'Generate AI Analysis'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* VISUAL ANALYTICS TAB - All Charts Moved Here */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
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
                  <div className="text-sm font-medium text-[var(--text-secondary)]">Analysis:</div>
                  <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                    {analysis?.keyMetrics?.taskStatusAnalysis || 'Task status distribution shows your current workflow balance.'}
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
                  <div className="text-sm font-medium text-[var(--text-secondary)]">Analysis:</div>
                  <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                    {analysis?.keyMetrics?.priorityEffectiveness || 'Priority distribution reflects your task management approach.'}
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
                  <div className="text-sm font-medium text-[var(--text-secondary)]">Analysis:</div>
                  <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                    {analysis?.keyMetrics?.dailyProductivityPeak || 'Daily patterns show your most productive days of the week.'}
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
                  <div className="text-sm font-medium text-[var(--text-secondary)]">Analysis:</div>
                  <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                    {analysis?.keyMetrics?.categoryInsights || 'Category performance shows which areas need attention.'}
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
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FiZap className="text-yellow-500" />
                5. 30-Day Activity Streak
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-yellow-500">
                  <div className="text-3xl font-bold text-yellow-500">{detailedStats.currentStreak}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Current Streak</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-orange-500">
                  <div className="text-3xl font-bold text-orange-500">{detailedStats.maxStreak}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Best Streak</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-green-500">
                  <div className="text-3xl font-bold text-green-500">{detailedStats.streakData.filter(d => d.completed > 0).length}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Active Days</div>
                </div>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg text-center border-l-4 border-blue-500">
                  <div className="text-3xl font-bold text-blue-500">{(detailedStats.streakData.reduce((sum, d) => sum + d.completed, 0) / 30).toFixed(1)}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Daily Avg</div>
                </div>
              </div>
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
                          day.completed === 0 ? 'bg-[var(--bg-tertiary)]'
                            : day.completed === 1 ? 'bg-green-200'
                            : day.completed === 2 ? 'bg-green-400'
                            : day.completed >= 3 ? 'bg-green-600' : 'bg-green-300'
                        }`}
                        title={`${day.name}: ${day.completed} tasks completed`}
                      />
                      {i % 7 === 0 && <div className="text-xs text-[var(--text-secondary)] mt-1">{day.name}</div>}
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
                  <div className="text-sm font-medium text-[var(--text-secondary)]">Analysis:</div>
                  <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                    {analysis?.keyMetrics?.weeklyTrends || 'Weekly patterns reveal your productivity cycles.'}
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
                    <div className="text-sm font-medium text-[var(--text-secondary)]">Analysis:</div>
                    <p className="text-sm bg-[var(--bg-secondary)] p-3 rounded-lg">
                      {analysis?.keyMetrics?.priorityCompletionGap || 'Priority completion analysis shows effectiveness of task prioritization.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hourly Distribution (if data exists) */}
            {detailedStats.hourlyDistribution.length > 0 && (
              <div className="bg-[var(--bg-primary)] p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FiClock className="text-amber-500" />
                  Hourly Completion Distribution
                </h3>
                <TaskBarChart
                  data={detailedStats.hourlyDistribution}
                  title="Tasks Completed by Hour"
                  xKey="name"
                  yKey="value"
                  color="#F59E0B"
                />
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* Local Insights - Always visible */}
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <FiZap className="text-purple-500" /> Quick Insights
              </h4>
              {quickAlerts.length > 0 ? (
                <div className="grid gap-3">
                  {quickAlerts.map((alert, i) => (
                    <div key={i} className={`flex items-start gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border-l-4 border-${alert.color}-500`}>
                      <div className={`w-8 h-8 rounded-lg bg-${alert.color}-500/20 flex items-center justify-center flex-shrink-0`}>
                        <alert.icon className={`text-${alert.color}-500`} size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{alert.text}</p>
                        {alert.tasks && alert.tasks.length > 0 && (
                          <div className="mt-2 text-xs text-[var(--text-secondary)]">
                            {alert.tasks.slice(0, 3).map(t => t.title).join(', ')}
                            {alert.tasks.length > 3 && ` +${alert.tasks.length - 3} more`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No insights available. Add some tasks to see productivity insights!</p>
              )}
            </div>

            {/* AI-Generated Insights - Only when analysis exists */}
            {analysis && (
              <>
                <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FiUser className="text-green-500" /> AI Productivity Profile
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
              </>
            )}

            {!analysis && (
              <div className="text-center py-8 bg-[var(--bg-primary)] rounded-xl">
                <FiStar className="mx-auto text-purple-500 mb-3" size={32} />
                <p className="text-[var(--text-secondary)] mb-4">Click "Generate Analysis" for AI-powered insights</p>
                <button onClick={generateAIAnalysis} disabled={loading}
                  className="btn-primary px-6 py-2 rounded-lg inline-flex items-center gap-2">
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                  {loading ? 'Analyzing...' : 'Generate AI Insights'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ACTIONS TAB */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Quick Actions - Always visible */}
            <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 rounded-xl p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <FiPlay className="text-blue-500" /> Quick Actions
              </h4>
              {quickActions.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {quickActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`flex items-start gap-3 p-4 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] hover:border-${action.color}-400 hover:bg-${action.color}-500/5 transition text-left group`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-${action.color}-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-${action.color}-500/30 transition`}>
                        <action.icon className={`text-${action.color}-500`} size={20} />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{action.title}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-1">{action.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">No actions available. All caught up! 🎉</p>
              )}
            </div>

            {/* AI Recommendations - Only when analysis exists */}
            {analysis && (
              <>
                <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FiTarget className="text-blue-500" /> AI Recommendations
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
              </>
            )}

            {!analysis && (
              <div className="text-center py-8 bg-[var(--bg-primary)] rounded-xl">
                <FiTarget className="mx-auto text-blue-500 mb-3" size={32} />
                <p className="text-[var(--text-secondary)] mb-4">Click "Generate Analysis" for AI-powered recommendations</p>
                <button onClick={generateAIAnalysis} disabled={loading}
                  className="btn-primary px-6 py-2 rounded-lg inline-flex items-center gap-2">
                  <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
                  {loading ? 'Analyzing...' : 'Generate AI Recommendations'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
