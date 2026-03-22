import React, { Component, ReactNode } from 'react';
interface State { hasError: boolean }
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) return <div>Something went wrong. Please refresh.</div>;
    return this.props.children;
  }
}
