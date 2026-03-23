import { Spin } from 'antd';

export function LoadingSpinner() {
  return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <Spin size="large" />
    </div>
  );
}
