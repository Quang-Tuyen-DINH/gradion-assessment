import { useState } from 'react';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useSuggestCategory } from '../../ai/hooks/useSuggestCategory';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { createItem } from '../api/items';
import { CATEGORIES } from '../../../shared/constants';

interface Props {
  reportId: string;
  onSaved: () => void;
}

export function ItemForm({ reportId, onSaved }: Props) {
  const [amount, setAmount] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const debouncedMerchant = useDebounce(merchantName, 300);
  const { suggest, loading: aiLoading } = useSuggestCategory(debouncedMerchant, setCategory);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createItem(reportId, {
        amount: Number(amount),
        merchantName: merchantName || undefined,
        category: category || undefined,
        transactionDate: transactionDate || undefined,
      });
      setAmount('');
      setMerchantName('');
      setCategory('');
      setTransactionDate('');
      onSaved();
    } catch {
      setError('Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ border: '1px dashed #d1d5db', borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h4 style={{ margin: '0 0 12px' }}>Add Item</h4>
      {error && <p style={{ color: 'red', margin: '0 0 8px' }}>{error}</p>}
      <input
        placeholder="Amount"
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          placeholder="Merchant name"
          value={merchantName}
          onChange={e => setMerchantName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={suggest} disabled={aiLoading || !merchantName}>
          {aiLoading ? '...' : 'Suggest'}
        </button>
      </div>
      {aiLoading && <LoadingSpinner />}
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        style={{ display: 'block', width: '100%', margin: '0 0 8px' }}
      >
        <option value="">Select category</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input
        type="date"
        value={transactionDate}
        onChange={e => setTransactionDate(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 8 }}
      />
      <button onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Add Item'}
      </button>
    </div>
  );
}
