import { FiSearch, FiX } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';

export default function SearchBar() {
  const { state, dispatch } = useTodo();

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
      <input
        type="text"
        value={state.filter.search}
        onChange={e => dispatch({ type: 'SET_FILTER', payload: { search: e.target.value } })}
        placeholder="Search tasks..."
        className="input-field w-full pl-10 pr-10 py-3 rounded-xl text-sm"
      />
      {state.filter.search && (
        <button onClick={() => dispatch({ type: 'SET_FILTER', payload: { search: '' } })}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
          <FiX size={18} />
        </button>
      )}
    </div>
  );
}
