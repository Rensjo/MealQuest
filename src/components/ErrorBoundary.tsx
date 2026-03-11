import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#0f0700] p-8 text-white">
          <div className="max-w-md rounded-2xl border border-amber-900/40 bg-neutral-900/90 p-8 text-center">
            <h2 className="mb-3 text-xl font-bold text-amber-400">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-neutral-400">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
