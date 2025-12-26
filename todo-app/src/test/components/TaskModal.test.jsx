import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskModal from '../../components/TaskModal';
import { TodoProvider } from '../../context/TodoContext';

const mockOnClose = vi.fn();

const renderTaskModal = (task = null) => {
  return render(
    <TodoProvider>
      <TaskModal task={task} onClose={mockOnClose} />
    </TodoProvider>
  );
};

describe('TaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty form for new task', () => {
    renderTaskModal();

    expect(screen.getByPlaceholderText('What needs to be done?')).toHaveValue('');
    expect(screen.getByPlaceholderText('Add details...')).toHaveValue('');
    expect(screen.getByRole('combobox', { name: /priority/i })).toHaveValue('medium'); // Default priority
  });

  it('should render form with task data for editing', () => {
    const task = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      priority: 'high',
      category: '📚 Assignments',
      dueDate: '2024-12-31T12:00',
      tags: ['test', 'urgent']
    };

    renderTaskModal(task);

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /priority/i })).toHaveValue('high');
    expect(screen.getByRole('combobox', { name: /category/i })).toHaveValue('📚 Assignments');
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('should show validation error for empty title', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const saveButton = screen.getByRole('button', { name: /create task/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('should show validation error for title too long', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const titleInput = screen.getByPlaceholderText('What needs to be done?');

    // Use fireEvent for faster input of large text
    const longTitle = 'a'.repeat(201);
    fireEvent.change(titleInput, { target: { value: longTitle } });

    const saveButton = screen.getByRole('button', { name: /create task/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument();
    });
  }, 5000);

  it('should show validation error for description too long', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    const descriptionInput = screen.getByPlaceholderText('Add details...');

    await user.type(titleInput, 'Valid Title');

    // Create a description that's over 1000 characters
    const longDescription = 'This description is way too long. ' + 'x'.repeat(1000);

    // Use fireEvent.change to set the value directly
    fireEvent.change(descriptionInput, { target: { value: longDescription } });

    // Trigger form submission
    const saveButton = screen.getByRole('button', { name: /create task/i });
    await user.click(saveButton);

    // Wait for validation error to appear
    await waitFor(() => {
      expect(screen.getByText('Description must be less than 1000 characters')).toBeInTheDocument();
    });
  });

  it('should add and remove tags', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const tagInput = screen.getByPlaceholderText('Add tag...');
    const addTagButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg') && btn.closest('[class*="flex gap-2"]')
    );

    // Add a tag
    await user.type(tagInput, 'newtag');
    await user.click(addTagButton);

    expect(screen.getByText('newtag')).toBeInTheDocument();

    // Remove the tag
    const removeTagButton = screen.getByText('newtag').parentElement.querySelector('button');
    await user.click(removeTagButton);

    expect(screen.queryByText('newtag')).not.toBeInTheDocument();
  });

  it('should add and remove subtasks', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const subtaskInput = screen.getByPlaceholderText('Add subtask...');
    const addSubtaskButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg') && btn.closest('[class*="flex gap-2"]') &&
      btn.closest('div').querySelector('input[placeholder="Add subtask..."]')
    );

    // Add a subtask
    await user.type(subtaskInput, 'New subtask');
    await user.click(addSubtaskButton);

    expect(screen.getByText('New subtask')).toBeInTheDocument();

    // Remove the subtask
    const removeSubtaskButton = screen.getByText('New subtask').parentElement.querySelector('button');
    await user.click(removeSubtaskButton);

    expect(screen.queryByText('New subtask')).not.toBeInTheDocument();
  });

  it('should close modal when cancel is clicked', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal when X is clicked', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('svg') && btn.closest('[class*="p-1 rounded"]')
    );
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should save valid task', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    const saveButton = screen.getByRole('button', { name: /create task/i });

    await user.type(titleInput, 'Valid Task Title');
    await user.click(saveButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should suggest AI breakdown for complex weekly tasks', () => {
    renderTaskModal();

    const titleInput = screen.getByPlaceholderText('What needs to be done?');
    const descriptionInput = screen.getByPlaceholderText('Add details...');
    const dueDateInput = screen.getByLabelText('Due Date');

    // Create a complex task with future due date
    fireEvent.change(titleInput, { target: { value: 'This is a very long and complex task title' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a very detailed description that is quite long and complex' } });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    fireEvent.change(dueDateInput, { target: { value: futureDate.toISOString().slice(0, 16) } });

    // Should show AI suggestion
    expect(screen.getByText('AI Suggestion')).toBeInTheDocument();
    expect(screen.getByText('✨ Get AI Breakdown')).toBeInTheDocument();
  });

  it('should handle form submission with Enter key', async () => {
    const user = userEvent.setup();
    renderTaskModal();

    const titleInput = screen.getByPlaceholderText('What needs to be done?');

    await user.type(titleInput, 'Test Task');
    await user.keyboard('{Enter}');

    expect(mockOnClose).toHaveBeenCalled();
  });
});