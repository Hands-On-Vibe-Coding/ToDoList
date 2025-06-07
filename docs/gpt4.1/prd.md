# ToDo 앱 PRD (제품 요구사항 정의서)

## 목적
이 문서는 Vibe Coding 학습을 위한 풀스택 ToDo 애플리케이션 개발의 요구사항을 명확히 하고 방향성을 제시하기 위해 작성되었습니다.

## 요구사항 명확화를 위한 질문

### 1. 핵심 기능
- ToDo 앱이 반드시 지원해야 하는 핵심 기능은 무엇인가요? (예: 할 일 추가, 수정, 삭제, 완료 등)
- 할 일에 마감일, 우선순위, 태그, 하위 할 일(서브태스크) 등의 기능이 필요하신가요?
- 반복되는 할 일(정기 일정) 기능이 필요한가요?
- 사용자가 할 일의 순서를 직접 변경(드래그 앤 드롭)할 수 있어야 하나요?

### 2. 사용자 관리
- 사용자 인증(회원가입, 로그인, 게스트 모드 등)이 필요한가요?
- 여러 사용자의 프로필을 지원해야 하나요, 아니면 단일 사용자만 사용하나요?
- 소셜 로그인(Google, Apple 등)이 필요하신가요?

### 3. 사용자 경험
- 어떤 플랫폼을 지원해야 하나요? (웹, 모바일, 둘 다 등)
- 접근성(장애인 지원)이나 다국어 지원이 필요하신가요?
- 참고하고 싶은 UI/UX 레퍼런스가 있으신가요?

### 4. 알림 및 리마인더
- 예정된 할 일이나 마감이 지난 할 일에 대한 알림/리마인더 기능이 필요하신가요?
- 어떤 방식(앱 내 알림, 이메일, 푸시 알림 등)으로 알림을 제공해야 하나요?

### 5. Data & Sync
- Should tasks sync across devices?
- Is offline mode required?
- How long should completed/deleted tasks be retained?

### 6. Integrations
- Should the app integrate with external services (calendar, Slack, etc.)?

### 7. Technical Stack & Infrastructure
- Are there preferred frontend/backend frameworks or languages?
- Any database or hosting preferences?
- Should the app be containerized (Docker)?
- Is CI/CD required?
- Are there security or compliance requirements?

### 8. Analytics & Metrics
- Should user activity or task completion rates be tracked?
- Any reporting or export features needed?

### 9. Deployment & Operations
- Where should the app be deployed (cloud provider, on-premises)?
- Who will maintain and monitor the app?

### 10. Future Roadmap
- Are there features planned for future releases?

---

Please review and answer these questions to help define the scope and direction of the ToDo app.
