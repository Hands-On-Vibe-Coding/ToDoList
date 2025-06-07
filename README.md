# 📝 ToDo App - Vibe Coding 프로젝트

**Vibe Coding** 방법론을 활용하여 개발하는 모던 ToDo 애플리케이션입니다.

## 🎯 프로젝트 개요

이 프로젝트는 자연어 기반의 **Vibe Coding** 방법론을 학습하고 실습하기 위한 실전 프로젝트입니다. 전통적인 개발 방식과 달리, 자연어로 소통하며 AI와 협업하여 빠르게 프로토타입을 구축하고 완전한 애플리케이션을 개발합니다.

### ✨ 주요 특징
- 📱 **모바일 퍼스트**: iPhone 화면 크기 기준 반응형 디자인
- 🔐 **보안 인증**: AWS Cognito + JWT 기반 사용자 인증
- ☁️ **서버리스**: AWS Lambda + DynamoDB 기반 확장 가능한 아키텍처
- 🎨 **모던 UI**: Next.js 14 + Tailwind CSS로 구현된 세련된 인터페이스
- 📊 **실시간 상태 관리**: Zustand를 활용한 효율적인 상태 관리
- 🔄 **자동 배포**: GitHub Actions + Vercel/AWS CDK 기반 CI/CD

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **API Client**: TanStack Query v5

### Backend
- **Runtime**: Node.js 20.x (AWS Lambda)
- **Language**: TypeScript
- **API**: REST API (API Gateway)
- **Database**: DynamoDB
- **Authentication**: AWS Cognito
- **Infrastructure**: AWS CDK v2

### DevOps
- **Package Manager**: pnpm 8.x
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + lint-staged
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel (Frontend) + AWS (Backend)

## 🚀 빠른 시작

### 전제 조건
- Node.js 20.x
- pnpm 8.x
- AWS CLI 설정
- Vercel CLI (선택사항)

### 설치 및 실행
```bash
# 저장소 클론
git clone https://github.com/your-username/ToDoList.git
cd ToDoList

# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev
```

### 환경 설정
```bash
# Frontend 환경 변수 설정
cp packages/frontend/.env.example packages/frontend/.env.local

# Backend 환경 변수 설정
cp packages/backend/.env.example packages/backend/.env
```

## 📚 문서 구조

프로젝트 문서는 **작업 관련성**을 고려하여 체계적으로 구성되어 있습니다:

### 📋 기획 및 요구사항
- **[docs/prd.md](docs/prd.md)**: Product Requirements Document
- **[docs/tutorial.md](docs/tutorial.md)**: Vibe Coding 진행 과정
- **[docs/chat.md](docs/chat.md)**: 주요 대화 기록

### 🏗️ 기술 설계
**[docs/design/](docs/design/)** 폴더에 모든 기술 문서가 체계적으로 정리되어 있습니다:

| 문서 | 용도 | 대상 독자 |
|------|------|----------|
| [design-overview.md](docs/design/design-overview.md) | 전체 아키텍처 이해 | 전체 팀 |
| [api-design.md](docs/design/api-design.md) | API 구현 | 백엔드 개발자 |
| [frontend-design.md](docs/design/frontend-design.md) | 프론트엔드 구현 | 프론트엔드 개발자 |
| [backend-design.md](docs/design/backend-design.md) | 서버 로직 구현 | 백엔드 개발자 |
| [deployment.md](docs/design/deployment.md) | 인프라 구성 | DevOps 엔지니어 |
| [validation.md](docs/design/validation.md) | 에러 처리 구현 | 전체 개발자 |

## 🎨 UI/UX 디자인

모바일 퍼스트 접근 방식으로 설계된 직관적인 사용자 인터페이스:

- 🔐 **로그인 페이지**: 간단한 이메일/비밀번호 인증
- 📝 **메인 대시보드**: 할 일 목록 및 필터링
- ➕ **추가/편집 모달**: 직관적인 할 일 작성
- 📊 **통계 페이지**: 진행률 및 생산성 분석

*모든 와이어프레임은 [docs/design/wireframes/](docs/design/wireframes/)에서 확인 가능합니다.*

## 🔥 Vibe Coding 방법론

이 프로젝트는 **Vibe Coding** 방법론의 핵심 원칙을 실천합니다:

### 📝 자연어 기반 개발
- 코드보다 **요구사항과 의도**를 먼저 명확히 정의
- AI와의 **대화를 통한 점진적 구현**
- **문서화 우선** 접근 방식

### 🤝 AI 협업 워크플로우
1. **요구사항 정의** (`prd.md`)
2. **아키텍처 설계** (`design/`)
3. **점진적 구현** (AI와 협업)
4. **지속적 개선** (피드백 반영)

### 🎯 빠른 프로토타이핑
- **MVP 우선** 구현
- **빠른 피드백** 수집
- **점진적 확장**

## 🚧 개발 현황

### ✅ 완료된 작업
- [x] 프로젝트 기획 및 요구사항 정의
- [x] 전체 아키텍처 설계
- [x] API 설계 및 데이터 모델 정의
- [x] 프론트엔드/백엔드 상세 설계
- [x] 인프라 및 배포 설계
- [x] 에러 처리 및 검증 로직 설계
- [x] UI 와이어프레임 작성

### 🔄 진행 중인 작업
- [ ] 프론트엔드 구현 (Next.js 14)
- [ ] 백엔드 API 구현 (AWS Lambda)
- [ ] 인프라 구성 (AWS CDK)
- [ ] 테스트 작성 및 검증

### 📋 예정된 작업
- [ ] 성능 최적화
- [ ] 추가 기능 구현
- [ ] 사용자 피드백 반영
- [ ] 문서화 완성

## 🤝 기여하기

이 프로젝트는 **Vibe Coding** 방법론을 학습하고 실습하기 위한 오픈 소스 프로젝트입니다.

### 기여 방법
1. **이슈 등록**: 새로운 기능 제안이나 버그 리포트
2. **풀 리퀘스트**: 코드 기여
3. **문서 개선**: 튜토리얼 및 가이드 작성
4. **피드백 제공**: 사용 경험 공유

### 개발 환경 설정
```bash
# 개발 의존성 설치
pnpm install

# 린트 및 포맷 검사
pnpm lint
pnpm format

# 테스트 실행
pnpm test

# 빌드 검증
pnpm build
```

## 📞 문의 및 지원

- **이슈**: [GitHub Issues](https://github.com/your-username/ToDoList/issues)
- **토론**: [GitHub Discussions](https://github.com/your-username/ToDoList/discussions)
- **문서**: [프로젝트 문서](docs/)

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<div align="center">

**🎯 Vibe Coding으로 만드는 차세대 웹 애플리케이션**

*자연어와 AI의 협업으로 탄생하는 혁신적인 개발 경험*

</div>
