import { memo } from 'react';
import { List } from 'react-window';
import TaskCard from './TaskCard';

const TaskItem = memo(({ index, style, data }) => {
  const { tasks, onEdit, onToggle, onDelete } = data;
  const task = tasks[index];

  return (
    <div style={style}>
      <div className="px-2 py-1">
        <TaskCard
          task={task}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';

export default function VirtualTaskList({
  tasks,
  onEdit,
  onToggle,
  onDelete,
  height = 600,
  itemHeight = 120
}) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-secondary)]">No tasks found</p>
      </div>
    );
  }

  // Use virtual scrolling only for large lists (50+ items)
  if (tasks.length < 50) {
    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={tasks.length}
      itemSize={itemHeight}
      itemData={{ tasks, onEdit, onToggle, onDelete }}
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
    >
      {TaskItem}
    </List>
  );
}