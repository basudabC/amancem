// ============================================================
// AMAN CEMENT CRM — Error Boundary Component
// ============================================================

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error('React Error Boundary caught an error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });

        this.setState({
            error,
            errorInfo,
        });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#061A3A] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-[#0F3460] rounded-lg shadow-xl p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-[#C41E3A] bg-opacity-20 rounded-full p-4">
                                <AlertTriangle className="w-12 h-12 text-[#C41E3A]" />
                            </div>
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-[#8B9CB8] mb-6">
                            We're sorry for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="bg-[#061A3A] rounded p-4 mb-6 text-left">
                                <p className="text-[#C41E3A] font-mono text-sm mb-2">
                                    {this.state.error.message}
                                </p>
                                {this.state.error.stack && (
                                    <pre className="text-[#8B9CB8] text-xs overflow-auto max-h-40">
                                        {this.state.error.stack}
                                    </pre>
                                )}
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="bg-[#C41E3A] hover:bg-[#9B1830] text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Return to Home
                        </button>

                        <p className="text-[#8B9CB8] text-sm mt-4">
                            If this problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
