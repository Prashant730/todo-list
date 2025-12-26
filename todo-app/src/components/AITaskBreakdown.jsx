import { useState } from 'react';
import { FiZap, FiCheck, FiX, FiEdit3, FiCalendar, FiClock, FiTarget } from 'react-icons/fi';
import { aiService } from '../services/aiService.js';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { useTodo } from '../context/TodoContext';
import { handleApiError, showErrorNotification } from '../utils/errorHandler';
import { validateTask } from '../utils/validation';

export default function AITaskBreakdown({ task, onAccept, onReject, onEdit }) {
  const { state } = useTodo();
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedBreakdown, setEditedBreakdown] = useState(null);
  const [error, setError] = useState(null);

  const generateBreakdown = async () => {
    const taskValidation = validateTask(task);
    if (!taskValidation.isValid) {
      setError('Task validation failed: ' + Object.values(taskValidation.errors).join(', '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const breakdown = await aiService.generateTaskBreakdown(task);
      setBreakdown(breakdown);
    } catch (error) {
      console.error('Task breakdown error:', error);
      setError(error.message || 'Failed to generate task breakdown');
      handleApiError(error, showErrorNotification);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    const finalBreakdown = editing ? editedBreakdown : breakdown;
    onAccept(finalBreakdown);
  };

  const updateTask = (dayIndex, taskIndex, field, value) => {
    const updated = { ...editedBreakdown };
    updated.dailyTasks[dayIndex].tasks[taskIndex][field] = value;
    setEditedBreakdown(updated);
  };

  const addTask = (dayIndex) => {
    const updated = { ...editedBreakdown };
    updated.dailyTasks[dayIndex].tasks.push({
      title: 'New subtask',
      description: '',
      estimatedTime: '30 minutes',
      priority: 'medium'
    });
    setEditedBreakdown(updated);
  };

  const removeTask = (dayIndex, taskIndex) => {
    const updated = { ...editedBreakdown };
    updated.dailyTasks[dayIndex].tasks.splice(taskIndex, 1);
    setEditedBreakdown(updated);
  };

  const currentBreakdown = editing ? editedBreakdown : breakdown;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-4xl bg-[var(--bg-primary)] rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <FiZap className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Task Breakdown</h2>
              <p className="text-sm text-[var(--text-secondary)]">"{task.title}"</p>
            </div>
          </div>
          <button onClick={onReject} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!breakdown && !loading && (
            <div className="text-center py-12">
              <FiTarget size={64} className="mx-auto mb-6 text-purple-500 opacity-50" />
              <h3 className="text-lg font-semibold mb-3">Break Down This Task</h3>
              <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Let AI analyze your task and create a smart daily breakdown for the week
              </p>
              <button onClick={generateBreakdown}
                className="btn-primary px-8 py-3 rounded-xl flex items-center gap-2 mx-auto font-medium">
                <FiZap size={18} /> Generate Breakdown
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)]">AI is analyzing your task...</p>
            </div>
          )}

          {currentBreakdown && (
            <div className="space-y-6">
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FiTarget className="text-purple-500" /> AI Analysis
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-3">{currentBreakdown.reasoning}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <FiClock className="text-blue-500" /> {currentBreakdown.totalEstimatedTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="text-green-500" /> {currentBreakdown.dailyTasks.length} days
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Daily Breakdown</h3>
                <button onClick={() => setEditing(!editing)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${editing ? 'bg-green-500 text-white' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'}`}>
                  <FiEdit3 size={16} /> {editing ? 'Done Editing' : 'Edit Tasks'}
                </button>
              </div>

              <div className="grid gap-4">
                {currentBreakdown.dailyTasks.map((day, dayIndex) => (
                  <div key={dayIndex} className="bg-[var(--bg-secondary)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{day.day}</h4>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {format(new Date(day.date), 'MMM d')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {day.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="bg-[var(--bg-primary)] rounded-lg p-3 border border-[var(--border-color)]">
                          {editing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={task.title}
                                onChange={(e) => updateTask(dayIndex, taskIndex, 'title', e.target.value)}
                                className="input-field w-full px-3 py-2 rounded-lg text-sm font-medium"
                              />
                              <textarea
                                value={task.description}
                                onChange={(e) => updateTask(dayIndex, taskIndex, 'description', e.target.value)}
                                className="input-field w-full px-3 py-2 rounded-lg text-sm resize-none"
                                rows={2}
                                placeholder="Description..."
                              />
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={task.estimatedTime}
                                  onChange={(e) => updateTask(dayIndex, taskIndex, 'estimatedTime', e.target.value)}
                                  className="input-field px-3 py-1 rounded text-xs flex-1"
                                  placeholder="Time estimate"
                                />
                                <select
                                  value={task.priority}
                                  onChange={(e) => updateTask(dayIndex, taskIndex, 'priority', e.target.value)}
                                  className="input-field px-3 py-1 rounded text-xs">
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                                <button onClick={() => removeTask(dayIndex, taskIndex)}
                                  className="px-2 py-1 text-red-500 hover:bg-red-500/10 rounded text-xs">
                                  <FiX size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h5 className="font-medium text-sm mb-1">{task.title}</h5>
                              {task.description && (
                                <p className="text-xs text-[var(--text-secondary)] mb-2">{task.description}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs">
                                <span className="flex items-center gap-1">
                                  <FiClock size={12} /> {task.estimatedTime}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full ${
                                  task.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                                  'bg-green-500/20 text-green-600'
                                }`}>
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {editing && (
                        <button onClick={() => addTask(dayIndex)}
                          className="w-full py-2 border-2 border-dashed border-[var(--border-color)] rounded-lg text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition">
                          + Add Task
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {currentBreakdown.tips && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="font-medium mb-2 text-blue-600">💡 AI Tips</h4>
                  <ul className="text-sm space-y-1">
                    {currentBreakdown.tips.map((tip, i) => (
                      <li key={i} className="text-[var(--text-secondary)]">• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {currentBreakdown && (
          <div className="flex gap-3 p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
            <button onClick={onReject}
              className="flex-1 px-6 py-3 border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-tertiary)] transition font-medium">
              Cancel
            </button>
            <button onClick={handleAccept}
              className="flex-1 btn-primary px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-medium">
              <FiCheck size={18} /> Apply Breakdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
}