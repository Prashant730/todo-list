import { useMemo } from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { useTaskStats } from '../hooks/useFilteredTasks';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';

export default function Analytics() {
  const { state, dispatch } = useTodo();
  const stats = useTaskStats(state.tasks);

  const weeklyData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      const completed = state.tasks.filter(t => t.completedAt && isWithinInterval(parseISO(t.completedAt), { start: dayStart, end: dayEnd })).length;
      data.push({ day: format(date, 'EEE'), completed });
    }
    return data;
  }, [state.tasks]);

  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1);

  const resetProductivityData = () => {
    if (confirm('Reset all productivity data? This will mark all completed tasks as incomplete and clear your analytics history. This cannot be undone.')) {
      dispatch({ type: 'RESET_PRODUCTIVITY' });
    }
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Weekly Activity</h3>
        <button onClick={resetProductivityData}
          className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs bg-red-500/10 text-red-500 hover:bg-red-500/20 transition border border-red-500/20">
          <FiRotateCcw size={14} />
          Reset Data
        </button>
      </div>
      <div className="flex items-end justify-between h-32 gap-2">
        {weeklyData.map(({ day, completed }) => (
          <div key={day} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-[var(--bg-tertiary)] rounded-t relative" style={{ height: `${(completed / maxCompleted) * 100}%`, minHeight: '4px' }}>
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">{completed}</div>
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-2">{day}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-[var(--text-secondary)]">Total Tasks</div>
        </div>
        <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          <div className="text-xs text-[var(--text-secondary)]">Completed</div>
        </div>
        <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-2xl font-bold text-yellow-500">{stats.active}</div>
          <div className="text-xs text-[var(--text-secondary)]">Active</div>
        </div>
        <div className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
          <div className="text-xs text-[var(--text-secondary)]">Overdue</div>
        </div>
      </div>
    </div>
  );
}
