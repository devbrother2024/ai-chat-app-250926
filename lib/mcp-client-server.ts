// 서버 전용 MCP 클라이언트
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

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

export interface MCPServer {
    id: string
    name: string
    description?: string
    command: string
    args?: string[]
    env?: Record<string, string>
    enabled: boolean
    connected: boolean
    status: 'connected' | 'disconnected' | 'error' | 'connecting'
    lastConnected?: Date
    errorMessage?: string
    createdAt: Date
    updatedAt: Date
}

export class MCPServerManager {
    private clients: Map<string, Client> = new Map()
    private transports: Map<string, StdioClientTransport> = new Map()

    /**
     * MCP 서버에 연결을 시도합니다
     */
    async connect(server: MCPServer): Promise<void> {
        try {
            const transport = new StdioClientTransport({
                command: server.command,
                args: server.args || [],
                env: server.env
            })

            const client = new Client({
                name: 'ai-chat-app-mcp-client',
                version: '1.0.0'
            })

            await client.connect(transport)

            this.clients.set(server.id, client)
            this.transports.set(server.id, transport)
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
