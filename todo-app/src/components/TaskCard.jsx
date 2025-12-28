import { useState } from 'react';
import { FiCheck, FiEdit2, FiTrash2, FiCalendar, FiChevronDown, FiChevronUp, FiZap } from 'react-icons/fi';
import { format, isPast, parseISO, differenceInDays } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTodo } from '../context/TodoContext';
import AITaskBreakdown from './AITaskBreakdown';

const priorityColors = { high: 'text-red-500', medium: 'text-yellow-500', low: 'text-green-500' };

export default function TaskCard({ task, onEdit, focusKey, onKeyNavigation }) {
  const { dispatch } = useTodo();
  const [expanded, setExpanded] = useState(false);
  const [showAIBreakdown, setShowAIBreakdown] = useState(false);

  // Use _id from MongoDB or fallback to id
  const taskId = task._id || task.id;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: taskId });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !task.completed;

  // Check if this task could benefit from AI breakdown
  const canBreakdown = task.dueDate && differenceInDays(parseISO(task.dueDate), new Date()) >= 3 && !task.completed;

  const handleAIBreakdownAccept = async (breakdown) => {
    // Create daily subtasks
    const subtasks = [];
    breakdown.dailyTasks.forEach(day => {
      day.tasks.forEach(subtask => {
        subtasks.push({
          title: subtask.title,
          description: subtask.description,
          priority: subtask.priority,
          categories: task.categories || (task.category ? [task.category] : []),
          dueDate: day.date + 'T12:00',
          parentTask: task.title,
          estimatedTime: subtask.estimatedTime
        });
      });
    });

    if (subtasks.length > 0) {
      await dispatch({ type: 'ADD_MULTIPLE_TASKS', payload: subtasks });
    }
    setShowAIBreakdown(false);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        dispatch({ type: 'TOGGLE_TASK', payload: taskId });
        break;
      case 'e':
      case 'E':
        e.preventDefault();
        onEdit(task);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        dispatch({ type: 'DELETE_TASK', payload: taskId });
        break;
      default:
        if (onKeyNavigation) {
          onKeyNavigation(e, focusKey);
        }
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`task-card rounded-lg p-4 mb-3 animate-slide-in priority-${task.priority || 'low'} ${task.completed ? 'opacity-60' : ''} relative focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        role="listitem"
        aria-label={`Task: ${task.title}${task.completed ? ' (completed)' : ''}${isOverdue ? ' (overdue)' : ''}`}
        aria-describedby={`task-${taskId}-details`}
      >
        <div className="flex items-start gap-3">
          <button
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Drag to reorder task"
            tabIndex={-1}
          >
            ⋮⋮
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_TASK', payload: taskId })}
            className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[var(--accent)] ${task.completed ? 'bg-[var(--success)] border-[var(--success)]' : 'border-[var(--border-color)] hover:border-[var(--accent)]'}`}
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            aria-pressed={task.completed}
          >
            {task.completed && <FiCheck size={12} className="text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium ${task.completed ? 'line-through text-[var(--text-secondary)]' : ''}`}>
              {task.title}
            </h3>
            {task.description && expanded && (
              <p className="text-sm text-[var(--text-secondary)] mt-1" id={`task-${taskId}-description`}>
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs" id={`task-${taskId}-details`}>
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                  <FiCalendar size={12} aria-hidden="true" />
                  <time dateTime={task.dueDate}>
                    {format(parseISO(task.dueDate), 'MMM d, yyyy')}
                  </time>
                  {isOverdue && <span className="sr-only">(overdue)</span>}
                </span>
              )}
              {/* Display multiple categories */}
              {(task.categories || (task.category ? [task.category] : [])).map(category => {
                const catName = typeof category === 'string' ? category : category?.name || '';
                const catId = typeof category === 'string' ? category : category?._id || category?.name || '';
                return (
                  <span key={catId} className="px-2 py-0.5 bg-[var(--bg-tertiary)] rounded-full">
                    {catName}
                  </span>
                );
              })}
              {task.priority && (
                <span className={`font-medium ${priorityColors[task.priority]}`}>
                  {task.priority} priority
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1" role="toolbar" aria-label="Task actions">
            {task.description && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                aria-label={expanded ? 'Collapse description' : 'Expand description'}
                aria-expanded={expanded}
              >
                {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
              </button>
            )}
            {canBreakdown && (
              <button
                onClick={() => setShowAIBreakdown(true)}
                className="p-1.5 rounded hover:bg-purple-500/10 text-purple-500 transition focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Generate AI task breakdown"
              >
                <FiZap size={16} />
              </button>
            )}
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              aria-label="Edit task"
            >
              <FiEdit2 size={16} />
            </button>
            <button
              onClick={() => dispatch({ type: 'DELETE_TASK', payload: taskId })}
              className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Delete task"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        </div>
      </div>
      {showAIBreakdown && (
        <AITaskBreakdown
          task={task}
          onAccept={handleAIBreakdownAccept}
          onReject={() => setShowAIBreakdown(false)}
        />
      )}
    </>
  );
}
