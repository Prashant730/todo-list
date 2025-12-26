import { FiSun, FiMoon, FiPlus, FiRotateCcw, FiRotateCw, FiBookmark } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import NotificationSystem from './NotificationSystem';
import QuickActions from './QuickActions';

export default function Header({ onAddTask, onShowTemplates }) {
  const { state, dispatch } = useTodo();

  return (
    <header className="sticky top-0 z-10 px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
          TaskFlow
        </h1>
        <div className="flex items-center gap-3">
          <QuickActions onAddTask={onAddTask} />
          <button onClick={onShowTemplates} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition" title="Task Templates">
            <FiBookmark size={20} />
          </button>
          <NotificationSystem />
          <button onClick={() => dispatch({ type: 'UNDO' })} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition" title="Undo (Ctrl+Z)">
            <FiRotateCcw size={20} />
          </button>
          <button onClick={() => dispatch({ type: 'REDO' })} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition" title="Redo (Ctrl+Y)">
            <FiRotateCw size={20} />
          </button>
          <button onClick={() => dispatch({ type: 'TOGGLE_THEME' })} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition">
            {state.theme === 'light' ? <FiMoon size={20} /> : <FiSun size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
