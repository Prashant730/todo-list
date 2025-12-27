import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { useDebounce } from '../hooks/useDebounce';

export default function SearchBar() {
  const { state, dispatch } = useTodo();
  const [searchInput, setSearchInput] = useState(state.filter.search);
  const debouncedSearch = useDebounce(searchInput, 300);

  // Update the filter when debounced search changes
  useEffect(() => {
    dispatch({ type: 'SET_FILTER', payload: { search: debouncedSearch } });
  }, [debouncedSearch, dispatch]);

  // Sync with external filter changes
  useEffect(() => {
    if (state.filter.search !== searchInput) {
      setSearchInput(state.filter.search);
    }
  }, [state.filter.search]);

  const handleClear = () => {
    setSearchInput('');
    dispatch({ type: 'SET_FILTER', payload: { search: '' } });
  };

  return (
    <div className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
      <input
        type="text"
        value={searchInput}
        onChange={e => setSearchInput(e.target.value)}
        placeholder="Search tasks..."
        className="input-field w-full pl-10 pr-10 py-3 rounded-xl text-sm"
        aria-label="Search tasks"
        role="searchbox"
      />
      {searchInput && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
          aria-label="Clear search"
        >
          <FiX size={18} />
        </button>
      )}
    </div>
  );
}
