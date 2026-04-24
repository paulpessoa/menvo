/**
 * Logging utilities for debugging and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage, data || '');
        }
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        break;
    }

    // In production, you might want to send logs to a service
    if (!this.isDevelopment && level === 'error') {
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry) {
    // Implement your logging service integration here
    // Examples: Sentry, LogRocket, DataDog, etc.
  }

  debug(message: string, context?: string, data?: any) {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: any) {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: any) {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: any) {
    this.log('error', message, context, data);
  }

  // Specific logging methods for common operations
  profileUpdate(success: boolean, userId: string, fields?: string[]) {
    const message = success 
      ? `Profile updated successfully for user ${userId}`
      : `Profile update failed for user ${userId}`;
    
    this.info(message, 'ProfileUpdate', { userId, fields, success });
  }

  fileUpload(success: boolean, fileName: string, fileSize: number, fileType: string) {
    const message = success
      ? `File uploaded successfully: ${fileName}`
      : `File upload failed: ${fileName}`;
    
    this.info(message, 'FileUpload', { fileName, fileSize, fileType, success });
  }

  apiCall(method: string, url: string, status: number, duration?: number) {
    const message = `${method} ${url} - ${status}`;
    const level = status >= 400 ? 'error' : 'info';
    
    this.log(level, message, 'API', { method, url, status, duration });
  }

  userAction(action: string, userId: string, details?: any) {
    this.info(`User action: ${action}`, 'UserAction', { userId, action, details });
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions
export const logDebug = (message: string, context?: string, data?: any) => 
  logger.debug(message, context, data);

export const logInfo = (message: string, context?: string, data?: any) => 
  logger.info(message, context, data);

export const logWarn = (message: string, context?: string, data?: any) => 
  logger.warn(message, context, data);

export const logError = (message: string, context?: string, data?: any) => 
  logger.error(message, context, data);

// Performance logging utility
export function withPerformanceLogging<T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = performance.now();
    
    try {
      logger.debug(`Starting ${operationName}`, context);
      const result = await operation();
      const duration = performance.now() - startTime;
      
      logger.debug(`Completed ${operationName} in ${duration.toFixed(2)}ms`, context);
      resolve(result);
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Failed ${operationName} after ${duration.toFixed(2)}ms`, context, error);
      reject(error);
    }
  });
}
