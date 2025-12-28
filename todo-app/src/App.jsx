import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
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
import PWAInstallBanner, { OfflineIndicator, OnlineIndicator } from './components/PWAInstallBanner';
import AuthModal from './components/AuthModal';
import { usePWA } from './hooks/usePWA';

function AppContent() {
  const { state, dispatch } = useTodo();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { requestNotificationPermission } = usePWA();

  const openModal = useCallback((taskOrPreset = null) => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (taskOrPreset && taskOrPreset.scheduleType) {
      setEditingTask({
        scheduleType: taskOrPreset.scheduleType,
        dueDate: taskOrPreset.dueDate || ''
      });
    } else {
      setEditingTask(taskOrPreset);
    }
    setModalOpen(true);
  }, [isAuthenticated]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingTask(null);
  }, []);

  const createTasksFromTemplate = useCallback((tasks) => {
    dispatch({ type: 'ADD_MULTIPLE_TASKS', payload: tasks });
  }, [dispatch]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openModal();
      }
      if (e.key === 't' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (isAuthenticated) setShowTemplates(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, openModal, isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Header
        onAddTask={openModal}
        onShowTemplates={() => isAuthenticated ? setShowTemplates(true) : setShowAuthModal(true)}
        onShowAuth={() => setShowAuthModal(true)}
      />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-73px)] overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {!isAuthenticated ? (
              // Welcome screen for non-authenticated users
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📚</span>
                </div>
                <h1 className="text-4xl font-bold mb-4">Student Study Planner</h1>
                <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                  Organize your assignments, track your progress, and boost your productivity with AI-powered insights.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-primary px-8 py-4 rounded-xl text-lg font-medium"
                >
                  Get Started - It's Free!
                </button>
                <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="p-6 bg-[var(--bg-secondary)] rounded-xl">
                    <div className="text-3xl mb-3">✅</div>
                    <h3 className="font-semibold mb-2">Task Management</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Create, organize, and track your tasks with ease</p>
                  </div>
                  <div className="p-6 bg-[var(--bg-secondary)] rounded-xl">
                    <div className="text-3xl mb-3">🤖</div>
                    <h3 className="font-semibold mb-2">AI Insights</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Get smart suggestions and productivity analysis</p>
                  </div>
                  <div className="p-6 bg-[var(--bg-secondary)] rounded-xl">
                    <div className="text-3xl mb-3">📊</div>
                    <h3 className="font-semibold mb-2">Analytics</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Track your progress with detailed statistics</p>
                  </div>
                </div>
              </div>
            ) : (
              // Main app content for authenticated users
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    {state.filter.status === 'all' && 'All Tasks'}
                    {state.filter.status === 'today' && "📅 Today's Tasks"}
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
              </>
            )}
          </div>
        </main>
      </div>

      {modalOpen && (
        <TaskModal task={editingTask} onClose={closeModal} />
      )}
      {showTemplates && (
        <TaskTemplates
          onClose={() => setShowTemplates(false)}
          onCreateTasks={createTasksFromTemplate}
        />
      )}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      <AIAssistant />
      <PWAInstallBanner />
      <OfflineIndicator />
      <OnlineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TodoProvider>
          <AppContent />
        </TodoProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
