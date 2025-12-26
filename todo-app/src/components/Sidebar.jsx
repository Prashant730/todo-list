import { FiList, FiGrid, FiCalendar, FiInbox, FiCheckCircle, FiClock, FiAlertCircle, FiStar } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { useTaskStats } from '../hooks/useFilteredTasks';

const views = [
  { id: 'all', label: 'All Tasks', icon: FiInbox },
  { id: 'today', label: 'Today', icon: FiStar },
  { id: 'week', label: 'This Week', icon: FiCalendar },
  { id: 'overdue', label: 'Overdue', icon: FiAlertCircle },
  { id: 'completed', label: 'Completed', icon: FiCheckCircle },
  { id: 'active', label: 'Active', icon: FiClock },
];

const viewModes = [
  { id: 'list', icon: FiList },
  { id: 'grid', icon: FiGrid },
  { id: 'calendar', icon: FiCalendar },
];

export default function Sidebar() {
  const { state, dispatch } = useTodo();
  const stats = useTaskStats(state.tasks);

  const getCount = (id) => {
    switch (id) {
      case 'all': return stats.total;
      case 'today': return stats.today;
      case 'overdue': return stats.overdue;
      case 'completed': return stats.completed;
      case 'active': return stats.active;
      default: return null;
    }
  };

  return (
    <aside className="w-64 h-[calc(100vh-73px)] border-r border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-y-auto hidden md:block">
      <div className="p-4 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider">View Mode</h3>
          <div className="flex gap-1 bg-[var(--bg-tertiary)] p-1 rounded-lg">
            {viewModes.map(({ id, icon: Icon }) => (
              <button key={id} onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: id })}
                className={`flex-1 p-2 rounded-md transition ${state.viewMode === id ? 'bg-[var(--bg-primary)] shadow' : 'hover:bg-[var(--bg-primary)]/50'}`}>
                <Icon size={18} className="mx-auto" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider">Quick Filters</h3>
          <nav className="space-y-1">
            {views.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => dispatch({ type: 'SET_FILTER', payload: { status: id } })}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-sm ${state.filter.status === id ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-tertiary)]'}`}>
                <span className="flex items-center gap-3"><Icon size={16} /> {label}</span>
                {getCount(id) !== null && <span className="text-xs opacity-75 bg-black/10 px-2 py-0.5 rounded-full">{getCount(id)}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider">Categories</h3>
          <nav className="space-y-1">
            <button onClick={() => dispatch({ type: 'SET_FILTER', payload: { category: 'all' } })}
              className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm ${state.filter.category === 'all' ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-tertiary)]'}`}>
              All Categories
            </button>
            {state.categories.map(cat => (
              <button key={cat} onClick={() => dispatch({ type: 'SET_FILTER', payload: { category: cat } })}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition text-sm ${state.filter.category === cat ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-tertiary)]'}`}>
                {cat}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 bg-gradient-to-br from-[var(--accent)]/10 to-purple-500/10 rounded-xl border border-[var(--accent)]/20">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-3 tracking-wider">Progress</h3>
          <div className="text-3xl font-bold mb-2">{stats.completionRate}%</div>
          <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full mb-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 transition-all duration-500" style={{ width: `${stats.completionRate}%` }} />
          </div>
          <p className="text-xs text-[var(--text-secondary)]">{stats.completed} of {stats.total} tasks completed</p>
        </div>
      </div>
    </aside>
  );
}
