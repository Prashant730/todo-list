import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockTasks } from '../../test/utils';
import TaskModal from '../TaskModal';

// Mock AI service
vi.mock('../../services/aiService', () => ({
  aiService: {
    generateTaskBreakdown: vi.fn().mockResolvedValue({
      dailyTasks: [
        {
          date: '2024-02-12',
          tasks: [
            {
              title: 'Research phase',
              description: 'Gather resources',
              priority: 'high',
              estimatedTime: '2 hours',
            },
          ],
        },
      ],
    }),
  },
}));

describe('TaskModal', () => {
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for new task', () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/task title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  });

  it('renders correctly for editing existing task', () => {
    const task = mockTasks[0];
    renderWithProviders(<TaskModal task={task} onClose={mockOnClose} />);

    expect(screen.getByDisplayValue(task.title)).toBeInTheDocument();
    expect(screen.getByDisplayValue(task.description)).toBeInTheDocument();
    expect(screen.getByDisplayValue(task.priority)).toBeInTheDocument();
  });

  it('validates task input correctly', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: /save task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('handles form submission correctly', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const titleInput = screen.getByLabelText(/task title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const submitButton = screen.getByRole('button', { name: /save task/i });

    await user.type(titleInput, 'New test task');
    await user.type(descriptionInput, 'Test description');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('handles AI breakdown integration', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const titleInput = screen.getByLabelText(/task title/i);
    const descriptionInput = screen.getByLabelText(/description/i);
    const dueDateInput = screen.getByLabelText(/due date/i);

    // Create a task that should trigger AI breakdown suggestion
    await user.type(titleInput, 'Complete comprehensive research project');
    await user.type(descriptionInput, 'This is a complex task that requires extensive research and analysis');

    // Set due date 7 days in the future
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateString = futureDate.toISOString().slice(0, 16);
    await user.type(dueDateInput, dateString);

    // Should show AI breakdown suggestion
    expect(screen.getByText(/ai breakdown/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const titleInput = screen.getByLabelText(/task title/i);
    titleInput.focus();

    // Tab through form elements
    await user.tab();
    expect(screen.getByLabelText(/description/i)).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText(/priority/i)).toHaveFocus();

    // Escape should close modal
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles category selection', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const categorySelect = screen.getByLabelText(/categories/i);
    await user.selectOptions(categorySelect, '📚 Assignments');

    expect(screen.getByDisplayValue('📚 Assignments')).toBeInTheDocument();
  });

  it('validates input length limits', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const titleInput = screen.getByLabelText(/task title/i);
    const longTitle = 'a'.repeat(201); // Exceeds 200 character limit

    await user.type(titleInput, longTitle);

    const submitButton = screen.getByRole('button', { name: /save task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be less than 200 characters/i)).toBeInTheDocument();
    });
  });

  it('handles date validation', async () => {
    renderWithProviders(<TaskModal onClose={mockOnClose} />);

    const titleInput = screen.getByLabelText(/task title/i);
    const dueDateInput = screen.getByLabelText(/due date/i);

    await user.type(titleInput, 'Test task');
    await user.type(dueDateInput, 'invalid-date');

    const submitButton = screen.getByRole('button', { name: /save task/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid due date/i)).toBeInTheDocument();
    });
  });
});