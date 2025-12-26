import { useRef } from 'react';
import { FiDownload, FiUpload } from 'react-icons/fi';
import { useTodo } from '../context/TodoContext';
import { format } from 'date-fns';

export default function ExportImport() {
  const { state, dispatch } = useTodo();
  const fileInputRef = useRef(null);

  const exportCSV = () => {
    try {
      const headers = ['Title', 'Description', 'Priority', 'Category', 'Due Date', 'Status', 'Tags'];
      const rows = state.tasks.map(t => [
        t.title, t.description || '', t.priority || '', t.category || '',
        t.dueDate || '', t.completed ? 'Completed' : 'Active', (t.tags || []).join(';')
      ]);
      const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export CSV Error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const exportJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(state.tasks, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export JSON Error:', error);
      alert('Failed to export JSON. Please try again.');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const tasks = JSON.parse(event.target.result);
        if (Array.isArray(tasks)) {
          tasks.forEach(task => {
            if (task.title) { // Basic validation
              dispatch({ type: 'ADD_TASK', payload: task });
            }
          });
          alert(`Successfully imported ${tasks.length} tasks`);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (err) {
        console.error('Import Error:', err);
        alert('Invalid JSON file. Please check the format and try again.');
      }
    };
    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition">
        <FiDownload size={14} /> CSV
      </button>
      <button onClick={exportJSON} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition">
        <FiDownload size={14} /> JSON
      </button>
      <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition">
        <FiUpload size={14} /> Import
      </button>
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
    </div>
  );
}
