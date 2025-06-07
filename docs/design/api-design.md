# API 설계 및 데이터 모델

## 개요
이 문서는 ToDo 애플리케이션의 API 설계, 데이터 모델, 그리고 요청/응답 스펙을 정의합니다.

---

## 1. 데이터 모델

### 1.1 DynamoDB 테이블 설계

#### Users 테이블
```typescript
{
  PK: "USER#{userId}",           // Partition Key
  SK: "PROFILE",                  // Sort Key
  email: string,                  // GSI
  name: string,
  createdAt: string,              // ISO 8601
  updatedAt: string               // ISO 8601
}
```

#### Todos 테이블
```typescript
{
  PK: "USER#{userId}",            // Partition Key
  SK: "TODO#{todoId}",            // Sort Key
  todoId: string,                 // ULID
  title: string,
  description?: string,
  priority: "high" | "medium" | "low",
  status: "pending" | "in-progress" | "completed",
  createdAt: string,              // ISO 8601
  updatedAt: string               // ISO 8601
}
```

### 1.2 인덱스 전략
- **Global Secondary Index (GSI)**
  - GSI1: email (Users 테이블에서 이메일로 사용자 조회)

---

## 2. API 엔드포인트

### 2.1 인증 엔드포인트
```
POST   /auth/signup      # 회원가입
POST   /auth/signin      # 로그인
POST   /auth/signout     # 로그아웃
POST   /auth/refresh     # 토큰 갱신
GET    /auth/me          # 현재 사용자 정보
```

### 2.2 ToDo CRUD 엔드포인트
```
GET    /todos            # ToDo 목록 조회 (필터링, 페이징)
POST   /todos            # ToDo 생성
GET    /todos/{id}       # ToDo 상세 조회
PUT    /todos/{id}       # ToDo 수정
DELETE /todos/{id}       # ToDo 삭제
PATCH  /todos/{id}/status # 상태 변경
```

---

## 3. API 요청/응답 상세 스펙

### 3.1 공통 응답 형식
```typescript
// 성공 응답
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// 에러 응답
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
}
```

### 3.2 인증 API 상세 스펙

**POST /auth/signup**
```typescript
// 요청
interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

// 응답
interface SignupResponse {
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

**POST /auth/signin**
```typescript
// 요청
interface SigninRequest {
  email: string;
  password: string;
}

// 응답 - SignupResponse와 동일
```

**POST /auth/refresh**
```typescript
// 요청
interface RefreshRequest {
  refreshToken: string;
}

// 응답
interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}
```

**GET /auth/me**
```typescript
// 헤더: Authorization: Bearer {accessToken}
// 응답
interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 ToDo API 상세 스펙

**GET /todos**
```typescript
// 쿼리 파라미터
interface TodoListParams {
  page?: number;        // 기본값: 1
  limit?: number;       // 기본값: 20, 최대: 100
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
  search?: string;      // 제목/설명 검색
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';  // 기본값: desc
}

// 응답
interface TodoListResponse {
  todos: Todo[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
```

**POST /todos**
```typescript
// 요청
interface CreateTodoRequest {
  title: string;        // 최소 1자, 최대 200자
  description?: string; // 최대 1000자
  priority: 'high' | 'medium' | 'low';
}

// 응답
interface CreateTodoResponse {
  todo: Todo;
}
```

**GET /todos/{id}**
```typescript
// 응답
interface TodoDetailResponse {
  todo: Todo;
}
```

**PUT /todos/{id}**
```typescript
// 요청
interface UpdateTodoRequest {
  title?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed';
}

// 응답
interface UpdateTodoResponse {
  todo: Todo;
}
```

**PATCH /todos/{id}/status**
```typescript
// 요청
interface UpdateTodoStatusRequest {
  status: 'pending' | 'in-progress' | 'completed';
}

// 응답
interface UpdateTodoStatusResponse {
  todo: Todo;
}
```

**DELETE /todos/{id}**
```typescript
// 응답
interface DeleteTodoResponse {
  message: string;
}
```

---

## 4. 에러 코드 정의

