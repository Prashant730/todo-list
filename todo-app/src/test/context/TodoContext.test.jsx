import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TodoProvider, useTodo } from '../../context/TodoContext';

// Test component to access context
function TestComponent() {
  const { state, dispatch } = useTodo();

  return (
    <div>
      <div data-testid="task-count">{state.tasks.length}</div>
      <div data-testid="theme">{state.theme}</div>
      <button
        data-testid="add-task"
        onClick={() => dispatch({
          type: 'ADD_TASK',
          payload: { title: 'Test Task', priority: 'medium' }
        })}
      >
        Add Task
      </button>
      <button
        data-testid="toggle-theme"
        onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
      >
        Toggle Theme
      </button>
      {state.tasks.map((task, index) => (
        <div key={task.id || index} data-testid={`task-${index}`}>
          {task.title} - {task.priority}
        </div>
      ))}
    </div>
  );
}

describe('TodoContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide initial state', () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should add a task', async () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const addButton = screen.getByTestId('add-task');

    await act(async () => {
      addButton.click();
    });

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');
    expect(screen.getByTestId('task-0')).toHaveTextContent('Test Task - medium');
  });

  it('should toggle theme', async () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const toggleButton = screen.getByTestId('toggle-theme');

    await act(async () => {
      toggleButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');

    await act(async () => {
      toggleButton.click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('should handle multiple tasks', async () => {
    render(
      <TodoProvider>
        <TestComponent />
      </TodoProvider>
    );

    const addButton = screen.getByTestId('add-task');

    // Add multiple tasks
    await act(async () => {
      addButton.click();
      addButton.click();
      addButton.click();
    });

    expect(screen.getByTestId('task-count')).toHaveTextContent('3');
    expect(screen.getByTestId('task-0')).toBeInTheDocument();
    expect(screen.getByTestId('task-1')).toBeInTheDocument();
    expect(screen.getByTestId('task-2')).toBeInTheDocument();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTodo must be used within a TodoProvider');

    console.error = originalError;
  });
});

// Test component for specific actions
function ActionTestComponent() {
  const { state, dispatch } = useTodo();

  const addTask = () => {
    dispatch({
      type: 'ADD_TASK',
      payload: {
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        category: 'Work',
        tags: ['test']
      }
    });
  };

  const updateTask = () => {
    if (state.tasks.length > 0) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          ...state.tasks[0],
          title: 'Updated Task'
        }
      });
    }
  };

  const deleteTask = () => {
    if (state.tasks.length > 0) {
      dispatch({
        type: 'DELETE_TASK',
        payload: state.tasks[0].id
      });
    }
  };

  const toggleComplete = () => {
    if (state.tasks.length > 0) {
      dispatch({
        type: 'TOGGLE_COMPLETE',
        payload: state.tasks[0].id
      });
    }
  };

  return (
    <div>
      <div data-testid="task-count">{state.tasks.length}</div>
      <button data-testid="add-task" onClick={addTask}>Add</button>
      <button data-testid="update-task" onClick={updateTask}>Update</button>
      <button data-testid="delete-task" onClick={deleteTask}>Delete</button>
      <button data-testid="toggle-complete" onClick={toggleComplete}>Toggle</button>
      {state.tasks.map((task, index) => (
        <div key={task.id || index} data-testid={`task-${index}`}>
          <span data-testid={`task-title-${index}`}>{task.title}</span>
          <span data-testid={`task-completed-${index}`}>{task.completed ? 'completed' : 'active'}</span>
        </div>
      ))}
    </div>
  );
}

describe('TodoContext Actions', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should update a task', async () => {
    render(
      <TodoProvider>
        <ActionTestComponent />
      </TodoProvider>
    );

    // Add a task first
    await act(async () => {
      screen.getByTestId('add-task').click();
    });

    expect(screen.getByTestId('task-title-0')).toHaveTextContent('Test Task');

    // Update the task
    await act(async () => {
      screen.getByTestId('update-task').click();
    });

    expect(screen.getByTestId('task-title-0')).toHaveTextContent('Updated Task');
  });

  it('should delete a task', async () => {
    render(
      <TodoProvider>
        <ActionTestComponent />
      </TodoProvider>
    );

    // Add a task first
    await act(async () => {
      screen.getByTestId('add-task').click();
    });

    expect(screen.getByTestId('task-count')).toHaveTextContent('1');

    // Delete the task
    await act(async () => {
      screen.getByTestId('delete-task').click();
    });

    expect(screen.getByTestId('task-count')).toHaveTextContent('0');
  });

  it('should toggle task completion', async () => {
    render(
      <TodoProvider>
        <ActionTestComponent />
      </TodoProvider>
    );

    // Add a task first
    await act(async () => {
      screen.getByTestId('add-task').click();
    });

    expect(screen.getByTestId('task-completed-0')).toHaveTextContent('active');

    // Toggle completion
    await act(async () => {
      screen.getByTestId('toggle-complete').click();
    });

    expect(screen.getByTestId('task-completed-0')).toHaveTextContent('completed');

    // Toggle back
    await act(async () => {
      screen.getByTestId('toggle-complete').click();
    });

    expect(screen.getByTestId('task-completed-0')).toHaveTextContent('active');
  });
});