"use client";

import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Here you would send error to error tracking service (Sentry, etc)
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "400px",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              ⚠️
            </div>
            <h2 style={{ color: "#1e293b", marginBottom: "0.5rem" }}>
              Terjadi Kesalahan
            </h2>
            <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
              Maaf, ada kesalahan saat memuat halaman ini. Silakan coba
              refresh atau hubungi administrator.
            </p>
            {this.state.error && (
              <details
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  textAlign: "left",
                  maxWidth: "500px",
                  color: "#64748b",
                  fontSize: "0.875rem",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  Detail Error
                </summary>
                <pre
                  style={{
                    marginTop: "0.5rem",
                    overflow: "auto",
                    fontSize: "0.75rem",
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
