import { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { format, parseISO, isPast, isToday, isTomorrow, differenceInMinutes } from 'date-fns';

export default function NotificationSystem() {
  const { state } = useTodo();
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setShowPanel(false);
      }
    };

    if (showPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanel]);

  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const newNotifications = [];

      state.tasks.forEach(task => {
        if (task.completed || !task.dueDate) return;

        try {
          const dueDate = parseISO(task.dueDate);
          const minutesUntilDue = differenceInMinutes(dueDate, now);

          // Overdue notifications
          if (isPast(dueDate)) {
            newNotifications.push({
              id: `overdue-${task.id}`,
              type: 'overdue',
              title: 'Task Overdue',
              message: `"${task.title}" was due ${format(dueDate, 'MMM d, h:mm a')}`,
              task,
              priority: 'high'
            });
          }
          // Due today notifications
          else if (isToday(dueDate)) {
            newNotifications.push({
              id: `today-${task.id}`,
              type: 'due-today',
              title: 'Due Today',
              message: `"${task.title}" is due at ${format(dueDate, 'h:mm a')}`,
              task,
              priority: 'medium'
            });
          }
          // Due tomorrow notifications
          else if (isTomorrow(dueDate)) {
            newNotifications.push({
              id: `tomorrow-${task.id}`,
              type: 'due-tomorrow',
              title: 'Due Tomorrow',
              message: `"${task.title}" is due tomorrow at ${format(dueDate, 'h:mm a')}`,
              task,
              priority: 'low'
            });
          }
          // 30-minute warning
          else if (minutesUntilDue <= 30 && minutesUntilDue > 0) {
            newNotifications.push({
              id: `warning-${task.id}`,
              type: 'warning',
              title: 'Task Due Soon',
              message: `"${task.title}" is due in ${minutesUntilDue} minutes`,
              task,
              priority: 'high'
            });
          }
        } catch (error) {
          console.warn('Invalid date format for task:', task.title, task.dueDate);
        }
      });

      setNotifications(newNotifications);
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.tasks]);

  const getIcon = (type) => {
    switch (type) {
      case 'overdue': return <FiAlertTriangle className="text-red-500" />;
      case 'warning': return <FiClock className="text-orange-500" />;
      case 'due-today': return <FiBell className="text-blue-500" />;
      case 'due-tomorrow': return <FiCheckCircle className="text-green-500" />;
      default: return <FiBell />;
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="relative">
      <button onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition">
        <FiBell size={20} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </button>

      {showPanel && (
        <div ref={panelRef} className="absolute top-12 right-0 w-80 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden animate-slide-in">
          <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-[var(--bg-secondary)] rounded transition">
              <FiX size={18} />
            </button>
          </div>
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[var(--text-secondary)]">
                <FiBell size={32} className="mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div key={notification.id} className="p-3 border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition">
                  <div className="flex items-start gap-3">
                    <span className="mt-1">{getIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium">{notification.title}</h4>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{notification.message}</p>
                    </div>
                    <button onClick={() => dismissNotification(notification.id)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 hover:bg-[var(--bg-tertiary)] rounded transition">
                      <FiX size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}