"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { logTelemetryAction } from "@/lib/feature-flags";
import { AlertOctagon, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
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
    console.error("ErrorBoundary caught an unhandled crash:", error, errorInfo);
    
    // Log crash details to centralized SRE database table
    logTelemetryAction({
      type: "error",
      level: "critical",
      message: `React render crash: ${error.message || "Unknown error"}`,
      details: {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      },
    }).catch((err) => {
      console.error("Failed to submit telemetry logs to server:", err);
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-100 selection:bg-indigo-500/30">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-500/10 p-4 border border-red-500/20 text-red-500 animate-pulse">
                <AlertOctagon className="h-10 w-10" />
              </div>
              
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold tracking-tight text-white">System Error Occurred</h1>
                <p className="text-xs text-zinc-400 max-w-sm">
                  ResumeAI Pro encountered a critical interface error. The event has been logged for developer diagnostics.
                </p>
              </div>

              <div className="w-full rounded-lg bg-zinc-950 p-4 text-left border border-zinc-800/80">
                <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider mb-2">Crash Diagnosis</p>
                <div className="font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-40 whitespace-pre-wrap leading-relaxed">
                  {this.state.error?.toString() || "Unknown error"}
                  {this.state.error?.stack && (
                    <span className="block mt-2 text-zinc-500 border-t border-zinc-800 pt-2">
                      {this.state.error.stack.split("\n").slice(0, 4).join("\n")}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex w-full gap-3 pt-2">
                <button
                  onClick={() => typeof window !== "undefined" && window.location.reload()}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
                >
                  Reload Page
                </button>
                <button
                  onClick={this.handleReset}
                  className="flex-1 inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Workspace
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
