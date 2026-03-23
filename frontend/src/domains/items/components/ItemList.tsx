import { useState } from 'react';
import { CATEGORIES } from '../../../shared/constants';

interface Item {
  id: string;
  amount: number;
  category: string | null;
  merchantName: string | null;
  transactionDate: string | null;
}

interface Props {
  items: Item[];
  canEdit: boolean;
  onDelete: (itemId: string) => Promise<void>;
  onUpdate: (
    itemId: string,
    data: { amount?: number; category?: string; merchantName?: string },
  ) => Promise<void>;
}

export function ItemList({ items, canEdit, onDelete, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditAmount(String(item.amount));
    setEditCategory(item.category ?? '');
    setActionError('');
  };

  const saveEdit = async (itemId: string) => {
    const parsed = Number(editAmount);
    if (!editAmount || isNaN(parsed) || parsed <= 0) {
      setActionError('Amount must be a number greater than 0');
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      await onUpdate(itemId, {
        amount: parsed,
        category: editCategory || undefined,
      });
      setEditingId(null);
    } catch {
      setActionError('Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeletingId(itemId);
    setActionError('');
    try {
      await onDelete(itemId);
    } catch {
      setActionError('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return <p style={{ color: '#9ca3af' }}>No items yet.</p>;
  }

  return (
    <div>
      {actionError && <p style={{ color: 'red', marginBottom: 8 }}>{actionError}</p>}
      {items.map((item) => (
        <div
          key={item.id}
          style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, marginBottom: 8 }}
        >
          {editingId === item.id ? (
            <div>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                style={{ marginRight: 8 }}
              />
              <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                <option value="">No category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button onClick={() => saveEdit(item.id)} disabled={saving} style={{ marginLeft: 8 }}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setEditingId(null)} style={{ marginLeft: 4 }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>${Number(item.amount).toFixed(2)}</strong>
                {item.category && (
                  <span style={{ marginLeft: 8, color: '#6b7280' }}>{item.category}</span>
                )}
                {item.merchantName && (
                  <span style={{ marginLeft: 8, color: '#6b7280' }}>{item.merchantName}</span>
                )}
                {item.transactionDate && (
                  <span style={{ marginLeft: 8, color: '#9ca3af', fontSize: 12 }}>
                    {item.transactionDate}
                  </span>
                )}
              </div>
              {canEdit && (
                <div>
                  <button onClick={() => startEdit(item)} style={{ marginRight: 4 }}>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={{ color: 'red' }}
                  >
                    {deletingId === item.id ? '...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
