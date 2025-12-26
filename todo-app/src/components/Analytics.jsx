import { useMemo } from 'react';
import { useTodo } from '../context/TodoContext';
import { useTaskStats } from '../hooks/useFilteredTasks';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';

export default function Analytics() {
  const { state } = useTodo();
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

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-4">
      <h3 className="font-semibold mb-4">Weekly Activity</h3>
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
