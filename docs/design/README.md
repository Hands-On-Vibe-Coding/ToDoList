# 기술 설계 문서

이 폴더는 ToDo 애플리케이션의 기술 설계 문서들을 포함합니다. 각 문서는 작업 관련성을 고려하여 분리되어 있어 개발자나 AI 모델이 특정 작업 수행 시 필요한 문서만 참조할 수 있습니다.

## 문서 구조

### 🏗️ 아키텍처 및 개요
- **[design-overview.md](./design-overview.md)**: 전체 시스템 아키텍처, 기술 스택, 데이터 흐름도, CI/CD 파이프라인, UI 와이어프레임

### 🔌 API 및 데이터
- **[api-design.md](./api-design.md)**: API 엔드포인트, 요청/응답 스펙, 데이터 모델, DynamoDB 설계, TypeScript 타입 정의

### 🎨 프론트엔드
- **[frontend-design.md](./frontend-design.md)**: React 컴포넌트 구조, Zustand 상태 관리, Next.js 페이지, UI 컴포넌트, Custom Hooks

### ⚙️ 백엔드
- **[backend-design.md](./backend-design.md)**: Lambda 함수 구현, 서비스 계층, 레포지토리 패턴, 인증 미들웨어, JWT 유틸리티

### 🚀 배포 및 인프라
- **[deployment.md](./deployment.md)**: 환경 변수, 설정 파일, AWS CDK 인프라, GitHub Actions, Docker 개발 환경

### 🛡️ 에러 처리 및 검증
- **[validation.md](./validation.md)**: 클라이언트/서버 에러 처리, Zod 스키마 검증, 재시도 로직, 로깅 시스템

## UI 와이어프레임

### 📱 모바일 UI 설계
`wireframes/` 폴더에는 iPhone 화면 크기(375x812)를 기준으로 한 SVG 와이어프레임이 포함되어 있습니다:

- **[login-page.svg](./wireframes/login-page.svg)**: 로그인 페이지 와이어프레임
- **[todo-list-page.svg](./wireframes/todo-list-page.svg)**: ToDo 목록 메인 페이지
- **[todo-modal.svg](./wireframes/todo-modal.svg)**: ToDo 추가/편집 모달
- **[statistics-page.svg](./wireframes/statistics-page.svg)**: 통계 페이지

## 사용 가이드

### 개발 작업별 참조 문서

| 작업 영역 | 참조할 문서 |
|----------|------------|
| 전체 프로젝트 이해 | `design-overview.md` |
| API 개발 | `api-design.md`, `backend-design.md` |
| 프론트엔드 개발 | `frontend-design.md`, `api-design.md` |
| 인프라 구성 | `deployment.md`, `validation.md` |
| 에러 처리 구현 | `validation.md` |
| UI/UX 참고 | `design-overview.md` + `wireframes/` |

### 문서 업데이트 가이드

1. 아키텍처 변경 시: `design-overview.md` 업데이트
2. API 스펙 변경 시: `api-design.md` 업데이트  
3. 컴포넌트 구조 변경 시: `frontend-design.md` 업데이트
4. 서버 로직 변경 시: `backend-design.md` 업데이트
5. 배포 설정 변경 시: `deployment.md` 업데이트
6. 에러 처리 로직 변경 시: `validation.md` 업데이트

---

## 기술 스택 요약

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend**: AWS Lambda, Node.js 20, TypeScript
- **Database**: DynamoDB
- **Authentication**: AWS Cognito + JWT
- **Infrastructure**: AWS CDK
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (Frontend), AWS (Backend)