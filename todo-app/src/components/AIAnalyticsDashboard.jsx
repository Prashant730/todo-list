import { useState, useEffect, useMemo } from 'react';
import { FiTrendingUp, FiClock, FiTarget, FiZap, FiRefreshCw, FiBarChart2, FiPieChart, FiActivity, FiCalendar, FiUser, FiStar, FiAward, FiAlertTriangle } from 'react-icons/fi';
import { aiService } from '../services/aiService.js';
import { useTodo } from '../context/TodoContext';
import { format, parseISO, differenceInDays, differenceInHours, startOfWeek, endOfWeek, isWithinInterval, subDays, getHours, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { handleApiError, showErrorNotification } from '../utils/errorHandler';

export default function AIAnalyticsDashboard() {
  const { state } = useTodo();
  const [analysis, setAnalysis] = useState(() => {
    const cached = localStorage.getItem('ai-analytics-cache');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState(null);

  // Comprehensive data analysis
  const detailedStats = useMemo(() => {
    const tasks = state.tasks;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Time-based analysis
    const completionTimes = tasks.filter(t => t.completedAt).map(t => {
      const completed = parseISO(t.completedAt);
      return {
        hour: getHours(completed),
        day: getDay(completed),
        task: t
      };
    });

    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: completionTimes.filter(t => t.hour === hour).length
    }));

    const dailyDistribution = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => ({
      day,
      count: completionTimes.filter(t => t.day === index).length
    }));

    // Task lifecycle analysis
    const taskLifecycles = tasks.filter(t => t.completed && t.completedAt).map(t => {
      const created = parseISO(t.createdAt);
      const completed = parseISO(t.completedAt);
      const lifecycle = differenceInHours(completed, created);
      return { ...t, lifecycle };
    });

    const avgLifecycle = taskLifecycles.length ?
      taskLifecycles.reduce((sum, t) => sum + t.lifecycle, 0) / taskLifecycles.length : 0;

    // Priority analysis
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

    // Category performance
    const categoryStats = {};
    tasks.forEach(t => {
      if (!t.category) return;
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = {
          total: 0,
          completed: 0,
          overdue: 0,
          avgTime: 0,
          completedTimes: []
        };
      }
      categoryStats[t.category].total++;
      if (t.completed) {
        categoryStats[t.category].completed++;
        if (t.completedAt) {
          const lifecycle = differenceInHours(parseISO(t.completedAt), parseISO(t.createdAt));
          categoryStats[t.category].completedTimes.push(lifecycle);
        }
      }
      if (t.dueDate && !t.completed && new Date(t.dueDate) < now) {
        categoryStats[t.category].overdue++;
      }
    });

    Object.keys(categoryStats).forEach(cat => {
      const times = categoryStats[cat].completedTimes;
      categoryStats[cat].avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    });

    // Streak analysis
    const streakData = [];
    for (let i = 0; i < 30; i++) {
      const day = subDays(now, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const completed = tasks.filter(t => t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === dayStr).length;
      streakData.unshift({ date: dayStr, completed });
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
      (procrastinationData.filter(t => t.daysLate <= 0).length / procrastinationData.length) * 100 : 100;

    // Weekly patterns
    const weeklyPatterns = Array.from({ length: 4 }, (_, weekIndex) => {
      const weekStart = subDays(now, (weekIndex + 1) * 7);
      const weekEnd = subDays(now, weekIndex * 7);
      const weekTasks = tasks.filter(t => t.completedAt &&
        isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd }));
      return {
        week: `Week ${4 - weekIndex}`,
        completed: weekTasks.length,
        categories: [...new Set(weekTasks.map(t => t.category).filter(Boolean))]
      };
    });

    // Productivity score calculation
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const completionRate = totalTasks ? (completedTasks / totalTasks) * 100 : 0;
    const productivityScore = Math.round(
      (completionRate * 0.4) +
      (onTimeRate * 0.3) +
      (currentStreak * 2) +
      (Math.min(avgLifecycle / 24, 10) * 3)
    );

    return {
      hourlyDistribution,
      dailyDistribution,
      avgLifecycle,
      priorityStats,
      categoryStats,
      streakData,
      currentStreak,
      maxStreak,
      onTimeRate,
      weeklyPatterns,
      productivityScore,
      procrastinationData,
      taskLifecycles,
      totalTasks,
      completedTasks,
      completionRate
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
    { id: 'patterns', label: 'Patterns', icon: FiActivity },
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
        <button onClick={generateAIAnalysis} disabled={loading}
          className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <FiRefreshCw className={loading ? 'animate-spin' : ''} size={16} />
          {loading ? 'Analyzing...' : 'Generate Analysis'}
        </button>
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiClock className="text-blue-500" /> Hourly Distribution
                </h4>
                <div className="space-y-2">
                  {detailedStats.hourlyDistribution.filter(h => h.count > 0).slice(0, 5).map(hour => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-sm">{hour.hour}:00</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${(hour.count / Math.max(...detailedStats.hourlyDistribution.map(h => h.count))) * 100}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] w-6">{hour.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FiPieChart className="text-green-500" /> Category Performance
                </h4>
                <div className="space-y-2">
                  {Object.entries(detailedStats.categoryStats).slice(0, 5).map(([cat, stats]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <span className="text-sm">{cat}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: `${(stats.completed / stats.total) * 100}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] w-12">{((stats.completed / stats.total) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3">Daily Productivity</h4>
                <div className="space-y-2">
                  {detailedStats.dailyDistribution.map(day => (
                    <div key={day.day} className="flex items-center justify-between">
                      <span className="text-sm">{day.day}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${(day.count / Math.max(...detailedStats.dailyDistribution.map(d => d.count), 1)) * 100}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)] w-6">{day.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                <h4 className="font-medium mb-3">Priority Analysis</h4>
                <div className="space-y-3">
                  {Object.entries(detailedStats.priorityStats).map(([priority, stats]) => (
                    <div key={priority} className="p-3 bg-[var(--bg-secondary)] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium capitalize">{priority}</span>
                        <span className="text-xs text-[var(--text-secondary)]">{stats.completed}/{stats.total}</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                        <div className={`h-full ${priority === 'high' ? 'bg-red-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${stats.total ? (stats.completed / stats.total) * 100 : 0}%` }} />
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">
                        Avg: {stats.avgTime.toFixed(1)}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
              <h4 className="font-medium mb-3">30-Day Streak Pattern</h4>
              <div className="flex gap-1 overflow-x-auto pb-2">
                {detailedStats.streakData.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 min-w-[24px]">
                    <div className={`w-6 h-6 rounded ${day.completed > 0 ? 'bg-green-500' : 'bg-[var(--bg-tertiary)]'}`}
                      title={`${day.date}: ${day.completed} tasks`} />
                    {i % 7 === 0 && <div className="text-xs text-[var(--text-secondary)]">{format(parseISO(day.date), 'M/d')}</div>}
                  </div>
                ))}
              </div>
            </div>
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