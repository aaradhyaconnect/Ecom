type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(formatMessage("debug", message, context));
    }
  },

  info(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.info(formatMessage("info", message, context));
  },

  warn(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage("warn", message, context));
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorContext = { ...context };
    if (error instanceof Error) {
      errorContext.errorName = error.name;
      errorContext.errorMessage = error.message;
      if (process.env.NODE_ENV === "production") {
        try {
          const Sentry = require("@sentry/nextjs");
          Sentry.captureException(error, { extra: context });
        } catch {
          // Sentry not available
        }
      }
    }
    // eslint-disable-next-line no-console
    console.error(formatMessage("error", message, errorContext));
  },
};
