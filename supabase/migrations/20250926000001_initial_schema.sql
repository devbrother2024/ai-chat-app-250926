-- 채팅 세션 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_streaming BOOLEAN DEFAULT FALSE,
    session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- MCP 함수 호출 정보 테이블
CREATE TABLE IF NOT EXISTS function_calls (
    id SERIAL PRIMARY KEY,
    message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    arguments JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MCP 함수 응답 정보 테이블  
CREATE TABLE IF NOT EXISTS function_responses (
    id SERIAL PRIMARY KEY,
    message_id TEXT REFERENCES messages(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- MCP 서버 테이블
CREATE TABLE IF NOT EXISTS mcp_servers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    transport TEXT NOT NULL CHECK (transport IN ('stdio', 'http')),
    -- stdio transport 필드
    command TEXT,
    args TEXT[], -- PostgreSQL 배열 타입
    env JSONB,
    -- http transport 필드
    url TEXT,
    headers JSONB,
    -- 공통 필드
    enabled BOOLEAN DEFAULT TRUE,
    connected BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'connecting')),
    last_connected TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_function_calls_message_id ON function_calls(message_id);
CREATE INDEX IF NOT EXISTS idx_function_responses_message_id ON function_responses(message_id);

CREATE INDEX IF NOT EXISTS idx_mcp_servers_user_id ON mcp_servers(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_enabled ON mcp_servers(enabled);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE OR REPLACE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_mcp_servers_updated_at 
    BEFORE UPDATE ON mcp_servers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE function_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY "Users can only access their own chat sessions" ON chat_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own messages" ON messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access function calls for their messages" ON function_calls
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = function_calls.message_id 
            AND messages.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access function responses for their messages" ON function_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM messages 
            WHERE messages.id = function_responses.message_id 
            AND messages.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only access their own MCP servers" ON mcp_servers
    FOR ALL USING (auth.uid() = user_id);
