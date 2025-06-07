# ToDo 앱 기술 설계 개요

## 개요
이 문서는 ToDo 애플리케이션의 전체적인 아키텍처와 기술 설계 개요를 정의합니다.

---

## 문서 구조

이 프로젝트의 설계 문서는 작업 관련성을 고려하여 다음과 같이 분리되어 있습니다:

- **design-overview.md** (이 문서): 전체 시스템 아키텍처 및 개요
- **api-design.md**: API 설계 및 데이터 모델
- **frontend-design.md**: 프론트엔드 컴포넌트 및 상태 관리
- **backend-design.md**: 백엔드 Lambda 함수 및 서비스 구조
- **deployment.md**: 환경 설정, 배포 및 인프라 구성
- **validation.md**: 에러 처리 및 검증 규칙

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처
```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#1f2937', 'primaryTextColor':'#f3f4f6', 'primaryBorderColor':'#6b7280', 'lineColor':'#9ca3af', 'secondaryColor':'#374151', 'tertiaryColor':'#4b5563', 'background':'#111827', 'mainBkg':'#1f2937', 'secondBkg':'#374151', 'tertiaryBkg':'#4b5563', 'textColor':'#f3f4f6', 'labelTextColor':'#f3f4f6', 'nodeTextColor':'#f3f4f6', 'edgeLabelBackground':'#374151'}}}%%
graph TB
    User[사용자 브라우저]
    Frontend[Next.js Frontend<br/>Vercel 호스팅]
    APIGateway[API Gateway<br/>인증, 라우팅, 제한]
    Lambda[Lambda Functions<br/>비즈니스 로직]
    Cognito[AWS Cognito<br/>사용자 인증]
    DynamoDB[DynamoDB<br/>데이터 저장소]
    
    User -->|HTTPS| Frontend
    Frontend -->|HTTPS/REST API| APIGateway
    APIGateway --> Lambda
    APIGateway --> Cognito
    Lambda --> DynamoDB
    
    classDef userClass fill:#374151,stroke:#9ca3af,stroke-width:2px,color:#f3f4f6
    classDef frontendClass fill:#065f46,stroke:#10b981,stroke-width:2px,color:#f3f4f6
    classDef apiClass fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#f3f4f6
    classDef lambdaClass fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f3f4f6
    classDef authClass fill:#7c2d12,stroke:#f87171,stroke-width:2px,color:#f3f4f6
    classDef dbClass fill:#4c1d95,stroke:#a78bfa,stroke-width:2px,color:#f3f4f6
    
    class User userClass
    class Frontend frontendClass
    class APIGateway apiClass
    class Lambda lambdaClass
    class Cognito authClass
    class DynamoDB dbClass
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
│   ├── design-overview.md # 전체 아키텍처 개요
│   ├── api-design.md      # API 설계
│   ├── frontend-design.md # 프론트엔드 설계
│   ├── backend-design.md  # 백엔드 설계
│   ├── deployment.md      # 배포 및 환경 설정
│   └── validation.md      # 에러 처리 및 검증
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

## 3. 데이터 흐름도
```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#1f2937', 'primaryTextColor':'#f3f4f6', 'primaryBorderColor':'#6b7280', 'lineColor':'#9ca3af', 'secondaryColor':'#374151', 'background':'#111827', 'mainBkg':'#1f2937', 'actorBkg':'#374151', 'actorBorder':'#6b7280', 'actorTextColor':'#f3f4f6', 'signalColor':'#9ca3af', 'signalTextColor':'#f3f4f6', 'noteBkgColor':'#374151', 'noteTextColor':'#f3f4f6', 'noteBorderColor':'#6b7280', 'labelBoxBkgColor':'#374151', 'labelTextColor':'#f3f4f6', 'loopTextColor':'#f3f4f6'}}}%%
sequenceDiagram
    participant User as 사용자
    participant Frontend as Frontend
    participant API as API Gateway
    participant Lambda as Lambda
    participant Cognito as Cognito
    participant DB as DynamoDB
    
    Note over User,DB: 사용자 인증 흐름
    User->>Frontend: 로그인 요청
    Frontend->>API: POST /auth/signin
    API->>Cognito: 인증 확인
    Cognito-->>API: JWT 토큰
    API-->>Frontend: 토큰 반환
    Frontend-->>User: 로그인 성공
    
    Note over User,DB: ToDo 생성 흐름
    User->>Frontend: ToDo 생성
    Frontend->>API: POST /todos
    API->>Lambda: 토큰 검증
    Lambda->>DB: ToDo 저장
    DB-->>Lambda: 저장 완료
    Lambda-->>API: 응답
    API-->>Frontend: ToDo 생성 완료
    Frontend-->>User: UI 업데이트
