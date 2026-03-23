import { Form, Input, InputNumber, Select, Button, DatePicker, Typography } from 'antd';
import dayjs from 'dayjs';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { useSuggestCategory } from '../../ai/hooks/useSuggestCategory';
import { createItem } from '../api/items';
import { CATEGORIES } from '../../../shared/constants';

interface Props {
  reportId: string;
  onSaved: () => void;
}

export function ItemForm({ reportId, onSaved }: Props) {
  const [form] = Form.useForm();
  const merchantName = Form.useWatch('merchantName', form) ?? '';
  const debouncedMerchant = useDebounce(merchantName, 300);
  const { suggest, loading: aiLoading } = useSuggestCategory(debouncedMerchant, (cat) =>
    form.setFieldValue('category', cat),
  );

  const onFinish = async (values: {
    amount: number;
    currency?: string;
    merchantName?: string;
    category?: string;
    transactionDate?: dayjs.Dayjs;
  }) => {
    await createItem(reportId, {
      amount: values.amount,
      currency: values.currency || undefined,
      merchantName: values.merchantName || undefined,
      category: values.category || undefined,
      transactionDate: values.transactionDate?.format('YYYY-MM-DD') || undefined,
    });
    form.resetFields();
    onSaved();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      style={{
        marginTop: 24,
        padding: 16,
        border: '1px dashed #d9d9d9',
        borderRadius: 8,
      }}
    >
      <Typography.Title level={5} style={{ margin: '0 0 12px' }}>
        Add Item
      </Typography.Title>

      <Form.Item
        name="amount"
        label="Amount"
        rules={[
          { required: true, message: 'Amount is required' },
          { type: 'number', min: 0.01, max: 1_000_000, message: 'Must be between $0.01 and $1,000,000' },
        ]}
      >
        <InputNumber prefix="$" style={{ width: '100%' }} min={0.01} max={1_000_000} step={0.01} />
      </Form.Item>

      <Form.Item
        name="merchantName"
        label="Merchant Name"
        rules={[{ min: 2, message: 'Merchant name must be at least 2 characters' }]}
      >
        <Input.Search
          placeholder="e.g. Uber"
          enterButton={aiLoading ? '...' : 'Suggest'}
          onSearch={() => suggest()}
          loading={aiLoading}
        />
      </Form.Item>

      <Form.Item name="category" label="Category">
        <Select placeholder="Select category" allowClear>
          {CATEGORIES.map((c) => (
            <Select.Option key={c} value={c}>
              {c}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="currency"
        label="Currency"
        initialValue="USD"
        rules={[{ pattern: /^[A-Z]{3}$/, message: 'Must be a 3-letter currency code (e.g. USD)' }]}
      >
        <Input placeholder="USD" maxLength={3} style={{ width: 100 }} />
      </Form.Item>

      <Form.Item
        name="transactionDate"
        label="Transaction Date"
        rules={[
          {
            validator: (_, value) => {
              if (value && dayjs(value).isAfter(dayjs(), 'day')) {
                return Promise.reject('Transaction date cannot be in the future');
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <DatePicker
          style={{ width: '100%' }}
          disabledDate={(d) => d.isAfter(dayjs(), 'day')}
          format="YYYY-MM-DD"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Add Item
        </Button>
      </Form.Item>
    </Form>
  );
}
