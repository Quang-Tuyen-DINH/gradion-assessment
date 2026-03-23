import { useState } from 'react';
import { Table, Button, InputNumber, Select, Popconfirm, Space, Form } from 'antd';
import { CATEGORIES } from '../../../shared/constants';

interface Item {
  id: string;
  amount: number;
  currency: string | null;
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
  const [editForm] = Form.useForm();

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    editForm.setFieldsValue({ amount: item.amount, category: item.category ?? undefined });
  };

  const saveEdit = async (item: Item) => {
    const values = await editForm.validateFields();
    await onUpdate(item.id, { amount: values.amount, category: values.category || undefined });
    setEditingId(null);
  };

  const columns = [
    {
      title: 'Amount',
      key: 'amount',
      render: (_: unknown, record: Item) =>
        editingId === record.id ? (
          <Form.Item
            name="amount"
            rules={[{ type: 'number' as const, min: 0.01, max: 1_000_000 }]}
            style={{ margin: 0 }}
          >
            <InputNumber prefix="$" min={0.01} max={1_000_000} step={0.01} />
          </Form.Item>
        ) : (
          `$${Number(record.amount).toFixed(2)}`
        ),
    },
    {
      title: 'Category',
      key: 'category',
      render: (_: unknown, record: Item) =>
        editingId === record.id ? (
          <Form.Item name="category" style={{ margin: 0 }}>
            <Select allowClear style={{ minWidth: 160 }}>
              {CATEGORIES.map((c) => (
                <Select.Option key={c} value={c}>
                  {c}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        ) : (
          record.category ?? '—'
        ),
    },
    {
      title: 'Merchant',
      dataIndex: 'merchantName',
      key: 'merchantName',
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Date',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      render: (v: string | null) => v ?? '—',
    },
    ...(canEdit
      ? [
          {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, record: Item) =>
              editingId === record.id ? (
                <Space>
                  <Button type="link" onClick={() => saveEdit(record)}>
                    Save
                  </Button>
                  <Button type="link" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </Space>
              ) : (
                <Space>
                  <Button type="link" onClick={() => startEdit(record)}>
                    Edit
                  </Button>
                  <Popconfirm title="Delete this item?" onConfirm={() => onDelete(record.id)}>
                    <Button type="link" danger>
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              ),
          },
        ]
      : []),
  ];

  return (
    <Form form={editForm}>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={false}
        locale={{ emptyText: 'No items yet.' }}
        size="small"
      />
    </Form>
  );
}
