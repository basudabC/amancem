// ============================================================
// AMAN CEMENT CRM — Centralized Logger
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: any;
}

class Logger {
    private isDevelopment = import.meta.env.DEV;

    private formatMessage(level: LogLevel, message: string, data?: any): LogEntry {
        return {
            level,
            message,
            timestamp: new Date().toISOString(),
            data,
        };
    }

    private shouldLog(level: LogLevel): boolean {
        // In production, only log warnings and errors
        if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
            return false;
        }
        return true;
    }

    debug(message: string, data?: any) {
        if (!this.shouldLog('debug')) return;
        const entry = this.formatMessage('debug', message, data);
        console.debug(`[DEBUG] ${entry.message}`, data || '');
    }

    info(message: string, data?: any) {
        if (!this.shouldLog('info')) return;
        const entry = this.formatMessage('info', message, data);
        console.info(`[INFO] ${entry.message}`, data || '');
    }

    warn(message: string, data?: any) {
        if (!this.shouldLog('warn')) return;
        const entry = this.formatMessage('warn', message, data);
        console.warn(`[WARN] ${entry.message}`, data || '');
    }

    error(message: string, error?: any) {
        if (!this.shouldLog('error')) return;
        const entry = this.formatMessage('error', message, error);
        console.error(`[ERROR] ${entry.message}`, error || '');

        // In production, you could send errors to a monitoring service here
        // Example: Sentry.captureException(error);
    }

    // Special method for API errors
    apiError(endpoint: string, error: any) {
        this.error(`API Error: ${endpoint}`, {
            endpoint,
            error: error?.message || error,
            status: error?.status,
            details: error?.details,
        });
    }

    // Special method for database errors
    dbError(operation: string, error: any) {
        this.error(`Database Error: ${operation}`, {
            operation,
            error: error?.message || error,
            code: error?.code,
            details: error?.details,
        });
    }
}

export const logger = new Logger();
