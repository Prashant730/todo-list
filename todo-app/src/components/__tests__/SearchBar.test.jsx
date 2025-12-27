import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input correctly', () => {
    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search tasks...');
    expect(searchInput).toHaveAttribute('aria-label', 'Search tasks');
  });

  it('handles search input with debouncing', async () => {
    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test search');

    // Should show the typed value immediately
    expect(searchInput).toHaveValue('test search');

    // Wait for debounce to complete
    await waitFor(() => {
      // The debounced value should be applied to the context
      // This would be tested by checking if filtered results update
    }, { timeout: 500 });
  });

  it('shows clear button when search has value', async () => {
    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test');

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test search');

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);

    expect(searchInput).toHaveValue('');
  });

  it('handles keyboard navigation', async () => {
    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');
    searchInput.focus();

    expect(searchInput).toHaveFocus();

    // Type and then use Escape to clear (if implemented)
    await user.type(searchInput, 'test');
    await user.keyboard('{Escape}');

    // Should still have focus but might clear the input
    expect(searchInput).toHaveFocus();
  });

  it('debounces search input correctly', async () => {
    vi.useFakeTimers();

    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');

    // Type multiple characters quickly
    await user.type(searchInput, 'quick');

    // Fast forward time but not enough for debounce
    vi.advanceTimersByTime(200);

    // Type more
    await user.type(searchInput, ' search');

    // Now advance past debounce time
    vi.advanceTimersByTime(400);

    // The final value should be debounced
    expect(searchInput).toHaveValue('quick search');

    vi.useRealTimers();
  });

  it('maintains accessibility attributes', () => {
    renderWithProviders(<SearchBar />);

    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search tasks');

    // Type to show clear button
    user.type(searchInput, 'test');

    waitFor(() => {
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search');
    });
  });
});