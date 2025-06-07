# ToDo 앱 기술 설계 문서

## 개요
이 문서는 ToDo 애플리케이션의 기술적 설계와 아키텍처를 정의합니다.

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처
```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 (브라우저)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                          │
│                     (Vercel 호스팅)                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                               │
│                  (인증, 라우팅, 제한)                          │
└──────────┬────────────────┴──────────────┬──────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐        ┌──────────────────────┐
│   Lambda Functions   │        │      Cognito         │
│   (비즈니스 로직)     │        │   (사용자 인증)       │
└──────────┬───────────┘        └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│     DynamoDB         │
│   (데이터 저장소)     │
└──────────────────────┘
```

### 1.2 모노리포 구조
```
ToDoList/
├── packages/
│   ├── frontend/          # Next.js 애플리케이션
│   ├── backend/           # Lambda 함수들
│   ├── shared/            # 공통 타입 및 유틸리티
│   └── infrastructure/    # AWS CDK 인프라 코드
├── docs/                  # 프로젝트 문서
├── .github/              # GitHub Actions 워크플로우
├── .husky/               # Git hooks
├── pnpm-workspace.yaml   # pnpm 워크스페이스 설정
└── package.json          # 루트 패키지 설정
```

---

## 2. 기술 스택

### 2.1 프론트엔드
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript 5.x
- **스타일링**: Tailwind CSS 3.x
- **상태관리**: Zustand
- **폼 관리**: React Hook Form + Zod
- **API 클라이언트**: TanStack Query v5
- **UI 컴포넌트**: shadcn/ui
- **테스트**: Vitest, Testing Library

### 2.2 백엔드
- **런타임**: Node.js 20.x (AWS Lambda)
- **언어**: TypeScript
- **API**: REST API (API Gateway)
- **인증**: AWS Cognito
- **데이터베이스**: DynamoDB
- **IaC**: AWS CDK v2

### 2.3 개발 도구
- **패키지 매니저**: pnpm 8.x
- **린터**: ESLint
- **포매터**: Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions

---

## 3. 데이터 모델

### 3.1 DynamoDB 테이블 설계

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

### 3.2 인덱스 전략
- **Global Secondary Index (GSI)**
  - GSI1: email (Users 테이블에서 이메일로 사용자 조회)
  
---

## 4. API 설계

### 4.1 인증 엔드포인트
```
POST   /auth/signup      # 회원가입
POST   /auth/signin      # 로그인
POST   /auth/signout     # 로그아웃
POST   /auth/refresh     # 토큰 갱신
GET    /auth/me          # 현재 사용자 정보
```

### 4.2 ToDo CRUD 엔드포인트
```
GET    /todos            # ToDo 목록 조회 (필터링, 페이징)
POST   /todos            # ToDo 생성
GET    /todos/{id}       # ToDo 상세 조회
PUT    /todos/{id}       # ToDo 수정
DELETE /todos/{id}       # ToDo 삭제
PATCH  /todos/{id}/status # 상태 변경
```

### 4.3 API 응답 형식
```typescript
// 성공 응답
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    limit?: number,
    total?: number
  }
}

// 에러 응답
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

---

## 5. 보안 설계

### 5.1 인증 및 인가
- JWT 토큰 기반 인증 (Cognito 발급)
- Access Token: 15분 유효
- Refresh Token: 30일 유효
- 모든 API 요청에 Authorization 헤더 필수

### 5.2 보안 정책
- HTTPS 전용 통신
- CORS 화이트리스트 설정
- API Rate Limiting (분당 100회)
- SQL Injection 방지 (DynamoDB 사용)
- XSS 방지 (React 자동 이스케이핑)
- CSRF 방지 (SameSite 쿠키)

---

## 6. 프론트엔드 설계

### 6.1 디렉토리 구조
```
packages/frontend/src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 메인 대시보드
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   └── features/         # 기능별 컴포넌트
├── hooks/                # Custom React Hooks
├── lib/                  # 유틸리티 함수
├── services/             # API 서비스
├── store/                # Zustand 스토어
└── types/                # TypeScript 타입 정의
```

### 6.2 상태 관리
```typescript
// Zustand Store 구조
interface AppStore {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  
  // Todos
  todos: Todo[];
  filter: TodoFilter;
  
