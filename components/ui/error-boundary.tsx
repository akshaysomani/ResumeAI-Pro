"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon } from "lucide-react";
import { Button } from "./button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled client error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/30 p-8 text-center dark:border-red-900/30 dark:bg-red-950/10">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/40">
            <AlertOctagon className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Something went wrong
          </h2>
          <p className="mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            {this.state.error?.message || "An unexpected error occurred in this application module."}
          </p>
          <Button onClick={this.handleReset} className="mt-6" variant="outline">
            Try reloading
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
