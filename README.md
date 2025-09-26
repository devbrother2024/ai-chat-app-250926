# AI Chat App with MCP Support

AI 모델과 MCP(Model Context Protocol) 서버를 통합한 채팅 애플리케이션입니다. 이 프로젝트는 [Next.js](https://nextjs.org)를 기반으로 구축되었습니다.

## 주요 기능

### 🔐 사용자 인증 (Supabase Auth)

-   **이메일 회원가입/로그인**: 안전한 이메일 기반 인증
-   **세션 관리**: 자동 세션 유지 및 갱신
-   **보안**: JWT 토큰 기반 인증으로 안전한 사용자 관리
-   **인증 보호**: 인증된 사용자만 채팅 서비스에 접근 가능

### 🤖 AI 채팅

-   **스트리밍 응답**: 실시간으로 AI 응답을 받아볼 수 있습니다
-   **채팅 세션 관리**: 여러 채팅 세션을 저장하고 관리할 수 있습니다
-   **마크다운 지원**: 코드 블록, 표, 링크 등을 포함한 마크다운 렌더링
-   **로컬 저장소**: 채팅 기록을 브라우저에 안전하게 저장

### 🔌 MCP (Model Context Protocol) 지원

-   **서버 관리**: MCP 서버를 등록, 수정, 삭제할 수 있습니다
-   **실시간 연결**: 서버와 실시간으로 연결/해제할 수 있습니다
-   **템플릿 제공**: File System, SQLite, Git, Browser 등 사전 정의된 템플릿
-   **도구 실행**: 연결된 서버의 도구를 직접 실행하고 결과를 확인
-   **리소스 관리**: 서버가 제공하는 리소스와 프롬프트 조회

## 시작하기

### 환경 설정

1. 환경 변수 설정:

```bash
cp .env.example .env.local
```

2. Supabase 프로젝트 생성 및 설정:

    - [Supabase](https://app.supabase.com)에서 새 프로젝트 생성
    - 프로젝트 설정 > API에서 URL과 anon key 복사
    - 이메일 인증 활성화 (Authentication > Settings)

3. 환경 변수 설정:

```bash
# .env.local 파일에 추가
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 개발 서버 실행

```bash
# 패키지 설치
pnpm install

# 개발 서버 시작
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

### MCP 서버 설정

1. 상단 헤더의 서버 아이콘을 클릭하여 MCP 서버 관리 페이지로 이동
2. "서버 추가" 버튼을 클릭하여 새 MCP 서버 등록
3. 템플릿을 선택하거나 직접 설정하여 서버 구성
4. 서버 활성화 후 연결 버튼을 클릭하여 **실제 MCP 서버에 연결**

### 실제 MCP 서버 연결

현재 애플리케이션은 **실제 MCP 서버**와 연결하도록 구성되어 있습니다:

-   **브라우저**: API 호출을 통해 서버와 통신
-   **서버 사이드**: 실제 MCP TypeScript SDK 사용
-   **리소스 읽기**: 실제 MCP 서버의 리소스 내용 표시
-   **도구 실행**: 실제 MCP 도구 실행 및 결과 반환

### 지원하는 연결 방식

#### stdio Transport (프로세스 기반)

로컬에서 실행되는 MCP 서버와 프로세스를 통해 연결:

```bash
# 예시: 파일 시스템 MCP 서버
npx @modelcontextprotocol/server-filesystem /path/to/directory

# 예시: Git MCP 서버
npx @modelcontextprotocol/server-git /path/to/git/repo
```

#### HTTP Transport (웹 서버 기반)

StreamableHTTP를 통해 원격 MCP 서버와 연결:

```
# 예시: Smithery.ai HTTP MCP 서버
https://server.smithery.ai/@devbrother2024/typescript-mcp-server-boilerplate/mcp

# 예시: 커스텀 HTTP MCP 서버
https://your-mcp-server.com/mcp
```

## 기술 스택

-   **Frontend**: Next.js 15, React 19, TypeScript
-   **UI**: Tailwind CSS, shadcn/ui
-   **Authentication**: Supabase Auth
-   **MCP**: @modelcontextprotocol/sdk
-   **AI**: Gemini API
-   **Storage**: localStorage (MVP)

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
