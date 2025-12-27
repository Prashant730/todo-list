import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { arrayMove } from '@dnd-kit/sortable';
import { FiInbox, FiCheck, FiTrash2, FiMoreHorizontal } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { useFilteredTasks } from '../hooks/useFilteredTasks';
import { useFocusManager } from '../hooks/useFocusManager';
import TaskCard from './TaskCard';
import VirtualTaskList from './VirtualTaskList';
import { TaskListSkeleton } from './LoadingStates';

export default function TaskList({ onEditTask, loading = false }) {
  const { state, dispatch } = useTodo();
  const filteredTasks = useFilteredTasks(state.tasks, state.filter);
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const focusManager = useFocusManager();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = state.tasks.findIndex(t => t.id === active.id);
      const newIndex = state.tasks.findIndex(t => t.id === over.id);
      dispatch({ type: 'REORDER_TASKS', payload: arrayMove(state.tasks, oldIndex, newIndex) });
    }
  };

  const toggleTaskSelection = (taskId) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllTasks = () => {
    const allIds = new Set(filteredTasks.map(t => t.id));
    setSelectedTasks(allIds);
    setShowBulkActions(true);
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
    setShowBulkActions(false);
  };

  const bulkComplete = () => {
    Array.from(selectedTasks).forEach(id => {
      dispatch({ type: 'TOGGLE_COMPLETE', payload: id });
    });
    clearSelection();
  };

  const bulkDelete = () => {
    if (confirm(`Delete ${selectedTasks.size} selected tasks?`)) {
      Array.from(selectedTasks).forEach(id => {
        dispatch({ type: 'DELETE_TASK', payload: id });
      });
      clearSelection();
    }
  };

  const bulkUpdatePriority = (priority) => {
    dispatch({
      type: 'BULK_UPDATE',
      payload: {
        ids: Array.from(selectedTasks),
        updates: { priority }
      }
    });
    clearSelection();
  };

  // Show loading skeleton while tasks are loading
  if (loading) {
    return <TaskListSkeleton count={5} />;
  }

  if (filteredTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
        <FiInbox size={64} className="mb-6 opacity-30" />
        <h3 className="text-xl font-medium mb-2">No tasks found</h3>
        <p className="text-sm mb-6">Create a new task to get started with your productivity journey</p>
        <button onClick={() => window.dispatchEvent(new CustomEvent('openNewTaskMenu'))}
          className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
          <FiInbox size={18} /> Create Your First Task
        </button>
      </div>
    );
  }

  if (state.viewMode === 'grid') {
    return (
      <div>
        {showBulkActions && (
          <BulkActionsBar
            selectedCount={selectedTasks.size}
            onComplete={bulkComplete}
            onDelete={bulkDelete}
            onUpdatePriority={bulkUpdatePriority}
            onClear={clearSelection}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map(task => (
            <div key={task.id} className="relative">
              {filteredTasks.length > 1 && (
                <input
                  type="checkbox"
                  checked={selectedTasks.has(task.id)}
                  onChange={() => toggleTaskSelection(task.id)}
                  className="absolute top-2 left-2 z-20 rounded"
                />
              )}
              <TaskCard task={task} onEdit={onEditTask} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {filteredTasks.length > 1 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-[var(--bg-primary)] rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedTasks.size === filteredTasks.length}
              onChange={selectedTasks.size === filteredTasks.length ? clearSelection : selectAllTasks}
              className="rounded"
            />
            <span className="text-sm text-[var(--text-secondary)]">
              {selectedTasks.size > 0 ? `${selectedTasks.size} selected` : 'Select all'}
            </span>
          </div>
          {selectedTasks.size > 0 && (
            <BulkActionsBar
              selectedCount={selectedTasks.size}
              onComplete={bulkComplete}
              onDelete={bulkDelete}
              onUpdatePriority={bulkUpdatePriority}
              onClear={clearSelection}
              compact
            />
          )}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {/* Use virtual scrolling for large lists */}
          {filteredTasks.length > 50 ? (
            <VirtualTaskList
              tasks={filteredTasks}
              onEdit={onEditTask}
              onToggle={(id) => dispatch({ type: 'TOGGLE_COMPLETE', payload: id })}
              onDelete={(id) => dispatch({ type: 'DELETE_TASK', payload: id })}
            />
          ) : (
            <div role="list" aria-label="Task list">
              {filteredTasks.map((task, index) => (
                <div key={task.id} className="relative mb-3">
                  {filteredTasks.length > 1 && (
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="absolute top-4 left-4 z-20 rounded"
                      aria-label={`Select task: ${task.title}`}
                    />
                  )}
                  <div className={selectedTasks.has(task.id) ? 'ml-8' : ''}>
                    <TaskCard
                      task={task}
                      onEdit={onEditTask}
                      focusKey={`task-${index}`}
                      onKeyNavigation={focusManager.handleKeyNavigation}
                      ref={(el) => focusManager.registerElement(`task-${index}`, el)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}

function BulkActionsBar({ selectedCount, onComplete, onDelete, onUpdatePriority, onClear, compact = false }) {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={onComplete} className="p-1.5 text-green-600 hover:bg-green-600/10 rounded" title="Mark Complete">
          <FiCheck size={16} />
        </button>
        <div className="relative">
          <button onClick={() => setShowPriorityMenu(!showPriorityMenu)} className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded" title="Set Priority">
            <FiMoreHorizontal size={16} />
          </button>
          {showPriorityMenu && (
            <div className="absolute top-8 right-0 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-10">
              <button onClick={() => { onUpdatePriority('high'); setShowPriorityMenu(false); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] text-red-500">High Priority</button>
              <button onClick={() => { onUpdatePriority('medium'); setShowPriorityMenu(false); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] text-yellow-600">Medium Priority</button>
              <button onClick={() => { onUpdatePriority('low'); setShowPriorityMenu(false); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] text-green-600">Low Priority</button>
            </div>
          )}
        </div>
        <button onClick={onDelete} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded" title="Delete">
          <FiTrash2 size={16} />
        </button>
        <button onClick={onClear} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Clear</button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg mb-4">
      <span className="text-sm font-medium">{selectedCount} tasks selected</span>
      <div className="flex items-center gap-2">
        <button onClick={onComplete} className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
          <FiCheck size={14} className="inline mr-1" /> Complete
        </button>
        <div className="relative">
          <button onClick={() => setShowPriorityMenu(!showPriorityMenu)} className="px-3 py-1.5 bg-[var(--bg-secondary)] rounded text-sm hover:bg-[var(--bg-tertiary)]">
            Set Priority
          </button>
          {showPriorityMenu && (
            <div className="absolute top-8 right-0 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-lg z-10">
              <button onClick={() => { onUpdatePriority('high'); setShowPriorityMenu(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] text-red-500">High Priority</button>
              <button onClick={() => { onUpdatePriority('medium'); setShowPriorityMenu(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] text-yellow-600">Medium Priority</button>
              <button onClick={() => { onUpdatePriority('low'); setShowPriorityMenu(false); }} className="block w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] text-green-600">Low Priority</button>
            </div>
          )}
        </div>
        <button onClick={onDelete} className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700">
          <FiTrash2 size={14} className="inline mr-1" /> Delete
        </button>
        <button onClick={onClear} className="px-3 py-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm">Clear</button>
      </div>
    </div>
  );
}
