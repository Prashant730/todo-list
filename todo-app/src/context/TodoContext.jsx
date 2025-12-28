import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TodoContext = createContext(null);

const initialState = {
  tasks: [],
  categories: [],
  filter: { status: 'all', priority: 'all', category: 'all', search: '' },
  viewMode: 'list',
  theme: 'light',
  loading: false,
  error: null,
  synced: false
};

function todoReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'LOAD_TASKS':
      return { ...state, tasks: action.payload, loading: false, synced: true };

    case 'LOAD_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'ADD_MULTIPLE_TASKS':
      return { ...state, tasks: [...state.tasks, ...action.payload] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t._id === action.payload._id ? action.payload : t)
      };

    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t._id !== action.payload) };

    case 'TOGGLE_COMPLETE':
      return {
        ...state,
        tasks: state.tasks.map(t => t._id === action.payload._id ? action.payload : t)
      };

    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };

    case 'SET_FILTER':
      return { ...state, filter: { ...state.filter, ...action.payload } };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter(c => c._id !== action.payload) };

    case 'CLEAR_COMPLETED':
      return { ...state, tasks: state.tasks.filter(t => !t.completed) };

    case 'RESET_STATE':
      return { ...initialState, theme: state.theme };

    case 'RESET_PRODUCTIVITY':
      return {
        ...state,
        tasks: state.tasks.map(task => ({
          ...task,
          completed: false,
          completedAt: null
        }))
      };

    default:
      return state;
  }
}

export function TodoProvider({ children }) {
  const [state, dispatch] = useReducer(todoReducer, initialState);
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const user = auth?.user ?? null;

  // Load tasks from API when authenticated
  const loadTasks = useCallback(async () => {
    if (!isAuthenticated) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await api.getTasks();
      dispatch({ type: 'LOAD_TASKS', payload: response.data });
    } catch (error) {
      console.error('Failed to load tasks:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [isAuthenticated]);

  // Load categories from API
  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await api.getCategories();
      dispatch({ type: 'LOAD_CATEGORIES', payload: response.data });
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, [isAuthenticated]);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      loadCategories();
    } else {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [isAuthenticated, loadTasks, loadCategories]);

  // Load theme from user profile or localStorage
  useEffect(() => {
    if (user?.theme) {
      dispatch({ type: 'SET_THEME', payload: user.theme });
    } else {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        dispatch({ type: 'SET_THEME', payload: savedTheme });
      }
    }
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
    localStorage.setItem('theme', state.theme);
  }, [state.theme]);

  // Enhanced dispatch with API calls
  const enhancedDispatch = useCallback(async (action) => {
    // If not authenticated, just update local state for theme
    if (!isAuthenticated && action.type !== 'TOGGLE_THEME' && action.type !== 'SET_FILTER') {
      return;
    }

    try {
      switch (action.type) {
        case 'ADD_TASK': {
          const response = await api.createTask(action.payload);
          dispatch({ type: 'ADD_TASK', payload: response.data });
          break;
        }

        case 'ADD_MULTIPLE_TASKS': {
          const response = await api.createBulkTasks(action.payload);
          dispatch({ type: 'ADD_MULTIPLE_TASKS', payload: response.data });
          break;
        }

        case 'UPDATE_TASK': {
          const { _id, id, ...updates } = action.payload;
          const taskId = _id || id;
          const response = await api.updateTask(taskId, updates);
          dispatch({ type: 'UPDATE_TASK', payload: response.data });
          break;
        }

        case 'DELETE_TASK': {
          await api.deleteTask(action.payload);
          dispatch({ type: 'DELETE_TASK', payload: action.payload });
          break;
        }

        case 'TOGGLE_TASK':
        case 'TOGGLE_COMPLETE': {
          const taskId = action.payload._id || action.payload;
          const response = await api.toggleTask(taskId);
          dispatch({ type: 'TOGGLE_COMPLETE', payload: response.data });
          break;
        }

        case 'REORDER_TASKS': {
          const tasksWithOrder = action.payload.map((task, index) => ({
            id: task._id,
            sortOrder: index
          }));
          await api.reorderTasks(tasksWithOrder);
          dispatch({ type: 'REORDER_TASKS', payload: action.payload });
          break;
        }

        case 'ADD_CATEGORY': {
          const response = await api.createCategory({ name: action.payload });
          dispatch({ type: 'ADD_CATEGORY', payload: response.data });
          break;
        }

        case 'DELETE_CATEGORY': {
          await api.deleteCategory(action.payload);
          dispatch({ type: 'DELETE_CATEGORY', payload: action.payload });
          break;
        }

        case 'CLEAR_COMPLETED': {
          await api.clearCompleted();
          dispatch({ type: 'CLEAR_COMPLETED' });
          break;
        }

        case 'RESET_PRODUCTIVITY': {
          await api.resetProductivity();
          dispatch({ type: 'RESET_PRODUCTIVITY' });
          await loadTasks(); // Reload tasks after reset
          break;
        }

        case 'TOGGLE_THEME': {
          dispatch({ type: 'TOGGLE_THEME' });
          if (isAuthenticated) {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            api.updateProfile({ theme: newTheme }).catch(console.error);
          }
          break;
        }

        case 'SET_VIEW_MODE': {
          dispatch({ type: 'SET_VIEW_MODE', payload: action.payload });
          if (isAuthenticated) {
            api.updateProfile({ viewMode: action.payload }).catch(console.error);
          }
          break;
        }

        case 'SET_FILTER':
          dispatch(action);
          break;

        default:
          dispatch(action);
      }
    } catch (error) {
      console.error(`Action ${action.type} failed:`, error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    }
  }, [isAuthenticated, state.theme, loadTasks]);

  return (
    <TodoContext.Provider value={{ state, dispatch: enhancedDispatch, loadTasks, loadCategories }}>
      {children}
    </TodoContext.Provider>
  );
}

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};
