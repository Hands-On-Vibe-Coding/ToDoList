# 에러 처리 및 검증 규칙

## 개요
이 문서는 ToDo 애플리케이션의 클라이언트/서버 에러 처리, 입력 검증, 그리고 예외 처리 전략을 정의합니다.

---

## 1. 클라이언트 에러 처리

### 1.1 에러 처리 유틸리티 (`utils/errorHandler.ts`)
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleApiError = (error: any): AppError => {
  if (error.response) {
    // API에서 반환된 에러
    const { status, data } = error.response;
    return new AppError(
      status,
      data.error?.code || 'API_ERROR',
      data.error?.message || 'API 요청 중 오류가 발생했습니다.',
      data.error?.details
    );
  } else if (error.request) {
    // 네트워크 에러
    return new AppError(
      0,
      'NETWORK_ERROR',
      '네트워크 연결을 확인해주세요.'
    );
  } else {
    // 기타 에러
    return new AppError(
      500,
      'UNKNOWN_ERROR',
      '알 수 없는 오류가 발생했습니다.'
    );
  }
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
};
```

### 1.2 Axios 인터셉터 설정 (`lib/apiClient.ts`)
```typescript
import axios from 'axios';
import { tokenStorage } from './tokenStorage';
import { handleApiError } from '../utils/errorHandler';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고 토큰 갱신을 시도하지 않았다면
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post('/auth/refresh', { refreshToken });
          const { accessToken } = response.data.data;
          
          tokenStorage.setAccessToken(accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 갱신 실패시 로그아웃 처리
        tokenStorage.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(handleApiError(error));
  }
);

export default apiClient;
```

### 1.3 React 에러 바운더리 (`components/ErrorBoundary.tsx`)
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 에러 리포팅 서비스로 전송 (예: Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-red-600 mb-4">
              페이지를 불러오는 중 문제가 발생했습니다.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left text-sm bg-red-100 p-2 rounded mb-4">
                <summary className="cursor-pointer">에러 상세 정보</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="space-y-2">
              <Button onClick={this.handleReset} className="w-full">
                다시 시도
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                홈으로 이동
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 2. 폼 검증 규칙

### 2.1 Zod 스키마 정의 (`schemas/validation.ts`)
```typescript
import { z } from 'zod';

// 인증 스키마
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
});

export const signupSchema = z.object({
  name: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .min(2, '이름은 최소 2자 이상이어야 합니다.')
    .max(20, '이름은 최대 20자까지 입력 가능합니다.'),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'),
  confirmPassword: z
    .string()
    .min(1, '비밀번호 확인을 입력해주세요.')
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword']
});

// ToDo 스키마
export const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .min(2, '제목은 최소 2자 이상이어야 합니다.')
    .max(200, '제목은 최대 200자까지 입력 가능합니다.'),
  description: z
    .string()
    .max(1000, '설명은 최대 1000자까지 입력 가능합니다.')
    .optional(),
  priority: z.enum(['high', 'medium', 'low'], {
    errorMap: () => ({ message: '올바른 우선순위를 선택해주세요.' })
  })
});

export const updateTodoSchema = createTodoSchema.partial().extend({
  status: z.enum(['pending', 'in-progress', 'completed']).optional()
});

export const updateTodoStatusSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'completed'], {
    errorMap: () => ({ message: '올바른 상태를 선택해주세요.' })
  })
});

// 쿼리 파라미터 스키마
export const todoListQuerySchema = z.object({
  page: z.string().transform(Number).refine(n => n > 0, '페이지는 1 이상이어야 합니다.').optional(),
  limit: z.string().transform(Number).refine(n => n > 0 && n <= 100, '한 페이지당 항목 수는 1-100 사이여야 합니다.').optional(),
  status: z.enum(['all', 'pending', 'in-progress', 'completed']).optional(),
  priority: z.enum(['all', 'high', 'medium', 'low']).optional(),
  search: z.string().max(100, '검색어는 최대 100자까지 입력 가능합니다.').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});
