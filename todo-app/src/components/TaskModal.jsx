import { useState, useEffect } from 'react';
import { FiX, FiZap } from 'react-icons/fi';
import { differenceInDays, parseISO } from 'date-fns';
import { useTodo } from '../context/TodoContext';
import AITaskBreakdown from './AITaskBreakdown';
import { validateTask, sanitizeInput } from '../utils/validation';
import { showErrorNotification } from '../utils/errorHandler';

const defaultTask = { title: '', description: '', priority: 'medium', categories: [], dueDate: '' };

export default function TaskModal({ task, onClose }) {
  const { state, dispatch } = useTodo();
  const [form, setForm] = useState(defaultTask);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (task) {
      // Check if it's a preset (has scheduleType but no id)
      if (task.scheduleType && !task.id && !task._id) {
        setForm({
          ...defaultTask,
          scheduleType: task.scheduleType,
          dueDate: task.dueDate || ''
        });
      } else {
        // Editing existing task
        const migratedTask = {
          ...defaultTask,
          ...task,
          categories: task.categories || (task.category ? [task.category] : [])
        };
        setForm(migratedTask);
      }
    } else {
      setForm(defaultTask);
    }
  }, [task]);

  // Check if this is a weekly task (due date is 5+ days away)
  const isWeeklyTask = form.dueDate && differenceInDays(parseISO(form.dueDate), new Date()) >= 5;
  const hasComplexity = form.title.length > 20 || form.description.length > 50;
  const shouldSuggestBreakdown = isWeeklyTask && hasComplexity && !task?.id && !task?._id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const sanitizedForm = {
      ...form,
      title: sanitizeInput(form.title),
      description: sanitizeInput(form.description),
      categories: form.categories || []
    };

    const validation = validateTask(sanitizedForm);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      showErrorNotification(
        { message: 'Please fix the validation errors below' },
        (notification) => console.log(notification.message)
      );
      return;
    }

    setValidationErrors({});

    if (shouldSuggestBreakdown && !showAIBreakdown) {
      setShowAIBreakdown(true);
      return;
    }

    try {
      if (task?._id || task?.id) {
        await dispatch({ type: 'UPDATE_TASK', payload: { ...sanitizedForm, _id: task._id || task.id } });
      } else {
        await dispatch({ type: 'ADD_TASK', payload: sanitizedForm });
      }
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      showErrorNotification(
        { message: 'Failed to save task. Please try again.' },
        (notification) => alert(notification.message)
      );
    }
  };

  const handleAIBreakdownAccept = async (breakdown) => {
    const mainTask = { ...form };
    if (task?._id || task?.id) {
      await dispatch({ type: 'UPDATE_TASK', payload: { ...mainTask, _id: task._id || task.id } });
    } else {
      await dispatch({ type: 'ADD_TASK', payload: mainTask });
    }

    const subtasks = [];
    breakdown.dailyTasks.forEach(day => {
      day.tasks.forEach(subtask => {
        subtasks.push({
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority,
          categories: form.categories || [],
          dueDate: day.date + 'T12:00',
          parentTask: form.title,
          estimatedTime: subtask.estimatedTime
        });
      });
    });

    if (subtasks.length > 0) {
      await dispatch({ type: 'ADD_MULTIPLE_TASKS', payload: subtasks });
    }

    setShowAIBreakdown(false);
    onClose();
  };

  const handleAIBreakdownReject = async () => {
    setShowAIBreakdown(false);
    if (task?._id || task?.id) {
      await dispatch({ type: 'UPDATE_TASK', payload: { ...form, _id: task._id || task.id } });
    } else {
      await dispatch({ type: 'ADD_TASK', payload: form });
    }
    onClose();
  };

  const addCategory = (category) => {
    if (!category || form.categories?.includes(category)) return;
    setForm({ ...form, categories: [...(form.categories || []), category] });
  };

  const removeCategory = (category) => {
    setForm({ ...form, categories: form.categories.filter(c => c !== category) });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
        <div className="w-full max-w-lg bg-[var(--bg-primary)] rounded-xl shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{task?.id ? 'Edit Task' : 'New Task'}</h2>
              {form.scheduleType && !task?.id && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  form.scheduleType === 'daily'
                    ? 'bg-orange-500/20 text-orange-600'
                    : form.scheduleType === 'weekly'
                    ? 'bg-blue-500/20 text-blue-600'
                    : 'bg-purple-500/20 text-purple-600'
                }`}>
                  {form.scheduleType === 'daily' ? '☀️ Daily' : form.scheduleType === 'weekly' ? '📅 Weekly' : '📆 Custom'}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-secondary)]"><FiX size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className={`input-field w-full px-3 py-2 rounded-lg ${validationErrors.title ? 'border-red-500' : ''}`}
                placeholder="What needs to be done?" autoFocus />
              {validationErrors.title && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className={`input-field w-full px-3 py-2 rounded-lg resize-none ${validationErrors.description ? 'border-red-500' : ''}`}
                rows={3} placeholder="Add details..." />
              {validationErrors.description && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.description}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority-select" className="block text-sm font-medium mb-1">Priority</label>
                <select id="priority-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-lg">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label htmlFor="categories-select" className="block text-sm font-medium mb-1">Categories</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.categories?.map(category => {
                    const catName = typeof category === 'string' ? category : category?.name || '';
                    return (
                      <span key={catName} className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full text-sm">
                        {catName} <button type="button" onClick={() => removeCategory(catName)}><FiX size={12} /></button>
                      </span>
                    );
                  })}
                </div>
                <select id="categories-select" value="" onChange={e => e.target.value && addCategory(e.target.value)}
                  className="input-field w-full px-3 py-2 rounded-lg">
                  <option value="">Select category to add...</option>
                  {state.categories.map(cat => {
                    const catName = typeof cat === 'string' ? cat : cat?.name || '';
                    const catId = typeof cat === 'string' ? cat : cat?._id || cat?.name || '';
                    const isSelected = form.categories?.some(c => (typeof c === 'string' ? c : c?.name) === catName);
                    if (isSelected) return null;
                    return <option key={catId} value={catName}>{catName}</option>;
                  })}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="due-date-input" className="block text-sm font-medium mb-1">Due Date</label>
              <input id="due-date-input" type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="input-field w-full px-3 py-2 rounded-lg" />
            </div>

            {shouldSuggestBreakdown && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FiZap className="text-purple-500" size={16} />
                  <span className="text-sm font-medium">AI Suggestion</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  This looks like a complex weekly task. Would you like AI to break it down into daily subtasks?
                </p>
                <button type="button" onClick={() => setShowAIBreakdown(true)}
                  className="text-xs px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition">
                  ✨ Get AI Breakdown
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]">Cancel</button>
              <button type="submit" className="flex-1 btn-primary px-4 py-2 rounded-lg">{task?._id || task?.id ? 'Update' : 'Create'} Task</button>
            </div>
          </form>
        </div>
      </div>

      {showAIBreakdown && (
        <AITaskBreakdown
          task={form}
          onAccept={handleAIBreakdownAccept}
          onReject={handleAIBreakdownReject}
        />
      )}
    </>
  );
}