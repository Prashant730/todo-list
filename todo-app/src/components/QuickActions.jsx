import { useState } from 'react';
import { FiPlus, FiZap, FiCalendar, FiClock, FiTarget, FiStar } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { format, addDays, addHours } from 'date-fns';

export default function QuickActions({ onAddTask }) {
  const { dispatch } = useTodo();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

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

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition text-sm">
          <FiZap size={16} /> Quick Add
        </button>
        <button onClick={onAddTask}
          className="btn-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
          <FiPlus size={16} /> New Task
        </button>
      </div>

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