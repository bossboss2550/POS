import { Component, type ErrorInfo, type ReactNode } from "react";
import { isAxiosError } from "axios";

interface Props {
  children: ReactNode;
  fallback?: (reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  status?: number;
  message: string;
}

/**
 * Route-level error boundary that handles Axios / network errors gracefully.
 * Wraps each route in App.tsx so fetch failures never crash the entire app.
 */
export class ApiErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    if (isAxiosError(error)) {
      return {
        hasError: true,
        status: error.response?.status,
        message:
          (error.response?.data as { message?: string })?.message ??
          error.message ??
          "Network error",
      };
    }
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("[ApiErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, message: "" });

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) return this.props.fallback(this.reset);

    const { status, message } = this.state;

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            {status === 404 ? "Not Found"
              : status === 403 ? "Access Denied"
              : status === 503 ? "Service Unavailable"
              : "Something went wrong"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">{message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={this.reset}
              className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              Try again
            </button>
            <button onClick={() => window.location.reload()}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors">
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
