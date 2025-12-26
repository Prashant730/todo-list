import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';

export default function CalendarView({ onEditTask }) {
  const { state } = useTodo();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = {};
    state.tasks.forEach(task => {
      if (task.dueDate) {
        try {
          const dateKey = format(parseISO(task.dueDate), 'yyyy-MM-dd');
          if (!map[dateKey]) map[dateKey] = [];
          map[dateKey].push(task);
        } catch (error) {
          console.warn('Invalid date format for task:', task.title, task.dueDate);
        }
      }
    });
    return map;
  }, [state.tasks]);

  const startDay = days[0].getDay();

  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
          <FiChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)]">
          <FiChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-[var(--text-secondary)] py-2">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate[dateKey] || [];
          const isToday = isSameDay(day, new Date());
          return (
            <div key={dateKey} className={`min-h-[80px] p-1 rounded-lg border border-[var(--border-color)] ${isToday ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--bg-primary)]'}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-[var(--accent)]' : ''}`}>{format(day, 'd')}</div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button key={task.id} onClick={() => onEditTask(task)}
                    className={`w-full text-left text-xs px-1 py-0.5 rounded truncate ${task.completed ? 'line-through opacity-50' : ''} ${task.priority === 'high' ? 'bg-red-500/20 text-red-500' : task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-green-500/20 text-green-600'}`}>
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && <div className="text-xs text-[var(--text-secondary)]">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
