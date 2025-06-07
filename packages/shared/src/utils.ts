import { ulid } from 'ulid';

// ID generation
export const generateId = (): string => ulid();

// Date utilities
export const formatDate = (date: Date): string => date.toISOString();

export const getCurrentDate = (): string => formatDate(new Date());

// Validation utilities
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Error utilities
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createSuccessResponse = <T>(data: T, meta?: any) => ({
  success: true,
  data,
  meta,
});

export const createErrorResponse = (statusCode: number, code: string, message: string) => ({
  success: false,
  error: {
    code,
    message,
  },
});

// DynamoDB utilities
export const createUserPK = (userId: string): string => `USER#${userId}`;
export const createTodoPK = (userId: string): string => `USER#${userId}`;
export const createTodoSK = (todoId: string): string => `TODO#${todoId}`;

// Constants
export const TABLE_NAMES = {
  USERS: 'todolist-users',
  TODOS: 'todolist-todos',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;