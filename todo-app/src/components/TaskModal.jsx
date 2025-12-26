import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiZap } from 'react-icons/fi';
import { differenceInDays, parseISO, addDays } from 'date-fns';
import { useTodo } from '../context/TodoContext';
import AITaskBreakdown from './AITaskBreakdown';
import { validateTask, sanitizeInput } from '../utils/validation';
import { showErrorNotification } from '../utils/errorHandler';

const defaultTask = { title: '', description: '', priority: 'medium', category: '', dueDate: '', tags: [], subtasks: [], recurring: 'none' };

export default function TaskModal({ task, onClose }) {
  const { state, dispatch } = useTodo();
  const [form, setForm] = useState(defaultTask);
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (task) setForm({ ...defaultTask, ...task });
    else setForm(defaultTask);
  }, [task]);

  // Check if this is a weekly task (due date is 5+ days away)
  const isWeeklyTask = form.dueDate && differenceInDays(parseISO(form.dueDate), new Date()) >= 5;
  const hasComplexity = form.title.length > 20 || form.description.length > 50;
  const shouldSuggestBreakdown = isWeeklyTask && hasComplexity && !task?.id; // Only for new tasks

  const handleSubmit = (e) => {
    e.preventDefault();

    // Sanitize inputs
    const sanitizedForm = {
      ...form,
      title: sanitizeInput(form.title),
      description: sanitizeInput(form.description),
      tags: form.tags.map(tag => sanitizeInput(tag)).filter(Boolean)
    };

    // Validate form
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

    // Check if we should suggest AI breakdown before saving
    if (shouldSuggestBreakdown && !showAIBreakdown) {
      setShowAIBreakdown(true);
      return;
    }

    try {
      if (task?.id) {
        dispatch({ type: 'UPDATE_TASK', payload: sanitizedForm });
      } else {
        dispatch({ type: 'ADD_TASK', payload: sanitizedForm });
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

  const handleAIBreakdownAccept = (breakdown) => {
    // Create the main task first
    const mainTask = { ...form };
    if (task?.id) {
      dispatch({ type: 'UPDATE_TASK', payload: mainTask });
    } else {
      dispatch({ type: 'ADD_TASK', payload: mainTask });
    }

    // Create daily subtasks
    breakdown.dailyTasks.forEach(day => {
      day.tasks.forEach(subtask => {
        const dailyTask = {
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority,
          category: form.category,
          dueDate: day.date + 'T12:00', // Set to noon
          tags: [...(form.tags || []), 'ai-generated', 'daily-breakdown'],
          parentTask: form.title,
          estimatedTime: subtask.estimatedTime
        };
        dispatch({ type: 'ADD_TASK', payload: dailyTask });
      });
    });

    setShowAIBreakdown(false);
    onClose();
  };

  const handleAIBreakdownReject = () => {
    setShowAIBreakdown(false);
    // Continue with normal task creation
    if (task?.id) dispatch({ type: 'UPDATE_TASK', payload: form });
    else dispatch({ type: 'ADD_TASK', payload: form });
    onClose();
  };

  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    setForm({ ...form, subtasks: [...(form.subtasks || []), { title: newSubtask, completed: false }] });
    setNewSubtask('');
  };

  const removeSubtask = (index) => {
    setForm({ ...form, subtasks: form.subtasks.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (!newTag.trim() || form.tags?.includes(newTag)) return;
    setForm({ ...form, tags: [...(form.tags || []), newTag] });
    setNewTag('');
  };

  const removeTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter(t => t !== tag) });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={onClose}>
        <div className="w-full max-w-lg bg-[var(--bg-primary)] rounded-xl shadow-2xl animate-slide-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold">{task?.id ? 'Edit Task' : 'New Task'}</h2>
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
                <label htmlFor="category-select" className="block text-sm font-medium mb-1">Category</label>
                <select id="category-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-lg">
                  <option value="">None</option>
                  {state.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="due-date-input" className="block text-sm font-medium mb-1">Due Date</label>
                <input id="due-date-input" type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-lg" />
              </div>
              <div>
                <label htmlFor="recurring-select" className="block text-sm font-medium mb-1">Recurring</label>
                <select id="recurring-select" value={form.recurring} onChange={e => setForm({ ...form, recurring: e.target.value })}
                  className="input-field w-full px-3 py-2 rounded-lg">
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            {/* AI Breakdown Suggestion */}
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

            <div>
              <label className="block text-sm font-medium mb-1">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags?.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full text-sm">
                    {tag} <button type="button" onClick={() => removeTag(tag)}><FiX size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="input-field flex-1 px-3 py-2 rounded-lg" placeholder="Add tag..." />
                <button type="button" onClick={addTag} className="px-3 py-2 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)]"><FiPlus /></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subtasks</label>
              <div className="space-y-2 mb-2">
                {form.subtasks?.map((sub, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded-lg">
                    <span className="flex-1">{sub.title}</span>
                    <button type="button" onClick={() => removeSubtask(i)} className="text-red-500"><FiTrash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  className="input-field flex-1 px-3 py-2 rounded-lg" placeholder="Add subtask..." />
                <button type="button" onClick={addSubtask} className="px-3 py-2 bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)]"><FiPlus /></button>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)]">Cancel</button>
              <button type="submit" className="flex-1 btn-primary px-4 py-2 rounded-lg">{task?.id ? 'Update' : 'Create'} Task</button>
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
