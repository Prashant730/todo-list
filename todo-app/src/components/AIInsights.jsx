import { useState, useEffect, useMemo } from 'react';
import { FiZap, FiTrendingUp, FiAlertTriangle, FiTarget, FiClock, FiAward, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { aiService } from '../services/aiService.js';
import { useTodo } from '../context/TodoContext';
import { format, parseISO, isPast, isToday, differenceInDays, startOfWeek, endOfWeek, isWithinInterval, subDays } from 'date-fns';

const INSIGHTS_CACHE_KEY = 'ai-insights-cache';
const ANALYSIS_INTERVAL = 5 * 60 * 1000; // Re-analyze every 5 minutes

// Helper function to get icon for insight type
const getInsightIcon = (type) => {
  switch (type) {
    case 'priority': return FiTarget;
    case 'time': return FiClock;
    case 'pattern': return FiTrendingUp;
    default: return FiZap;
  }
};

export default function AIInsights() {
  const { state } = useTodo();
  const [insights, setInsights] = useState(() => {
    const cached = localStorage.getItem(INSIGHTS_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [lastAnalysis, setLastAnalysis] = useState(0);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [showKeyInput] = useState(false); // Keep for UI consistency

  // Calculate local insights (no AI needed)
  const localInsights = useMemo(() => {
    const tasks = state.tasks;
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // Overdue tasks
    const overdueTasks = tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && !t.completed);

    // Due today
    const todayTasks = tasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate)) && !t.completed);

    // High priority incomplete
    const urgentTasks = tasks.filter(t => t.priority === 'high' && !t.completed);

    // Completion rate this week
    const completedThisWeek = tasks.filter(t => t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: weekStart, end: weekEnd })).length;

    // Tasks without due dates
    const noDueDateTasks = tasks.filter(t => !t.dueDate && !t.completed);

    // Stale tasks (created > 7 days ago, not completed)
    const staleTasks = tasks.filter(t => {
      if (t.completed) return false;
      const created = parseISO(t.createdAt);
      return differenceInDays(now, created) > 7;
    });

    // Productivity pattern - what time tasks are completed
    const completionHours = tasks.filter(t => t.completedAt).map(t => new Date(t.completedAt).getHours());
    const avgCompletionHour = completionHours.length ? Math.round(completionHours.reduce((a, b) => a + b, 0) / completionHours.length) : null;

    // Category performance
    const categoryStats = {};
    tasks.forEach(t => {
      if (!t.category) return;
      if (!categoryStats[t.category]) categoryStats[t.category] = { total: 0, completed: 0 };
      categoryStats[t.category].total++;
      if (t.completed) categoryStats[t.category].completed++;
    });

    // Best performing category
    let bestCategory = null;
    let bestRate = 0;
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      const rate = stats.total > 2 ? stats.completed / stats.total : 0;
      if (rate > bestRate) { bestRate = rate; bestCategory = cat; }
    });

    // Worst performing category
    let worstCategory = null;
    let worstRate = 1;
    Object.entries(categoryStats).forEach(([cat, stats]) => {
      const rate = stats.total > 2 ? stats.completed / stats.total : 1;
      if (rate < worstRate) { worstRate = rate; worstCategory = cat; }
    });

    // Streak - consecutive days with completed tasks
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const day = subDays(now, i);
      const hasCompletion = tasks.some(t => t.completedAt && format(parseISO(t.completedAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
      if (hasCompletion) streak++;
      else if (i > 0) break;
    }

    return {
      overdueTasks,
      todayTasks,
      urgentTasks,
      completedThisWeek,
      noDueDateTasks,
      staleTasks,
      avgCompletionHour,
      bestCategory,
      worstCategory,
      streak,
      totalActive: tasks.filter(t => !t.completed).length,
      totalCompleted: tasks.filter(t => t.completed).length,
    };
  }, [state.tasks]);

  // Check AI availability on mount
  useEffect(() => {
    const checkAI = async () => {
      try {
        await aiService.initialize();
        setAiAvailable(true);
      } catch (error) {
        console.log('AI service not available:', error.message);
        setAiAvailable(false);
      }
    };
    checkAI();
  }, []);

  // Generate AI insights
  const generateAIInsights = async () => {
    if (!aiAvailable || loading) return;
    if (state.tasks.length === 0) return;

    setLoading(true);
    try {
      const insights = await aiService.generateInsights(state.tasks);

      // Transform the insights to match the expected format
      const formattedInsights = insights.map(insight => ({
        type: insight.type || 'general',
        title: insight.title,
        description: insight.description,
        icon: getInsightIcon(insight.type || 'general')
      }));

      setInsights(formattedInsights);

      // Cache the insights
      const cacheData = {
        insights: formattedInsights,
        timestamp: Date.now(),
        taskCount: state.tasks.length
      };
      localStorage.setItem(INSIGHTS_CACHE_KEY, JSON.stringify(cacheData));

    } catch (error) {
      console.error('AI Insights Error:', error);
      // Fall back to local insights on error
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-analyze on mount and when tasks change significantly
  useEffect(() => {
    if (!aiAvailable) return;
    const timeSinceLastAnalysis = Date.now() - lastAnalysis;
    if (timeSinceLastAnalysis > ANALYSIS_INTERVAL && state.tasks.length > 0) {
      generateAIInsights();
      setLastAnalysis(Date.now());
    }
  }, [aiAvailable, state.tasks.length, localInsights.overdueTasks.length, localInsights.totalCompleted]);

  const saveApiKey = (key) => {
    // This function is no longer needed as we use centralized AI service
    console.log('API key management is now handled by the centralized AI service');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <FiAlertTriangle className="text-red-500" />;
      case 'achievement': return <FiAward className="text-yellow-500" />;
      case 'tip': return <FiTarget className="text-blue-500" />;
      default: return <FiZap className="text-purple-500" />;
    }
  };

  // Quick local alerts (always show, no AI needed)
  const quickAlerts = useMemo(() => {
    const alerts = [];
    if (localInsights.overdueTasks.length > 0) {
      alerts.push({ type: 'warning', text: `⚠️ ${localInsights.overdueTasks.length} overdue task${localInsights.overdueTasks.length > 1 ? 's' : ''} need attention!`, priority: 1 });
    }
    if (localInsights.todayTasks.length > 0) {
      alerts.push({ type: 'tip', text: `📅 ${localInsights.todayTasks.length} task${localInsights.todayTasks.length > 1 ? 's' : ''} due today`, priority: 2 });
    }
    if (localInsights.streak >= 3) {
      alerts.push({ type: 'achievement', text: `🔥 ${localInsights.streak}-day productivity streak!`, priority: 3 });
    }
    if (localInsights.urgentTasks.length > 3) {
      alerts.push({ type: 'suggestion', text: `🎯 ${localInsights.urgentTasks.length} high-priority tasks pending - consider delegating or rescheduling`, priority: 2 });
    }
    if (localInsights.noDueDateTasks.length > 0) {
      alerts.push({ type: 'tip', text: `📋 ${localInsights.noDueDateTasks.length} tasks without due dates - consider adding deadlines for better planning`, priority: 3 });
    }
    if (localInsights.staleTasks.length > 0) {
      alerts.push({ type: 'warning', text: `⏰ ${localInsights.staleTasks.length} tasks have been pending for over a week`, priority: 2 });
    }
    if (localInsights.bestCategory) {
      alerts.push({ type: 'achievement', text: `🏆 You're doing great with ${localInsights.bestCategory} tasks!`, priority: 4 });
    }
    if (localInsights.avgCompletionHour !== null) {
      const timeOfDay = localInsights.avgCompletionHour < 12 ? 'morning' : localInsights.avgCompletionHour < 17 ? 'afternoon' : 'evening';
      alerts.push({ type: 'tip', text: `⏰ You tend to complete tasks in the ${timeOfDay} (around ${localInsights.avgCompletionHour}:00)`, priority: 4 });
    }

    // Always show at least one insight
    if (alerts.length === 0 && state.tasks.length > 0) {
      alerts.push({ type: 'tip', text: `📊 You have ${localInsights.totalActive} active tasks and ${localInsights.totalCompleted} completed tasks`, priority: 5 });
    }

    return alerts.sort((a, b) => a.priority - b.priority);
  }, [localInsights, state.tasks.length]);

  const displayInsights = insights && insights.length > 0 ? insights : quickAlerts;

  // Show welcome message if no tasks
  const welcomeInsights = [
    { type: 'tip', text: '👋 Welcome! Add some tasks to see AI-powered productivity insights.' },
    { type: 'suggestion', text: '💡 Try creating tasks with due dates and priorities for better analysis.' }
  ];

  // Always show the panel, even with no tasks

  return (
    <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 transition" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <FiZap className="text-white" size={20} />
          </div>
          <div>
            <span className="font-semibold text-lg">AI Insights</span>
            {loading && <FiRefreshCw className="inline ml-2 animate-spin text-purple-500" size={16} />}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!aiAvailable && (
            <span className="text-sm px-3 py-1 bg-yellow-500/20 text-yellow-600 rounded-lg">
              AI Offline - Showing Local Insights
            </span>
          )}
          {aiAvailable && (
            <button onClick={(e) => { e.stopPropagation(); generateAIInsights(); }}
              className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition" title="Refresh insights">
              <FiRefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
          {expanded ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
        </div>
      </div>

      {showKeyInput && (
        <div className="px-4 pb-4 border-t border-purple-500/20">
          <div className="p-4 bg-[var(--bg-secondary)] rounded-xl mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">AI Configuration</h4>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              AI is configured through environment variables. Check your .env file for VITE_GROQ_API_KEY, VITE_DEEPSEEK_API_KEY, or VITE_GEMINI_API_KEY.
            </p>
          </div>
        </div>
      )}

      {expanded && (displayInsights.length > 0 || state.tasks.length === 0) && (
        <div className="px-4 pb-4 space-y-3">
          {(state.tasks.length === 0 ? welcomeInsights : displayInsights).map((insight, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:shadow-sm transition">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getIcon(insight.type)}
              </div>
              <p className="text-sm flex-1 leading-relaxed">{insight.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
