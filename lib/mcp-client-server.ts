// 서버 전용 MCP 클라이언트
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

export interface MCPClientStatus {
    connected: boolean
    status: 'connected' | 'disconnected' | 'error' | 'connecting'
    lastConnected?: Date
    errorMessage?: string
}

export interface MCPResource {
    uri: string
    name?: string
    description?: string
    mimeType?: string
}

export interface MCPTool {
    name: string
    description?: string
    inputSchema?: Record<string, unknown>
}

export interface MCPPrompt {
    name: string
    description?: string
    arguments?: Array<{
        name: string
        description?: string
        required?: boolean
    }>
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

// 전역 MCP 연결 관리를 위한 타입
export interface GlobalMCPConnection {
    serverId: string
    client: Client
    server: MCPServer
    lastActivity: Date
}

// 전역 MCP 연결 풀
declare global {
    var mcpConnections: Map<string, GlobalMCPConnection> | undefined
}

export class MCPServerManager {
    private clients: Map<string, Client> = new Map()
    private transports: Map<
        string,
        StdioClientTransport | StreamableHTTPClientTransport
    > = new Map()

    constructor() {
        this.initializeGlobalConnections()
    }

    /**
     * 전역 MCP 연결 풀 초기화
     */
    private initializeGlobalConnections(): void {
        if (!global.mcpConnections) {
            global.mcpConnections = new Map<string, GlobalMCPConnection>()
        }
    }

    /**
     * 전역 연결 풀에서 활성 연결 가져오기
     */
    getGlobalConnection(serverId: string): GlobalMCPConnection | undefined {
        return global.mcpConnections?.get(serverId)
    }

    /**
     * 전역 연결 풀에 연결 추가
     */
    private setGlobalConnection(connection: GlobalMCPConnection): void {
        if (!global.mcpConnections) {
            global.mcpConnections = new Map()
        }
        global.mcpConnections.set(connection.serverId, connection)
    }

    /**
     * 전역 연결 풀에서 연결 제거
     */
    private removeGlobalConnection(serverId: string): void {
        global.mcpConnections?.delete(serverId)
    }

    /**
     * 모든 활성 MCP 클라이언트 가져오기 (AI 채팅에서 사용)
     */
    getAllActiveClients(): Client[] {
        if (!global.mcpConnections) return []
        return Array.from(global.mcpConnections.values()).map(
            conn => conn.client
        )
    }

    /**
     * 활성 MCP 서버 정보 가져오기
     */
    getActiveServers(): MCPServer[] {
        if (!global.mcpConnections) return []
        return Array.from(global.mcpConnections.values()).map(
            conn => conn.server
        )
    }

    /**
     * 특정 서버의 클라이언트 가져오기
     */
    getClient(serverId: string): Client | undefined {
        const connection = this.getGlobalConnection(serverId)
        return connection?.client
    }

    /**
     * MCP 서버에 연결을 시도합니다
     */
    async connect(server: MCPServer): Promise<void> {
        try {
            let transport: StdioClientTransport | StreamableHTTPClientTransport

            if (server.transport === 'stdio') {
                if (!server.command) {
                    throw new Error('stdio transport에는 command가 필요합니다')
                }
                transport = new StdioClientTransport({
                    command: server.command,
                    args: server.args || [],
                    env: server.env
                })
            } else if (server.transport === 'http') {
                if (!server.url) {
                    throw new Error('http transport에는 url이 필요합니다')
                }

                // URL 유효성 검사
                let url: URL
                try {
                    url = new URL(server.url)
                } catch {
                    throw new Error(`유효하지 않은 URL입니다: ${server.url}`)
                }

                transport = new StreamableHTTPClientTransport(url)
            } else {
                throw new Error(
                    `지원하지 않는 transport 타입: ${server.transport}`
                )
            }

            const client = new Client({
                name: 'ai-chat-app-mcp-client',
                version: '1.0.0'
            })

            // 연결 타임아웃 설정 (30초)
            const connectWithTimeout = Promise.race([
                client.connect(transport),
                new Promise((_, reject) =>
                    setTimeout(
                        () => reject(new Error('연결 타임아웃 (30초)')),
                        30000
                    )
                )
            ])

            await connectWithTimeout

            // 기존 연결 맵에 추가
            this.clients.set(server.id, client)
            this.transports.set(server.id, transport)

            // 전역 연결 풀에 추가
            const connection: GlobalMCPConnection = {
                serverId: server.id,
                client,
                server,
                lastActivity: new Date()
            }
            this.setGlobalConnection(connection)
        } catch (error) {
            throw error
        }
    }

