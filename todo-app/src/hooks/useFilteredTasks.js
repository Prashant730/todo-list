import { useMemo } from 'react';
import { isToday, isThisWeek, isPast, parseISO } from 'date-fns';

export function useFilteredTasks(tasks, filter) {
  return useMemo(() => {
    return tasks.filter(task => {
      if (filter.status === 'completed' && !task.completed) return false;
      if (filter.status === 'active' && task.completed) return false;
      if (filter.status === 'overdue' && (!task.dueDate || !isPast(parseISO(task.dueDate)) || task.completed)) return false;
      if (filter.status === 'today' && (!task.dueDate || !isToday(parseISO(task.dueDate)))) return false;
      if (filter.status === 'week' && (!task.dueDate || !isThisWeek(parseISO(task.dueDate)))) return false;
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
      if (filter.category !== 'all' && task.category !== filter.category) return false;
      if (filter.search && !task.title.toLowerCase().includes(filter.search.toLowerCase()) && 
          !task.description?.toLowerCase().includes(filter.search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter]);
}

export function useTaskStats(tasks) {
  return useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const overdue = tasks.filter(t => t.dueDate && isPast(parseISO(t.dueDate)) && !t.completed).length;
    const today = tasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate))).length;
    const byPriority = { high: 0, medium: 0, low: 0 };
    const byCategory = {};
    tasks.forEach(t => {
      if (t.priority) byPriority[t.priority]++;
      if (t.category) byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });
    return { total, completed, active: total - completed, overdue, today, completionRate: total ? Math.round((completed / total) * 100) : 0, byPriority, byCategory };
  }, [tasks]);
}