  // Actions
  setUser: (user: User | null) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  setFilter: (filter: TodoFilter) => void;
}
```

---

## 7. 백엔드 설계

### 7.1 Lambda 함수 구조
```
packages/backend/src/
├── handlers/              # Lambda 핸들러
│   ├── auth/
│   └── todos/
├── services/             # 비즈니스 로직
│   ├── auth.service.ts
│   └── todo.service.ts
├── repositories/         # 데이터 접근 계층
│   ├── user.repository.ts
│   └── todo.repository.ts
├── utils/               # 유틸리티
└── types/               # 타입 정의
```

### 7.2 에러 처리
```typescript
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
  }
}

// 사용 예시
throw new AppError(404, 'TODO_NOT_FOUND', 'Todo item not found');
```

---

## 8. 인프라 설계 (AWS CDK)

### 8.1 스택 구성
```typescript
// 메인 스택
export class TodoAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // Cognito User Pool
    const userPool = new UserPool(this, 'UserPool', {
      selfSignUpEnabled: true,
      signInAliases: { email: true }
    });
    
    // DynamoDB Tables
    const userTable = new Table(this, 'UserTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING }
    });
    
    // Lambda Functions
    const todoHandler = new NodejsFunction(this, 'TodoHandler', {
      entry: 'packages/backend/src/handlers/todos/index.ts',
      runtime: Runtime.NODEJS_20_X
    });
    
    // API Gateway
    const api = new RestApi(this, 'TodoApi', {
      cors: { /* CORS 설정 */ }
    });
  }
}
```

---

## 9. CI/CD 파이프라인

### 9.1 GitHub Actions 워크플로우

#### PR 검증 워크플로우
```yaml
name: PR Validation
on: pull_request

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup pnpm
      - Install dependencies
      - Lint check
      - Type check
      - Unit tests
      - Build validation
```

#### 배포 워크플로우
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout
      - Setup
      - Test
      - Deploy frontend to Vercel
      - Deploy backend via CDK
      - Notify deployment status
```

### 9.2 Git Hooks (Husky)
- **pre-commit**: 
  - ESLint 자동 수정
  - Prettier 포매팅
  - 스테이지된 파일만 처리 (lint-staged)
  
- **pre-push**:
  - 타입 체크
  - 유닛 테스트
  - 빌드 검증

---

## 10. 성능 최적화

### 10.1 프론트엔드 최적화
- Next.js 이미지 최적화
- 코드 스플리팅
- 동적 임포트
- React Query 캐싱
- Tailwind CSS 퍼지

### 10.2 백엔드 최적화
- Lambda 콜드 스타트 최소화
- DynamoDB 읽기/쓰기 용량 최적화
- API Gateway 캐싱
- 배치 작업 처리

---

## 11. 모니터링 및 로깅

### 11.1 모니터링
- CloudWatch 대시보드
- Lambda 함수 메트릭
- API Gateway 메트릭
- DynamoDB 메트릭

### 11.2 로깅
- 구조화된 JSON 로깅
- 로그 레벨 관리
- CloudWatch Logs Insights

---

## 12. 개발 가이드라인

### 12.1 코드 스타일
- ESLint + Prettier 설정 준수
- TypeScript strict mode
- 함수형 프로그래밍 선호
- 명확한 변수/함수명

### 12.2 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포매팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 등 기타 변경
```

### 12.3 브랜치 전략
- main: 프로덕션 배포
- develop: 개발 통합
- feature/*: 기능 개발
- hotfix/*: 긴급 수정