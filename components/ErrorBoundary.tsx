"use client";

import { Component, ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="text-zinc-700 text-xs">
          {this.props.label} utilgjengelig
        </div>
      );
    }
    return this.props.children;
  }
}
