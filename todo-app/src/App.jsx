import { useState, useEffect, useCallback } from 'react';
import { TodoProvider, useTodo } from './context/TodoContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import TaskModal from './components/TaskModal';
import CalendarView from './components/CalendarView';
import AIAnalyticsDashboard from './components/AIAnalyticsDashboard';
import ExportImport from './components/ExportImport';
import AIAssistant from './components/AIAssistant';
import AIInsights from './components/AIInsights';
import TaskTemplates from './components/TaskTemplates';
import ErrorBoundary from './components/ErrorBoundary';
import TestRunner from './components/TestRunner';
import PWAInstallBanner, { OfflineIndicator, OnlineIndicator } from './components/PWAInstallBanner';
import { usePWA } from './hooks/usePWA';

function AppContent() {
  const { state, dispatch } = useTodo();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const { requestNotificationPermission } = usePWA();

  const openModal = useCallback((taskOrPreset = null) => {
    // If it's a preset with scheduleType, create a new task template
    if (taskOrPreset && taskOrPreset.scheduleType) {
      setEditingTask({
        scheduleType: taskOrPreset.scheduleType,
        dueDate: taskOrPreset.dueDate || ''
      });
    } else {
      setEditingTask(taskOrPreset);
    }
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingTask(null);
  }, []);

  const createTasksFromTemplate = useCallback((tasks) => {
    dispatch({ type: 'ADD_MULTIPLE_TASKS', payload: tasks });
  }, [dispatch]);

  // Request notification permission on first load
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openModal();
      }
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowTemplates(true);
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, openModal]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const { history, historyIndex, ...toSave } = state;
      localStorage.setItem('advanced-todo-app', JSON.stringify(toSave));
    }, 30000);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header
        onAddTask={openModal}
        onShowTemplates={() => setShowTemplates(true)}
      />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-73px)] overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {state.filter.status === 'all' && 'All Tasks'}
                {state.filter.status === 'today' && '📅 Today\'s Tasks'}
                {state.filter.status === 'week' && '📆 This Week'}
                {state.filter.status === 'overdue' && '⚠️ Overdue'}
                {state.filter.status === 'completed' && '✅ Completed'}
                {state.filter.status === 'active' && '🔄 Active'}
                {state.filter.category !== 'all' && (
                  <span className="text-lg font-normal text-[var(--text-secondary)]"> • {state.filter.category}</span>
                )}
              </h2>
              <ExportImport />
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <SearchBar />
                </div>
                <div className="sm:w-auto">
                  <FilterBar />
                </div>
              </div>

              <div className="bg-[var(--bg-secondary)] rounded-xl p-6 min-h-[400px]">
                {state.viewMode === 'calendar' ? (
                  <CalendarView onEditTask={openModal} />
                ) : (
                  <TaskList onEditTask={openModal} />
                )}
              </div>

              <AIInsights />

              <AIAnalyticsDashboard />
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={closeModal}
        />
      )}
      {showTemplates && (
        <TaskTemplates
          onClose={() => setShowTemplates(false)}
          onCreateTasks={createTasksFromTemplate}
        />
      )}

      <AIAssistant />

      <TestRunner />

      {/* PWA Components */}
      <PWAInstallBanner />
      <OfflineIndicator />
      <OnlineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TodoProvider>
        <AppContent />
      </TodoProvider>
    </ErrorBoundary>
  );
}
