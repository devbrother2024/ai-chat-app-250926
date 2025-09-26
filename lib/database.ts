import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// 클라이언트 사이드 Supabase 클라이언트 (익명 키 사용)
// RLS 정책으로 사용자별 데이터 보안이 보장됩니다
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 기존 인터페이스 타입 정의 (호환성 유지)
export interface FunctionCall {
    name: string
    arguments: Record<string, unknown>
}

export interface FunctionResponse {
    name: string
    response: unknown
}

export interface Message {
    id: string
    content: string
    sender: 'user' | 'ai'
    timestamp: Date
    isStreaming?: boolean
    functionCalls?: FunctionCall[]
    functionResponses?: FunctionResponse[]
}

export interface ChatSession {
    id: string
    title: string
    messages: Message[]
    createdAt: Date
    updatedAt: Date
}

export type MCPTransportType = 'stdio' | 'http'

export interface MCPServer {
    id: string
    name: string
    description?: string
    transport: MCPTransportType
    // stdio transport
    command?: string
    args?: string[]
    env?: Record<string, string>
    // http transport
    url?: string
    headers?: Record<string, string>
    // common
    enabled: boolean
    connected: boolean
    status: 'connected' | 'disconnected' | 'error' | 'connecting'
    lastConnected?: Date
    errorMessage?: string
    createdAt: Date
    updatedAt: Date
}

// 채팅 세션 관련 액션들
export async function createChatSession(
    userId: string,
    sessionData: Omit<ChatSession, 'messages' | 'createdAt' | 'updatedAt'>
): Promise<ChatSession> {
    const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
            id: sessionData.id,
            title: sessionData.title,
            user_id: userId
        })
        .select()
        .single()

    if (error) {
        throw new Error(`채팅 세션 생성 실패: ${error.message}`)
    }

    return {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at!),
        updatedAt: new Date(data.updated_at!)
    }
}

export async function getChatSessions(userId: string): Promise<ChatSession[]> {
    // 세션 조회
    const { data: sessions, error: sessionsError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

    if (sessionsError) {
        throw new Error(`채팅 세션 조회 실패: ${sessionsError.message}`)
    }

    // 각 세션의 메시지들 조회
    const sessionsWithMessages = await Promise.all(
        sessions.map(async session => {
            const messages = await getMessages(session.id)
            return {
                id: session.id,
                title: session.title,
                messages,
                createdAt: new Date(session.created_at!),
                updatedAt: new Date(session.updated_at!)
            }
        })
    )

    return sessionsWithMessages
}

export async function updateChatSession(
    sessionId: string,
    userId: string,
    updates: Partial<Pick<ChatSession, 'title'>>
): Promise<void> {
    const { error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(`채팅 세션 업데이트 실패: ${error.message}`)
    }
}

export async function deleteChatSession(
    sessionId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(`채팅 세션 삭제 실패: ${error.message}`)
    }
}

// 메시지 관련 액션들
export async function saveMessage(
    userId: string,
    message: Message,
    sessionId: string
): Promise<void> {
    // 메시지 저장
    const { error: messageError } = await supabase.from('messages').insert({
        id: message.id,
        content: message.content,
        sender: message.sender,
        timestamp: message.timestamp.toISOString(),
        is_streaming: message.isStreaming || false,
        session_id: sessionId,
        user_id: userId
    })

    if (messageError) {
        throw new Error(`메시지 저장 실패: ${messageError.message}`)
    }

    // 함수 호출 정보 저장 (있는 경우)
    if (message.functionCalls && message.functionCalls.length > 0) {
        const { error: callsError } = await supabase
            .from('function_calls')
            .insert(
                message.functionCalls.map(call => ({
                    message_id: message.id,
                    name: call.name,
                    arguments: call.arguments
                }))
            )

        if (callsError) {
            throw new Error(`함수 호출 정보 저장 실패: ${callsError.message}`)
        }
    }

    // 함수 응답 정보 저장 (있는 경우)
    if (message.functionResponses && message.functionResponses.length > 0) {
        const { error: responsesError } = await supabase
            .from('function_responses')
            .insert(
                message.functionResponses.map(response => ({
                    message_id: message.id,
                    name: response.name,
                    response: response.response
                }))
            )

        if (responsesError) {
            throw new Error(
                `함수 응답 정보 저장 실패: ${responsesError.message}`
            )
        }
    }
}