```

### 2.2 React Hook Form 통합 (`hooks/useValidatedForm.ts`)
```typescript
import { useForm, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface UseValidatedFormProps<T extends z.ZodType> extends Omit<UseFormProps<z.infer<T>>, 'resolver'> {
  schema: T;
}

export function useValidatedForm<T extends z.ZodType>({
  schema,
  ...props
}: UseValidatedFormProps<T>) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    ...props,
  });

  const getFieldError = (fieldName: keyof z.infer<T>) => {
    return form.formState.errors[fieldName]?.message as string | undefined;
  };

  const hasError = (fieldName: keyof z.infer<T>) => {
    return !!form.formState.errors[fieldName];
  };

  const isFieldTouched = (fieldName: keyof z.infer<T>) => {
    return !!form.formState.touchedFields[fieldName];
  };

  return {
    ...form,
    getFieldError,
    hasError,
    isFieldTouched,
    isValid: form.formState.isValid,
    isSubmitting: form.formState.isSubmitting,
  };
}
```

---

## 3. 서버 에러 처리

### 3.1 Lambda 에러 핸들러 (`utils/errorHandler.ts`)
```typescript
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { createErrorResponse } from './response';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleLambdaError = (handler: APIGatewayProxyHandler): APIGatewayProxyHandler => {
  return async (event, context) => {
    try {
      return await handler(event, context);
    } catch (error) {
      console.error('Lambda Error:', error);

      if (error instanceof AppError) {
        return createErrorResponse(
          error.statusCode,
          error.code,
          error.message,
          error.details
        );
      }

      // Zod 검증 에러
      if (error.name === 'ZodError') {
        return createErrorResponse(
          400,
          'VALIDATION_ERROR',
          '입력 데이터가 올바르지 않습니다.',
          {
            validationErrors: error.errors.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message
            }))
          }
        );
      }

      // DynamoDB 에러
      if (error.name === 'ConditionalCheckFailedException') {
        return createErrorResponse(
          409,
          'RESOURCE_CONFLICT',
          '리소스 충돌이 발생했습니다.'
        );
      }

      if (error.name === 'ResourceNotFoundException') {
        return createErrorResponse(
          404,
          'RESOURCE_NOT_FOUND',
          '요청한 리소스를 찾을 수 없습니다.'
        );
      }

      // 기본 서버 에러
      return createErrorResponse(
        500,
        'INTERNAL_SERVER_ERROR',
        '서버 내부 오류가 발생했습니다.'
      );
    }
  };
};
```

### 3.2 입력 검증 미들웨어 (`middleware/validation.ts`)
```typescript
import { APIGatewayProxyEvent } from 'aws-lambda';
import { z } from 'zod';
import { AppError } from '../utils/errorHandler';

export const validateInput = <T extends z.ZodType>(schema: T) => {
  return (handler: Function) => {
    return async (event: APIGatewayProxyEvent, context: any) => {
      try {
        let body;
        
        if (event.body) {
          try {
            body = JSON.parse(event.body);
          } catch (e) {
            throw new AppError(400, 'INVALID_JSON', 'Invalid JSON format');
          }
        }

        const validatedData = schema.parse(body);
        
        // 검증된 데이터를 이벤트에 추가
        (event as any).validatedBody = validatedData;
        
        return await handler(event, context);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            '입력 데이터 검증에 실패했습니다.',
            {
              validationErrors: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
              }))
            }
          );
        }
        throw error;
      }
    };
  };
};

export const validateQueryParams = <T extends z.ZodType>(schema: T) => {
  return (handler: Function) => {
    return async (event: APIGatewayProxyEvent, context: any) => {
      try {
        const validatedParams = schema.parse(event.queryStringParameters || {});
        
        // 검증된 쿼리 파라미터를 이벤트에 추가
        (event as any).validatedQuery = validatedParams;
        
        return await handler(event, context);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new AppError(
            400,
            'VALIDATION_ERROR',
            '쿼리 파라미터 검증에 실패했습니다.',
            {
              validationErrors: error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message,
                code: err.code
              }))
            }
          );
        }
        throw error;
      }
    };
  };
};
```

---

## 4. 재시도 로직

### 4.1 클라이언트 재시도 (`utils/retry.ts`)
```typescript
interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'fixed' | 'exponential';
  shouldRetry?: (error: any) => boolean;
}

