import { createContext, useContext, useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const TodoContext = createContext();

const STORAGE_KEY = 'advanced-todo-app';

const initialState = {
  tasks: [],
  categories: ['📚 Assignments', '📖 Study', '🧪 Exams', '📝 Projects', '🎯 Personal', '💼 Career', '🏃 Health', '🛒 Shopping'],
  filter: { status: 'all', priority: 'all', category: 'all', search: '' },
  viewMode: 'list',
  theme: 'light',
  history: [],
  historyIndex: -1,
};

function todoReducer(state, action) {
  let newState;
  switch (action.type) {
    case 'LOAD_STATE':
      // Migrate old single category to categories array for backward compatibility
      const migratedPayload = {
        ...action.payload,
        tasks: action.payload.tasks?.map(task => ({
          ...task,
          categories: task.categories || (task.category ? [task.category] : [])
        })) || []
      };
      return { ...state, ...migratedPayload };
    case 'ADD_TASK':
      newState = { ...state, tasks: [...state.tasks, { ...action.payload, id: uuidv4(), createdAt: new Date().toISOString(), completedAt: null }] };
      break;
    case 'ADD_MULTIPLE_TASKS':
      const newTasks = action.payload.map(task => ({ ...task, id: uuidv4(), createdAt: new Date().toISOString(), completedAt: null }));
      newState = { ...state, tasks: [...state.tasks, ...newTasks] };
      break;
    case 'UPDATE_TASK':
      newState = { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
      break;
    case 'DELETE_TASK':
      newState = { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
      break;
    case 'TOGGLE_COMPLETE':
      const task = state.tasks.find(t => t.id === action.payload);
      const updatedTask = {
        ...task,
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      };

      newState = {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload ? updatedTask : t)
      };
      break;
    case 'REORDER_TASKS':
      newState = { ...state, tasks: action.payload };
      break;
    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...new Set([...state.categories, action.payload])] };
    case 'BULK_UPDATE':
      newState = { ...state, tasks: state.tasks.map(t => action.payload.ids.includes(t.id) ? { ...t, ...action.payload.updates } : t) };
      break;
    case 'UNDO':
      if (state.historyIndex > 0) {
        return { ...state, tasks: state.history[state.historyIndex - 1], historyIndex: state.historyIndex - 1 };
      }
      return state;
    case 'RESET_PRODUCTIVITY':
      // Reset productivity-related data while keeping active tasks
      const resetTasks = state.tasks.map(task => ({
        ...task,
        completed: false,
        completedAt: null,
        // Keep the task but reset completion status
      }));

      // Clear analytics cache
      localStorage.removeItem('ai-analytics-cache');

      newState = {
        ...state,
        tasks: resetTasks
      };
      break;
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        return { ...state, tasks: state.history[state.historyIndex + 1], historyIndex: state.historyIndex + 1 };
      }
      return state;
    default:
      return state;
  }
  // Save to history for undo/redo
  const newHistory = [...state.history.slice(0, state.historyIndex + 1), newState.tasks];
  return { ...newState, history: newHistory.slice(-50), historyIndex: newHistory.length - 1 };
}

export function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate the loaded data
        if (parsed && typeof parsed === 'object') {
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      } catch (e) {
        console.error('Failed to load state:', e);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    try {
      const { history, historyIndex, ...toSave } = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  return <TodoContext.Provider value={{ state, dispatch }}>{children}</TodoContext.Provider>;
}

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};