### 4.1 에러 코드 열거형
```typescript
enum ApiErrorCode {
  // 인증 관련
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 사용자 관련
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  
  // ToDo 관련
  TODO_NOT_FOUND = 'TODO_NOT_FOUND',
  TODO_ACCESS_DENIED = 'TODO_ACCESS_DENIED',
  
  // 유효성 검사
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST_FORMAT = 'INVALID_REQUEST_FORMAT',
  
  // 서버 에러
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // 레이트 리미팅
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

### 4.2 HTTP 상태 코드 매핑
```typescript
const HTTP_STATUS_MAPPING = {
  // 성공
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  
  // 클라이언트 에러
  400: 'Bad Request',           // VALIDATION_ERROR, INVALID_REQUEST_FORMAT
  401: 'Unauthorized',          // UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED
  403: 'Forbidden',             // TODO_ACCESS_DENIED
  404: 'Not Found',             // USER_NOT_FOUND, TODO_NOT_FOUND
  409: 'Conflict',              // EMAIL_ALREADY_EXISTS
  429: 'Too Many Requests',     // RATE_LIMIT_EXCEEDED
  
  // 서버 에러
  500: 'Internal Server Error', // INTERNAL_SERVER_ERROR
  503: 'Service Unavailable'    // SERVICE_UNAVAILABLE
} as const;
```

---

## 5. TypeScript 타입 정의

### 5.1 공통 타입
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface Todo {
  id: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface TodoFilter {
  status?: Todo['status'] | 'all';
  priority?: Todo['priority'] | 'all';
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}
```

### 5.2 API 클라이언트 타입
```typescript
interface ApiClient {
  // Auth
  signup(data: SignupRequest): Promise<ApiSuccessResponse<SignupResponse>>;
  signin(data: SigninRequest): Promise<ApiSuccessResponse<SignupResponse>>;
  signout(): Promise<ApiSuccessResponse<{ message: string }>>;
  refreshToken(data: RefreshRequest): Promise<ApiSuccessResponse<RefreshResponse>>;
  getCurrentUser(): Promise<ApiSuccessResponse<UserProfileResponse>>;
  
  // Todos
  getTodos(params?: TodoListParams): Promise<ApiSuccessResponse<TodoListResponse>>;
  createTodo(data: CreateTodoRequest): Promise<ApiSuccessResponse<CreateTodoResponse>>;
  getTodo(id: string): Promise<ApiSuccessResponse<TodoDetailResponse>>;
  updateTodo(id: string, data: UpdateTodoRequest): Promise<ApiSuccessResponse<UpdateTodoResponse>>;
  deleteTodo(id: string): Promise<ApiSuccessResponse<DeleteTodoResponse>>;
  updateTodoStatus(id: string, data: UpdateTodoStatusRequest): Promise<ApiSuccessResponse<UpdateTodoStatusResponse>>;
}
```

---

## 6. API 서비스 구현 예시

### 6.1 API 클라이언트 기본 구조
```typescript
import axios, { AxiosInstance } from 'axios';

class TodoApiClient implements ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 인증 토큰 설정
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Auth API
  async signup(data: SignupRequest): Promise<ApiSuccessResponse<SignupResponse>> {
    const response = await this.client.post('/auth/signup', data);
    return response.data;
  }

  async signin(data: SigninRequest): Promise<ApiSuccessResponse<SignupResponse>> {
    const response = await this.client.post('/auth/signin', data);
    return response.data;
  }

  // Todo API
  async getTodos(params?: TodoListParams): Promise<ApiSuccessResponse<TodoListResponse>> {
    const response = await this.client.get('/todos', { params });
    return response.data;
  }

  async createTodo(data: CreateTodoRequest): Promise<ApiSuccessResponse<CreateTodoResponse>> {
    const response = await this.client.post('/todos', data);
    return response.data;
  }

  // ... 기타 메서드들
}

export const apiClient = new TodoApiClient(process.env.NEXT_PUBLIC_API_URL!);
```

### 6.2 React Query 통합
```typescript
// Query Keys
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (params: TodoListParams) => [...todoKeys.lists(), params] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
  stats: () => [...todoKeys.all, 'stats'] as const
};

// Custom Hooks
export const useTodosQuery = (params: TodoListParams) => {
  return useQuery({
    queryKey: todoKeys.list(params),
    queryFn: () => apiClient.getTodos(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTodoMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: apiClient.createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    }
  });
};
```