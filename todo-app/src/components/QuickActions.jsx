import { useState, useEffect } from 'react';
import { FiPlus, FiZap, FiCalendar, FiClock, FiTarget, FiStar, FiSun, FiX, FiTrendingUp } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { aiService } from '../services/aiService.js';
import { format, addDays, addHours, endOfWeek } from 'date-fns';

export default function QuickActions({ onAddTask }) {
  const { state, dispatch } = useTodo();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showScheduleSelect, setShowScheduleSelect] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Listen for openNewTaskMenu event from TaskList empty state
  useEffect(() => {
    const handleOpenNewTaskMenu = () => setShowScheduleSelect(true);
    window.addEventListener('openNewTaskMenu', handleOpenNewTaskMenu);
    return () => window.removeEventListener('openNewTaskMenu', handleOpenNewTaskMenu);
  }, []);

  const quickTemplates = [
    {
      icon: FiClock,
      label: 'Due Today',
      color: 'bg-blue-500',
      action: () => createQuickTask('high', format(addHours(new Date(), 8), "yyyy-MM-dd'T'HH:mm"))
    },
    {
      icon: FiCalendar,
      label: 'This Week',
      color: 'bg-green-500',
      action: () => createQuickTask('medium', format(addDays(new Date(), 7), "yyyy-MM-dd'T'12:00"))
    },
    {
      icon: FiTarget,
      label: 'High Priority',
      color: 'bg-red-500',
      action: () => createQuickTask('high')
    },
    {
      icon: FiStar,
      label: 'Personal',
      color: 'bg-purple-500',
      action: () => createQuickTask('medium', null, 'Personal')
    }
  ];

  const createQuickTask = (priority = 'medium', dueDate = null, category = '') => {
    if (!quickTitle.trim()) return;

    dispatch({
      type: 'ADD_TASK',
      payload: {
        title: quickTitle,
        priority,
        dueDate,
        category,
        tags: ['quick-add']
      }
    });

    setQuickTitle('');
    setShowQuickAdd(false);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    createQuickTask();
  };

  // Handle schedule type selection for New Task button
  const handleScheduleSelect = (type) => {
    setShowScheduleSelect(false);

    // Calculate due date based on selection
    const now = new Date();
    let dueDate = '';

    if (type === 'daily') {
      dueDate = format(now, "yyyy-MM-dd") + 'T23:59';
    } else if (type === 'weekly') {
      const weekEnd = endOfWeek(now);
      dueDate = format(weekEnd, "yyyy-MM-dd") + 'T23:59';
    }

    // Open task modal with pre-filled due date
    onAddTask({ scheduleType: type, dueDate });
  };

  // Generate AI suggestions for tasks
  const generateAISuggestions = async () => {
    if (aiLoading || state.tasks.length === 0) return;

    setAiLoading(true);
    try {
      const suggestions = await aiService.generateInsights(state.tasks);
      if (suggestions && suggestions.length > 0) {
        // Dispatch event to scroll to AI Insights section
        window.dispatchEvent(new CustomEvent('scrollToAIInsights'));
        // Trigger refresh in AIInsights component
        window.dispatchEvent(new CustomEvent('refreshAIInsights'));
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button onClick={generateAISuggestions}
          disabled={aiLoading || state.tasks.length === 0}
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg hover:from-purple-500/20 hover:to-blue-500/20 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          title="Get AI-powered insights">
          <FiTrendingUp size={16} className={`text-purple-500 ${aiLoading ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{aiLoading ? 'Analyzing...' : 'AI Insights'}</span>
        </button>
        <button onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition text-sm">
          <FiZap size={16} /> Quick Add
        </button>
        <button onClick={() => setShowScheduleSelect(true)}
          className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <FiPlus size={16} /> New Task
        </button>
      </div>

      {/* Schedule Type Selection Popup */}
      {showScheduleSelect && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowScheduleSelect(false)} />
          <div className="absolute top-12 right-0 w-72 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 p-4 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Add task to:</h3>
              <button onClick={() => setShowScheduleSelect(false)} className="p-1 hover:bg-[var(--bg-secondary)] rounded">
                <FiX size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Daily Option */}
              <button
                onClick={() => handleScheduleSelect('daily')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-orange-400 hover:bg-orange-500/5 transition group"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition">
                  <FiSun size={24} className="text-orange-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Daily Task</div>
                  <div className="text-xs text-[var(--text-secondary)]">Due today at 11:59 PM</div>
                </div>
              </button>

              {/* Weekly Option */}
              <button
                onClick={() => handleScheduleSelect('weekly')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-blue-400 hover:bg-blue-500/5 transition group"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition">
                  <FiCalendar size={24} className="text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Weekly Task</div>
                  <div className="text-xs text-[var(--text-secondary)]">Due end of this week</div>
                </div>
              </button>

              {/* Custom Option */}
              <button
                onClick={() => handleScheduleSelect('custom')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[var(--border-color)] hover:border-purple-400 hover:bg-purple-500/5 transition group"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition">
                  <FiPlus size={24} className="text-purple-500" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Custom Date</div>
                  <div className="text-xs text-[var(--text-secondary)]">Choose your own due date</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {showQuickAdd && (
        <div className="absolute top-12 left-0 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 p-4 animate-slide-in">
          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="input-field w-full px-3 py-2 rounded-lg text-sm"
              autoFocus
            />

            <div className="grid grid-cols-2 gap-2">
              {quickTemplates.map((template, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={template.action}
                  disabled={!quickTitle.trim()}
                  className={`${template.color} text-white p-2 rounded-lg hover:opacity-90 transition flex items-center gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <template.icon size={14} />
                  {template.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowQuickAdd(false)}
                className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-lg text-sm hover:bg-[var(--bg-secondary)] transition">
                Cancel
              </button>
              <button type="submit" disabled={!quickTitle.trim()}
                className="flex-1 btn-primary px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                Add Task
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
