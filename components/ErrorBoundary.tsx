'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]" style={{ background: '#1a1a1a', borderRadius: '16px' }}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-sm text-white/70 mb-2">Something went wrong</p>
          <p className="text-xs text-white/40 mb-4">{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => this.setState({ hasError: false })} className="px-4 py-2 rounded-xl text-sm font-medium text-black" style={{ background: '#ff7a00' }}>
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