export async function getMessages(sessionId: string): Promise<Message[]> {
    // 메시지 조회
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })

    if (messagesError) {
        throw new Error(`메시지 조회 실패: ${messagesError.message}`)
    }

    // 각 메시지의 함수 호출/응답 정보 조회
    const messagesWithFunctions = await Promise.all(
        messages.map(async message => {
            // 함수 호출 조회
            const { data: functionCalls } = await supabase
                .from('function_calls')
                .select('*')
                .eq('message_id', message.id)

            // 함수 응답 조회
            const { data: functionResponses } = await supabase
                .from('function_responses')
                .select('*')
                .eq('message_id', message.id)

            return {
                id: message.id,
                content: message.content,
                sender: message.sender as 'user' | 'ai',
                timestamp: new Date(message.timestamp!),
                isStreaming: message.is_streaming || false,
                functionCalls: functionCalls?.map(call => ({
                    name: call.name,
                    arguments: call.arguments as Record<string, unknown>
                })),
                functionResponses: functionResponses?.map(response => ({
                    name: response.name,
                    response: response.response
                }))
            }
        })
    )

    return messagesWithFunctions
}

export async function updateMessage(
    messageId: string,
    userId: string,
    updates: Partial<Pick<Message, 'content' | 'isStreaming'>>
): Promise<void> {
    const updateData: any = {}
    if (updates.content !== undefined) updateData.content = updates.content
    if (updates.isStreaming !== undefined)
        updateData.is_streaming = updates.isStreaming

    const { error } = await supabase
        .from('messages')
        .update(updateData)
        .eq('id', messageId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(`메시지 업데이트 실패: ${error.message}`)
    }
}

export async function clearSessionMessages(
    sessionId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(`세션 메시지 삭제 실패: ${error.message}`)
    }
}

// MCP 서버 관련 액션들
export async function saveMCPServer(
    userId: string,
    server: MCPServer
): Promise<void> {
    const { error } = await supabase.from('mcp_servers').insert({
        id: server.id,
        name: server.name,
        description: server.description,
        transport: server.transport,
        command: server.command,
        args: server.args,
        env: server.env,
        url: server.url,
        headers: server.headers,
        enabled: server.enabled,
        connected: server.connected,
        status: server.status,
        last_connected: server.lastConnected?.toISOString(),
        error_message: server.errorMessage,
        user_id: userId
    })

    if (error) {
        throw new Error(`MCP 서버 저장 실패: ${error.message}`)
    }
}

export async function getMCPServers(userId: string): Promise<MCPServer[]> {
    const { data, error } = await supabase
        .from('mcp_servers')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error(`MCP 서버 조회 실패: ${error.message}`)
    }

    return data.map(server => ({
        id: server.id,
        name: server.name,
        description: server.description || undefined,
        transport: server.transport as MCPTransportType,
        command: server.command || undefined,
        args: server.args || undefined,
        env: (server.env as Record<string, string>) || undefined,
        url: server.url || undefined,
        headers: (server.headers as Record<string, string>) || undefined,
        enabled: server.enabled || false,
        connected: server.connected || false,
        status:
            (server.status as
                | 'connected'
                | 'disconnected'
                | 'error'
                | 'connecting') || 'disconnected',
        lastConnected: server.last_connected
            ? new Date(server.last_connected)
            : undefined,
        errorMessage: server.error_message || undefined,
        createdAt: new Date(server.created_at!),
        updatedAt: new Date(server.updated_at!)
    }))
}

export async function updateMCPServer(
    serverId: string,
    userId: string,
    updates: Partial<MCPServer>
): Promise<void> {
    const updateData: any = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined)
        updateData.description = updates.description
    if (updates.transport !== undefined)
        updateData.transport = updates.transport
    if (updates.command !== undefined) updateData.command = updates.command
    if (updates.args !== undefined) updateData.args = updates.args
    if (updates.env !== undefined) updateData.env = updates.env
    if (updates.url !== undefined) updateData.url = updates.url
    if (updates.headers !== undefined) updateData.headers = updates.headers
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled
    if (updates.connected !== undefined)
        updateData.connected = updates.connected
    if (updates.status !== undefined) updateData.status = updates.status
    if (updates.lastConnected !== undefined)
        updateData.last_connected = updates.lastConnected.toISOString()
    if (updates.errorMessage !== undefined)
        updateData.error_message = updates.errorMessage

    const { error } = await supabase
        .from('mcp_servers')
        .update(updateData)
        .eq('id', serverId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(`MCP 서버 업데이트 실패: ${error.message}`)
    }
}

export async function deleteMCPServer(
    serverId: string,
    userId: string
): Promise<void> {
    const { error } = await supabase
        .from('mcp_servers')
        .delete()
        .eq('id', serverId)
        .eq('user_id', userId)

    if (error) {
        throw new Error(`MCP 서버 삭제 실패: ${error.message}`)
    }
}