export const retry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> => {
  const { maxAttempts, delay, backoff = 'fixed', shouldRetry } = options;
  
  let attempt = 1;
  
  while (attempt <= maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      // 재시도 조건 확인
      if (shouldRetry && !shouldRetry(error)) {
        throw error;
      }
      
      // 마지막 시도라면 에러 던지기
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // 대기 시간 계산
      const waitTime = backoff === 'exponential' 
        ? delay * Math.pow(2, attempt - 1)
        : delay;
      
      console.warn(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      attempt++;
    }
  }
  
  throw new Error('Max retry attempts reached');
};

// API 호출용 재시도 래퍼
export const withRetry = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: Partial<RetryOptions> = {}
) => {
  const defaultOptions: RetryOptions = {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: (error) => {
      // 네트워크 에러나 5xx 에러만 재시도
      return !error.response || error.response.status >= 500;
    }
  };
  
  return (...args: T): Promise<R> => {
    return retry(() => fn(...args), { ...defaultOptions, ...options });
  };
};

// 사용 예시
export const createTodoWithRetry = withRetry(
  (data: CreateTodoRequest) => apiClient.post('/todos', data),
  { maxAttempts: 2, delay: 500 }
);
```

### 4.2 React Query 에러 처리 (`hooks/useTodoMutations.ts`)
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoService } from '../services/todoService';
import { useUIStore } from '../store/uiStore';
import { getErrorMessage } from '../utils/errorHandler';

export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useUIStore();

  return useMutation({
    mutationFn: todoService.createTodo,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      addNotification({
        type: 'success',
        title: 'ToDo 생성 완료',
        message: `"${data.todo.title}"이 생성되었습니다.`
      });
    },
    onError: (error) => {
      addNotification({
        type: 'error',
        title: 'ToDo 생성 실패',
        message: getErrorMessage(error)
      });
    },
    // 재시도 설정
    retry: (failureCount, error) => {
      // 클라이언트 에러(4xx)는 재시도하지 않음
      if (error instanceof AppError && error.statusCode < 500) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

---

## 5. 알림 시스템

### 5.1 알림 컴포넌트 (`components/ui/Toast.tsx`)
```typescript
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps extends Toast {
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export const ToastComponent: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onRemove,
}) => {
  const Icon = toastIcons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 rounded-lg border shadow-md animate-slide-up',
        toastStyles[type]
      )}
    >
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium">{title}</h4>
        {message && (
          <p className="mt-1 text-sm opacity-90">{message}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 p-1 hover:bg-black/5 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast 컨테이너
export const ToastContainer: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
  const { removeNotification } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};
```

### 5.2 전역 에러 핸들러 (`components/GlobalErrorHandler.tsx`)
```typescript
import React from 'react';
import { useUIStore } from '../store/uiStore';
import { ToastContainer } from './ui/Toast';

export const GlobalErrorHandler: React.FC = () => {
  const { notifications } = useUIStore();

  // 전역 에러 이벤트 리스너
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      const { addNotification } = useUIStore.getState();
      addNotification({
        type: 'error',
        title: '예상치 못한 오류',
        message: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        duration: 8000
      });
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      
      const { addNotification } = useUIStore.getState();
      addNotification({
        type: 'error',
        title: 'JavaScript 오류',
        message: '페이지에서 오류가 발생했습니다.',
        duration: 8000
      });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <ToastContainer toasts={notifications} />;
};
```

---

## 6. 로깅 시스템

### 6.1 클라이언트 로거 (`utils/logger.ts`)
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  level: keyof typeof LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

class Logger {
  private level: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.level = LogLevel[process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private createLogEntry(level: keyof typeof LogLevel, message: string, data?: any): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private shouldLog(level: keyof typeof LogLevel): boolean {
    return LogLevel[level] >= this.level;
  }

  private formatMessage(entry: LogEntry): string {
    return `[${entry.timestamp}] ${entry.level}: ${entry.message}`;
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog('DEBUG')) return;
    
    const entry = this.createLogEntry('DEBUG', message, data);
    console.debug(this.formatMessage(entry), data);
  }

  info(message: string, data?: any) {
    if (!this.shouldLog('INFO')) return;
    
    const entry = this.createLogEntry('INFO', message, data);
    console.info(this.formatMessage(entry), data);
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog('WARN')) return;
    
    const entry = this.createLogEntry('WARN', message, data);
    console.warn(this.formatMessage(entry), data);
    
    if (this.isProduction) {
      this.sendToLoggingService(entry);
    }
  }

  error(message: string, error?: any) {
    if (!this.shouldLog('ERROR')) return;
    
    const entry = this.createLogEntry('ERROR', message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    console.error(this.formatMessage(entry), error);
    
    if (this.isProduction) {
      this.sendToLoggingService(entry);
    }
  }

  private async sendToLoggingService(entry: LogEntry) {
    try {
      // 로깅 서비스로 전송 (예: CloudWatch, Sentry 등)
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch (e) {
      console.error('Failed to send log to service:', e);
    }
  }
}

export const logger = new Logger();
```

### 6.2 서버 로거 (`utils/logger.ts`)
```typescript
import { Context } from 'aws-lambda';

interface LogContext {
  requestId?: string;
  userId?: string;
  functionName?: string;
  functionVersion?: string;
}

class ServerLogger {
  private context: LogContext = {};

  setContext(context: Partial<LogContext>) {
    this.context = { ...this.context, ...context };
  }

  private createLogEntry(level: string, message: string, data?: any) {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      ...this.context
    };
  }

  debug(message: string, data?: any) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(JSON.stringify(this.createLogEntry('DEBUG', message, data)));
    }
  }

  info(message: string, data?: any) {
    console.log(JSON.stringify(this.createLogEntry('INFO', message, data)));
  }

  warn(message: string, data?: any) {
    console.warn(JSON.stringify(this.createLogEntry('WARN', message, data)));
  }

  error(message: string, error?: any) {
    console.error(JSON.stringify(this.createLogEntry('ERROR', message, {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })));
  }

  // Lambda 컨텍스트 설정
  setLambdaContext(context: Context) {
    this.setContext({
      requestId: context.awsRequestId,
      functionName: context.functionName,
      functionVersion: context.functionVersion
    });
  }
}

export const serverLogger = new ServerLogger();
```

---

## 7. 테스트 에러 시나리오

### 7.1 에러 핸들링 테스트 (`__tests__/errorHandling.test.ts`)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { handleApiError, AppError } from '../utils/errorHandler';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('Error Handling', () => {
  describe('handleApiError', () => {
    it('should handle API response errors', () => {
      const mockError = {
        response: {
          status: 400,
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: '입력 데이터가 올바르지 않습니다.'
            }
          }
        }
      };

      const appError = handleApiError(mockError);
      
      expect(appError).toBeInstanceOf(AppError);
      expect(appError.statusCode).toBe(400);
      expect(appError.code).toBe('VALIDATION_ERROR');
      expect(appError.message).toBe('입력 데이터가 올바르지 않습니다.');
    });

    it('should handle network errors', () => {
      const mockError = {
        request: {},
        message: 'Network Error'
      };

      const appError = handleApiError(mockError);
      
      expect(appError.statusCode).toBe(0);
      expect(appError.code).toBe('NETWORK_ERROR');
    });
  });

  describe('ErrorBoundary', () => {
    it('should render error fallback when child component throws', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
      expect(screen.getByText('다시 시도')).toBeInTheDocument();
    });

    it('should reset error state when retry button is clicked', async () => {
      let shouldThrow = true;
      const TestComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success</div>;
      };

      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();

      shouldThrow = false;
      fireEvent.click(screen.getByText('다시 시도'));

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument();
      });
    });
  });
});
```