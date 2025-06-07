# docs Folder

이 폴더는 ToDo Vibe Coding 프로젝트의 모든 문서와 기록을 포함합니다.

## 📋 프로젝트 기획 및 요구사항
- **[prd.md](./prd.md)**: Product Requirements Document - 프로젝트 요구사항 정의
- **[tutorial.md](./tutorial.md)**: Vibe Coding 방법론을 활용한 프로젝트 진행 과정 튜토리얼
- **[chat.md](./chat.md)**: 주요 대화 내용과 결정사항 기록

## 🏗️ 기술 설계 문서
**[design/](./design/)** - 기술 설계 관련 모든 문서가 포함된 폴더
- **[design-overview.md](./design/design-overview.md)**: 전체 시스템 아키텍처 및 기술 스택 개요
- **[api-design.md](./design/api-design.md)**: API 설계 및 데이터 모델
- **[frontend-design.md](./design/frontend-design.md)**: 프론트엔드 컴포넌트 및 상태 관리
- **[backend-design.md](./design/backend-design.md)**: 백엔드 Lambda 함수 및 서비스 구조
- **[deployment.md](./design/deployment.md)**: 환경 설정, 배포 및 인프라 구성
- **[validation.md](./design/validation.md)**: 에러 처리 및 검증 규칙
- **[wireframes/](./design/wireframes/)**: UI 와이어프레임 SVG 파일들

## 📚 과거 기록 (GPT-4.1 버전)
**[gpt4.1/](./gpt4.1/)** - 이전 버전의 프로젝트 기록
- **[prd.md](./gpt4.1/prd.md)**: 초기 PRD 질문들
- **[chat.md](./gpt4.1/chat.md)**: 초기 대화 기록
- **[tutorial.md](./gpt4.1/tutorial.md)**: 초기 튜토리얼 문서


---

## 문서 사용 가이드

### 🎯 목적별 문서 참조

| 목적 | 참조할 문서 |
|------|------------|
| 프로젝트 전체 이해 | `prd.md` → `design/design-overview.md` |
| 개발 환경 설정 | `design/deployment.md` |
| API 구현 | `design/api-design.md` + `design/backend-design.md` |
| 프론트엔드 구현 | `design/frontend-design.md` + `design/api-design.md` |
| 에러 처리 구현 | `design/validation.md` |
| UI 디자인 참고 | `design/wireframes/` |

### 🔄 문서 업데이트 워크플로우

1. **기획 변경** → `prd.md` 업데이트
2. **아키텍처 변경** → `design/design-overview.md` 업데이트
3. **기능 구현** → 해당 영역의 design 문서 업데이트
4. **진행 과정 기록** → `tutorial.md` + `chat.md` 업데이트

