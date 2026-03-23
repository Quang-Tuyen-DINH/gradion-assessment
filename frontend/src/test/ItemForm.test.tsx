import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ItemForm } from '../domains/items/components/ItemForm';
import * as itemsApi from '../domains/items/api/items';

vi.mock('../domains/items/api/items', () => ({
  createItem: vi.fn().mockResolvedValue({}),
}));
// Mock at the hook level to avoid useSuggestCategory's internal effects/timers
vi.mock('../domains/ai/hooks/useSuggestCategory', () => ({
  useSuggestCategory: () => ({ suggest: vi.fn(), loading: false }),
}));

describe('ItemForm validation', () => {
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows required error and does not call createItem when amount is empty', async () => {
    const user = userEvent.setup();
    render(<ItemForm reportId="1" onSaved={onSaved} />);

    // Leave amount empty and submit — triggers "Amount is required"
    await user.click(screen.getByRole('button', { name: /add item/i }));

    await waitFor(() => {
      expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    });
    expect(itemsApi.createItem).not.toHaveBeenCalled();
  });

  it('calls createItem with valid data', async () => {
    render(<ItemForm reportId="1" onSaved={onSaved} />);

    // Use fireEvent.change — works reliably with Ant Design InputNumber in jsdom
    const spinbutton = screen.getByRole('spinbutton', { name: /amount/i });
    fireEvent.change(spinbutton, { target: { value: '50' } });
    fireEvent.blur(spinbutton);

    const addBtn = screen.getByRole('button', { name: /add item/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(itemsApi.createItem).toHaveBeenCalledWith('1', expect.objectContaining({ amount: 50 }));
    });
  });
});