    /**
     * MCP 서버 연결을 해제합니다
     */
    async disconnect(serverId: string): Promise<void> {
        try {
            const client = this.clients.get(serverId)
            const transport = this.transports.get(serverId)

            if (client) {
                await client.close()
                this.clients.delete(serverId)
            }

            if (transport) {
                this.transports.delete(serverId)
            }

            // 전역 연결 풀에서 제거
            this.removeGlobalConnection(serverId)
        } catch (error) {
            throw error
        }
    }

    /**
     * 서버 상태를 확인합니다
     */
    async checkServerStatus(serverId: string): Promise<MCPClientStatus> {
        const client = this.clients.get(serverId)

        if (!client) {
            return {
                connected: false,
                status: 'disconnected'
            }
        }

        try {
            // 간단한 ping 요청으로 연결 상태 확인
            await client.listResources()
            return {
                connected: true,
                status: 'connected',
                lastConnected: new Date()
            }
        } catch {
            return {
                connected: false,
                status: 'error',
                errorMessage: '서버 응답 없음'
            }
        }
    }

    /**
     * 사용 가능한 리소스 목록을 가져옵니다
     */
    async listResources(serverId: string): Promise<MCPResource[]> {
        const client = this.clients.get(serverId)
        if (!client) {
            throw new Error('서버가 연결되지 않았습니다')
        }

        try {
            const response = await client.listResources()
            return response.resources.map(resource => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType
            }))
        } catch (error) {
            // Method not found 에러인 경우 빈 배열 반환
            if (error instanceof Error && error.message.includes('-32601')) {
                console.log(`서버 ${serverId}는 resources를 지원하지 않습니다`)
                return []
            }
            throw new Error(
                `리소스 목록 조회 실패: ${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    /**
     * 사용 가능한 도구 목록을 가져옵니다
     */
    async listTools(serverId: string): Promise<MCPTool[]> {
        const client = this.clients.get(serverId)
        if (!client) {
            throw new Error('서버가 연결되지 않았습니다')
        }

        try {
            const response = await client.listTools()
            return response.tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }))
        } catch (error) {
            // Method not found 에러인 경우 빈 배열 반환
            if (error instanceof Error && error.message.includes('-32601')) {
                console.log(`서버 ${serverId}는 tools를 지원하지 않습니다`)
                return []
            }
            throw new Error(
                `도구 목록 조회 실패: ${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    /**
     * 사용 가능한 프롬프트 목록을 가져옵니다
     */
    async listPrompts(serverId: string): Promise<MCPPrompt[]> {
        const client = this.clients.get(serverId)
        if (!client) {
            throw new Error('서버가 연결되지 않았습니다')
        }

        try {
            const response = await client.listPrompts()
            return response.prompts.map(prompt => ({
                name: prompt.name,
                description: prompt.description,
                arguments: prompt.arguments
            }))
        } catch (error) {
            // Method not found 에러인 경우 빈 배열 반환
            if (error instanceof Error && error.message.includes('-32601')) {
                console.log(`서버 ${serverId}는 prompts를 지원하지 않습니다`)
                return []
            }
            throw new Error(
                `프롬프트 목록 조회 실패: ${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    /**
     * 도구를 실행합니다
     */
    async callTool(
        serverId: string,
        toolName: string,
        args: Record<string, unknown>
    ): Promise<unknown> {
        const client = this.clients.get(serverId)
        if (!client) {
            throw new Error('서버가 연결되지 않았습니다')
        }

        try {
            const response = await client.callTool({
                name: toolName,
                arguments: args as Record<string, string>
            })
            return response
        } catch (error) {
            throw new Error(
                `도구 실행 실패: ${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    /**
     * 리소스를 읽어옵니다
     */
    async readResource(serverId: string, uri: string): Promise<unknown> {
        const client = this.clients.get(serverId)
        if (!client) {
            throw new Error('서버가 연결되지 않았습니다')
        }

        try {
            const response = await client.readResource({ uri })
            return response
        } catch (error) {
            throw new Error(
                `리소스 읽기 실패: ${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    /**
     * 프롬프트를 가져옵니다
     */
    async getPrompt(
        serverId: string,
        promptName: string,
        args?: Record<string, unknown>
    ): Promise<unknown> {
        const client = this.clients.get(serverId)
        if (!client) {
            throw new Error('서버가 연결되지 않았습니다')
        }

        try {
            const response = await client.getPrompt({
                name: promptName,
                arguments: args as Record<string, string> | undefined
            })
            return response
        } catch (error) {
            throw new Error(
                `프롬프트 조회 실패: ${
                    error instanceof Error ? error.message : '알 수 없는 오류'
                }`
            )
        }
    }

    /**
     * 모든 연결을 정리합니다
     */
    async cleanup(): Promise<void> {
        const disconnectPromises = Array.from(this.clients.keys()).map(
            serverId => this.disconnect(serverId).catch(console.error)
        )

        await Promise.all(disconnectPromises)
    }
}

// 싱글톤 인스턴스
export const mcpServerManager = new MCPServerManager()