```

---

## 4. 보안 설계

### 4.1 인증 및 인가
- JWT 토큰 기반 인증 (Cognito 발급)
- Access Token: 15분 유효
- Refresh Token: 30일 유효
- 모든 API 요청에 Authorization 헤더 필수

### 4.2 보안 정책
- HTTPS 전용 통신
- CORS 화이트리스트 설정
- API Rate Limiting (분당 100회)
- SQL Injection 방지 (DynamoDB 사용)
- XSS 방지 (React 자동 이스케이핑)
- CSRF 방지 (SameSite 쿠키)

---

## 5. CI/CD 파이프라인

```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#1f2937', 'primaryTextColor':'#f3f4f6', 'primaryBorderColor':'#6b7280', 'lineColor':'#9ca3af', 'secondaryColor':'#374151', 'tertiaryColor':'#4b5563', 'background':'#111827', 'mainBkg':'#1f2937', 'secondBkg':'#374151', 'clusterBkg':'#1f2937', 'clusterBorder':'#6b7280', 'textColor':'#f3f4f6', 'edgeLabelBackground':'#374151'}}}%%
graph LR
    subgraph "Pull Request 워크플로우"
        PR[Pull Request] --> Validate[검증 작업]
        Validate --> Checkout[코드 체크아웃]
        Checkout --> Setup[pnpm 설정]
        Setup --> Install[의존성 설치]
        Install --> Lint[린트 검사]
        Install --> Type[타입 검사]
        Install --> Test[유닛 테스트]
        Install --> Build[빌드 검증]
    end
    
    subgraph "배포 워크플로우"
        Push[main 브랜치 Push] --> Deploy[배포 작업]
        Deploy --> CheckoutD[코드 체크아웃]
        CheckoutD --> SetupD[환경 설정]
        SetupD --> TestD[테스트 실행]
        TestD --> FrontDeploy[Frontend 배포<br/>Vercel]
        TestD --> BackDeploy[Backend 배포<br/>AWS CDK]
        FrontDeploy --> Notify[배포 알림]
        BackDeploy --> Notify
    end
    
    classDef prClass fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px,color:#f3f4f6
    classDef pushClass fill:#065f46,stroke:#10b981,stroke-width:2px,color:#f3f4f6
    classDef notifyClass fill:#78350f,stroke:#f59e0b,stroke-width:2px,color:#f3f4f6
    classDef defaultClass fill:#374151,stroke:#6b7280,stroke-width:1px,color:#f3f4f6
    
    class PR prClass
    class Push pushClass
    class Notify notifyClass
    class Validate,Checkout,Setup,Install,Lint,Type,Test,Build,Deploy,CheckoutD,SetupD,TestD,FrontDeploy,BackDeploy defaultClass
```

---

## 6. 성능 최적화

### 6.1 프론트엔드 최적화
- Next.js 이미지 최적화
- 코드 스플리팅
- 동적 임포트
- React Query 캐싱
- Tailwind CSS 퍼지

### 6.2 백엔드 최적화
- Lambda 콜드 스타트 최소화
- DynamoDB 읽기/쓰기 용량 최적화
- API Gateway 캐싱
- 배치 작업 처리

---

## 7. 모니터링 및 로깅

### 7.1 모니터링
- CloudWatch 대시보드
- Lambda 함수 메트릭
- API Gateway 메트릭
- DynamoDB 메트릭

### 7.2 로깅
- 구조화된 JSON 로깅
- 로그 레벨 관리
- CloudWatch Logs Insights

---

## 8. UI 디자인 와이어프레임

모바일 중심의 UI 디자인으로 iPhone 화면 크기(375x812)를 기준으로 설계했습니다.

### 8.1 로그인 페이지
<img src="wireframes/login-page.svg" alt="로그인 페이지 와이어프레임" width="300" />

사용자 인증을 위한 간단하고 직관적인 로그인 화면입니다.

### 8.2 ToDo 목록 페이지
<img src="wireframes/todo-list-page.svg" alt="ToDo 목록 페이지 와이어프레임" width="300" />

할 일 목록을 확인하고 관리할 수 있는 메인 화면입니다. 우선순위별 색상 구분과 상태별 필터링 기능을 제공합니다.

### 8.3 ToDo 추가/편집 모달
<img src="wireframes/todo-modal.svg" alt="ToDo 추가/편집 모달 와이어프레임" width="300" />

새로운 할 일을 추가하거나 기존 할 일을 편집할 수 있는 모달 화면입니다.

### 8.4 통계 페이지
<img src="wireframes/statistics-page.svg" alt="통계 페이지 와이어프레임" width="300" />

할 일 완료율과 진행 상황을 시각적으로 확인할 수 있는 통계 화면입니다.

---

## 9. 개발 가이드라인

### 9.1 코드 스타일
- ESLint + Prettier 설정 준수
- TypeScript strict mode
- 함수형 프로그래밍 선호
- 명확한 변수/함수명

### 9.2 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포매팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 등 기타 변경
```

### 9.3 브랜치 전략
- main: 프로덕션 배포
- develop: 개발 통합
- feature/*: 기능 개발
- hotfix/*: 긴급 수정