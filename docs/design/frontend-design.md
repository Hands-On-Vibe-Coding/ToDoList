# 프론트엔드 설계

## 개요
이 문서는 Next.js 기반 프론트엔드 애플리케이션의 컴포넌트 구조, 상태 관리, 그리고 UI 구현 가이드를 정의합니다.

---

## 1. 디렉토리 구조

```
packages/frontend/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/       # 메인 대시보드
│   │   ├── page.tsx       # ToDo 목록
│   │   ├── stats/
│   │   └── layout.tsx
│   ├── globals.css
│   └── layout.tsx         # 루트 레이아웃
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── features/         # 기능별 컴포넌트
│   │   ├── auth/
│   │   ├── todo/
│   │   └── stats/
│   └── layout/           # 레이아웃 컴포넌트
│       ├── Header.tsx
│       └── BottomNav.tsx
├── hooks/                # Custom React Hooks
│   ├── useAuth.ts
│   ├── useTodos.ts
│   └── useValidatedForm.ts
├── lib/                  # 유틸리티 함수
│   ├── apiClient.ts
│   ├── tokenStorage.ts
│   └── utils.ts
├── services/             # API 서비스
│   ├── authService.ts
│   └── todoService.ts
├── store/                # Zustand 스토어
│   ├── authStore.ts
│   ├── todoStore.ts
│   └── uiStore.ts
└── types/                # TypeScript 타입 정의
    ├── auth.ts
    ├── todo.ts
    └── ui.ts
```

---

## 2. 컴포넌트 구조 및 Props 정의

### 2.1 페이지 컴포넌트

**로그인 페이지 (`app/(auth)/login/page.tsx`)**
```typescript
interface LoginPageProps {}

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC<LoginPageProps> = () => {
  const { login, isLoading, error } = useAuthStore();
  const router = useRouter();
  
  const form = useValidatedForm({
    schema: loginSchema,
    defaultValues: { email: '', password: '' }
  });

  const handleSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      router.push('/');
    } catch (error) {
      // 에러는 store에서 처리됨
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        {/* 로그인 폼 구현 */}
      </form>
    </div>
  );
};
```

**ToDo 목록 페이지 (`app/(dashboard)/page.tsx`)**
```typescript
interface TodoListPageProps {}

const TodoListPage: React.FC<TodoListPageProps> = () => {
  const { todos, filter, isLoading, fetchTodos, setFilter } = useTodoStore();
  const { isTodoModalOpen, openTodoModal } = useUIStore();

  useEffect(() => {
    fetchTodos();
  }, [filter]);

  return (
    <div className="container mx-auto px-4 py-6">
      <TodoFilter 
        currentFilter={filter}
        onFilterChange={setFilter}
        counts={{ /* ... */ }}
      />
      <TodoList 
        todos={todos}
        loading={isLoading}
        onTodoUpdate={/* ... */}
        onTodoDelete={/* ... */}
      />
      <Button 
        onClick={() => openTodoModal()}
        className="fixed bottom-20 right-4"
      >
        +
      </Button>
      {isTodoModalOpen && <TodoModal />}
    </div>
  );
};
```

### 2.2 레이아웃 컴포넌트

**루트 레이아웃 (`app/layout.tsx`)**
```typescript
interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
          <Toaster />
        </QueryClientProvider>
      </body>
    </html>
  );
};
```

**대시보드 레이아웃 (`app/(dashboard)/layout.tsx`)**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuthStore();
  
  return (
    <div className="min-h-screen">
      <Header 
        title="My ToDo"
        user={user}
        onLogout={() => {/* ... */}}
      />
      <main className="pb-20">
        {children}
      </main>
      <BottomNav currentPath="/" />
    </div>
  );
};
```

### 2.3 UI 컴포넌트

**버튼 컴포넌트 (`components/ui/Button.tsx`)**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    (disabled || loading) && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
          {/* 로딩 스피너 SVG */}
        </svg>
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
```

