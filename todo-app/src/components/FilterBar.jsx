import { useTodo } from '../context/TodoContext';

// Helper to get category name from string or object
const getCategoryName = (cat) => typeof cat === 'string' ? cat : cat?.name || '';
const getCategoryId = (cat) => typeof cat === 'string' ? cat : cat?._id || cat?.name || '';

export default function FilterBar() {
  const { state, dispatch } = useTodo();

  return (
    <div className="flex flex-wrap gap-3">
      <select value={state.filter.status} onChange={e => dispatch({ type: 'SET_FILTER', payload: { status: e.target.value } })}
        className="input-field px-4 py-3 rounded-xl text-sm min-w-[140px] md:hidden">
        <option value="all">All Tasks</option>
        <option value="today">📅 Today</option>
        <option value="week">📆 This Week</option>
        <option value="overdue">⚠️ Overdue</option>
        <option value="active">🔄 Active</option>
        <option value="completed">✅ Completed</option>
      </select>
      <select value={state.filter.priority} onChange={e => dispatch({ type: 'SET_FILTER', payload: { priority: e.target.value } })}
        className="input-field px-4 py-3 rounded-xl text-sm min-w-[140px]">
        <option value="all">All Priorities</option>
        <option value="high">High Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="low">Low Priority</option>
      </select>
      <select value={state.filter.category} onChange={e => dispatch({ type: 'SET_FILTER', payload: { category: e.target.value } })}
        className="input-field px-4 py-3 rounded-xl text-sm min-w-[140px] md:hidden">
        <option value="all">All Categories</option>
        {state.categories.map(cat => {
          const name = getCategoryName(cat);
          const id = getCategoryId(cat);
          return <option key={id} value={name}>{name}</option>;
        })}
      </select>
    </div>
  );
}