**입력 필드 컴포넌트 (`components/ui/Input.tsx`)**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  variant = 'default',
  className,
  ...props
}) => {
  const inputId = useId();
  
  const baseClasses = 'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500';
  const errorClasses = error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : '';
  
  const variantClasses = {
    default: 'bg-white',
    filled: 'bg-gray-50',
    outline: 'bg-transparent border-2'
  };

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            baseClasses,
            variantClasses[variant],
            errorClasses,
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};
```

### 2.4 기능별 컴포넌트

**Todo 아이템 컴포넌트 (`components/features/todo/TodoItem.tsx`)**
```typescript
interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (id: string) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Todo['status']) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggleComplete,
  onEdit,
  onDelete,
  onStatusChange
}) => {
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500'
  };

  const statusIcons = {
    pending: <Circle className="w-4 h-4" />,
    'in-progress': <Clock className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4 text-green-600" />
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border-l-4 p-4 shadow-sm',
      priorityColors[todo.priority],
      todo.status === 'completed' && 'opacity-60'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <button
            onClick={() => onToggleComplete(todo.id)}
            className="mt-1"
          >
            {statusIcons[todo.status]}
          </button>
          <div className="flex-1">
            <h3 className={cn(
              'font-medium text-gray-900',
              todo.status === 'completed' && 'line-through text-gray-500'
            )}>
              {todo.title}
            </h3>
            {todo.description && (
              <p className="text-sm text-gray-600 mt-1">
                {todo.description}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-2">
              <span className={cn(
                'px-2 py-1 text-xs rounded-full',
                {
                  'bg-red-100 text-red-800': todo.priority === 'high',
                  'bg-yellow-100 text-yellow-800': todo.priority === 'medium',
                  'bg-green-100 text-green-800': todo.priority === 'low'
                }
              )}>
                {todo.priority}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onEdit(todo)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Todo 폼 컴포넌트 (`components/features/todo/TodoForm.tsx`)**
```typescript
interface TodoFormProps {
  todo?: Todo;
  onSubmit: (data: TodoFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface TodoFormData {
  title: string;
  description?: string;
  priority: Todo['priority'];
}

const TodoForm: React.FC<TodoFormProps> = ({
  todo,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const form = useValidatedForm({
    schema: todoFormSchema,
    defaultValues: {
      title: todo?.title || '',
      description: todo?.description || '',
      priority: todo?.priority || 'medium'
    }
  });

  const priorityOptions = [
    { value: 'high', label: '높음', color: 'bg-red-100 text-red-800' },
    { value: 'medium', label: '중간', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'low', label: '낮음', color: 'bg-green-100 text-green-800' }
  ];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="제목"
        error={form.getFieldError('title')}
        {...form.register('title')}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          설명 (선택사항)
        </label>
        <textarea
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          {...form.register('description')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          우선순위
        </label>
        <div className="grid grid-cols-3 gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => form.setValue('priority', option.value as Todo['priority'])}
              className={cn(
                'p-2 rounded-md text-sm font-medium transition-colors',
                form.watch('priority') === option.value
                  ? option.color
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          취소
        </Button>
        <Button
          type="submit"
          loading={loading}
          className="flex-1"
        >
          {todo ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  );
};
```

---

## 3. 상태 관리

### 3.1 Zustand Store 구조

**인증 Store (`store/authStore.ts`)**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  signup: (userData: SignupData) => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

type AuthStore = AuthState & AuthActions;

const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      const { user, tokens } = response.data;
      
      tokenStorage.setTokens(tokens);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error.message,
        isAuthenticated: false,
        user: null
      });
      throw error;
    }
  },

  logout: () => {
    tokenStorage.clearTokens();
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },

  // ... 기타 메서드들
}));
```

**UI Store (`store/uiStore.ts`)**
```typescript
interface UIState {
  isTodoModalOpen: boolean;
  isDeleteConfirmModalOpen: boolean;
  isGlobalLoading: boolean;
  notifications: Notification[];
  theme: 'light' | 'dark' | 'system';
  isMobileMenuOpen: boolean;
}

interface UIActions {
  openTodoModal: (todo?: Todo) => void;
  closeTodoModal: () => void;
  openDeleteConfirmModal: (todoId: string) => void;
  closeDeleteConfirmModal: () => void;
  setGlobalLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleMobileMenu: () => void;
}

const useUIStore = create<UIStore>((set, get) => ({
  // State
  isTodoModalOpen: false,
  isDeleteConfirmModalOpen: false,
  isGlobalLoading: false,
  notifications: [],
  theme: 'system',
  isMobileMenuOpen: false,

  // Actions
  openTodoModal: (todo) => {
    if (todo) {
      useTodoStore.getState().setSelectedTodo(todo);
    }
    set({ isTodoModalOpen: true });
  },

  addNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    };
    
    set(state => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  // ... 기타 메서드들
}));
```

### 3.2 Custom Hooks

**인증 훅 (`hooks/useAuth.ts`)**
```typescript
export const useAuth = () => {
  const store = useAuthStore();
  const router = useRouter();

  const loginWithRedirect = async (credentials: LoginCredentials) => {
    await store.login(credentials);
    router.push('/');
  };

  const logoutWithRedirect = () => {
    store.logout();
    router.push('/login');
  };

  return {
    ...store,
    loginWithRedirect,
    logoutWithRedirect
  };
};
```

**Todo 훅 (`hooks/useTodos.ts`)**
```typescript
export const useTodos = () => {
  const store = useTodoStore();
  const { addNotification } = useUIStore();

  const createTodoWithNotification = async (data: CreateTodoRequest) => {
    try {
      await store.createTodo(data);
      addNotification({
        type: 'success',
        title: 'Todo 생성 완료',
        message: `"${data.title}"이 생성되었습니다.`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Todo 생성 실패',
        message: error.message
      });
    }
  };

  return {
    ...store,
    createTodoWithNotification
  };
};
```

---

## 4. 유틸리티 및 헬퍼

### 4.1 클래스명 유틸리티 (`lib/utils.ts`)
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true,
    locale: ko 
  });
}
```

### 4.2 토큰 저장소 (`lib/tokenStorage.ts`)
```typescript
const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
} as const;

export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  setTokens: (tokens: { accessToken: string; refreshToken: string }) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  },

  setAccessToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
  },

  clearTokens: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
  }
};
```