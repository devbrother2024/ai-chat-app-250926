'use client'

// 브라우저 환경용 MCP 클라이언트 (Node.js 모듈 사용하지 않음)

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

export class MCPClientManager {
    private statusListeners: Map<string, (status: MCPClientStatus) => void> =
        new Map()

    constructor() {
        console.info(
            '브라우저용 MCP 클라이언트가 초기화되었습니다. 실제 연결은 서버 API를 통해 처리됩니다.'
        )
    }

    /**
     * MCP 서버에 연결을 시도합니다 (브라우저에서는 시뮬레이션)
     */
    async connect(server: MCPServer): Promise<void> {
        try {
            this.updateStatus(server.id, {
                connected: false,
                status: 'connecting'
            })

            // 브라우저 환경에서는 시뮬레이션만 동작
            await this.simulateConnection(server)
        } catch (error) {
            this.updateStatus(server.id, {
                connected: false,
                status: 'error',
                errorMessage:
                    error instanceof Error ? error.message : '연결 실패'
            })
            throw error
        }
    }

    /**
     * 브라우저 환경에서의 시뮬레이션 연결
     */
    private async simulateConnection(server: MCPServer): Promise<void> {
        // 연결 지연 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 랜덤하게 성공/실패 결정 (90% 성공률)
        if (Math.random() > 0.1) {
            this.updateStatus(server.id, {
                connected: true,
                status: 'connected',
                lastConnected: new Date()
            })
        } else {
            throw new Error('시뮬레이션된 연결 실패')
        }
    }

    /**
     * MCP 서버 연결을 해제합니다 (브라우저에서는 시뮬레이션)
     */
    async disconnect(serverId: string): Promise<void> {
        try {
            this.updateStatus(serverId, {
                connected: false,
                status: 'disconnected'
            })
        } catch (error) {
            this.updateStatus(serverId, {
                connected: false,
                status: 'error',
                errorMessage:
                    error instanceof Error ? error.message : '연결 해제 실패'
            })
            throw error
        }
    }

    /**
     * 서버 상태를 확인합니다 (브라우저에서는 시뮬레이션)
     */
    async checkServerStatus(_serverId: string): Promise<MCPClientStatus> {
        // 브라우저에서는 실제 상태 확인 불가, 기본값 반환
        return {
            connected: false,
            status: 'disconnected'
        }
    }

    /**
     * 사용 가능한 리소스 목록을 가져옵니다 (브라우저에서는 시뮬레이션)
     */
    async listResources(_serverId: string): Promise<MCPResource[]> {
        // 브라우저에서는 시뮬레이션 데이터 반환
        return [
            {
                uri: 'file:///example.txt',
                name: 'Example File',
                description: '예시 텍스트 파일',
                mimeType: 'text/plain'
            },
            {
                uri: 'file:///data.json',
                name: 'Sample Data',
                description: '샘플 JSON 데이터',
                mimeType: 'application/json'
            }
        ]
    }

    /**
     * 사용 가능한 도구 목록을 가져옵니다 (브라우저에서는 시뮬레이션)
     */
    async listTools(_serverId: string): Promise<MCPTool[]> {
        // 브라우저에서는 시뮬레이션 데이터 반환
        return [
            {
                name: 'echo',
                description: '입력된 텍스트를 그대로 반환하는 도구',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            },
            {
                name: 'calculate',
                description: '간단한 수학 계산을 수행하는 도구',
                inputSchema: {
                    type: 'object',
                    properties: {
                        expression: { type: 'string' }
                    }
                }
            }
        ]
    }

    /**
     * 사용 가능한 프롬프트 목록을 가져옵니다 (브라우저에서는 시뮬레이션)
     */
    async listPrompts(_serverId: string): Promise<MCPPrompt[]> {
        // 브라우저에서는 시뮬레이션 데이터 반환
        return [
            {
                name: 'greeting',
                description: '사용자에게 인사말을 생성하는 프롬프트',
                arguments: [
                    {
                        name: 'name',
                        description: '인사할 사용자의 이름',
                        required: true
                    },
                    {
                        name: 'time',
                        description:
                            '하루 중 시간 (morning, afternoon, evening)',
                        required: false
                    }
                ]
            }
        ]
    }

    /**
     * 도구를 실행합니다 (브라우저에서는 시뮬레이션)
     */
    async callTool(
        serverId: string,
        toolName: string,
        args: Record<string, unknown>
    ): Promise<unknown> {
        // 브라우저에서는 시뮬레이션 응답 반환
        await new Promise(resolve => setTimeout(resolve, 500)) // 실행 지연 시뮬레이션

        if (toolName === 'echo') {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Echo: ${args.message || 'No message provided'}`
                    }
                ]
            }
        } else if (toolName === 'calculate') {
            return {
                content: [
                    {
                        type: 'text',
                        text: `계산 결과: ${args.expression} = (시뮬레이션 결과)`
                    }
                ]
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: `도구 '${toolName}' 실행 완료 (시뮬레이션)`
                }
            ]
        }
    }

    /**
     * 리소스를 읽어옵니다 (브라우저에서는 시뮬레이션)
     */
    async readResource(serverId: string, uri: string): Promise<unknown> {
        // 브라우저에서는 시뮬레이션 데이터 반환
        await new Promise(resolve => setTimeout(resolve, 300)) // 로딩 지연 시뮬레이션

        return {
            contents: [
                {
                    uri: uri,
                    text: `시뮬레이션된 리소스 내용입니다.\nURI: ${uri}\n\n이것은 브라우저 환경에서의 모의 데이터입니다.`
                }
            ]
        }
    }

    /**
     * 프롬프트를 가져옵니다 (브라우저에서는 시뮬레이션)
     */
    async getPrompt(
        serverId: string,
        promptName: string,
        args?: Record<string, unknown>
    ): Promise<unknown> {
        // 브라우저에서는 시뮬레이션 데이터 반환
        await new Promise(resolve => setTimeout(resolve, 400)) // 처리 지연 시뮬레이션

        if (promptName === 'greeting') {
            const name = args?.name || 'Anonymous'
            const time = args?.time || 'day'
            return {
                description: '인사말 프롬프트',
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `안녕하세요, ${name}님! 좋은 ${time}입니다. (시뮬레이션 프롬프트)`
                        }
                    }
                ]
            }
        }

        return {
            description: `프롬프트 '${promptName}' 결과`,
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `프롬프트 '${promptName}'이 실행되었습니다 (시뮬레이션)`
                    }
                }
            ]
        }
    }

    /**
     * 상태 변경 리스너를 등록합니다
     */
    onStatusChange(
        serverId: string,
        listener: (status: MCPClientStatus) => void
    ): void {
        this.statusListeners.set(serverId, listener)
    }

    /**
     * 상태 변경 리스너를 제거합니다
     */
    removeStatusListener(serverId: string): void {
        this.statusListeners.delete(serverId)
    }

    /**
     * 서버 상태를 업데이트하고 리스너에게 알립니다
     */
    private updateStatus(serverId: string, status: MCPClientStatus): void {
        const listener = this.statusListeners.get(serverId)
        if (listener) {
            listener(status)
        }
    }

    /**
     * 모든 연결을 정리합니다 (브라우저에서는 시뮬레이션)
     */
    async cleanup(): Promise<void> {
        this.statusListeners.clear()
    }
}

// 싱글톤 인스턴스
export const mcpClientManager = new MCPClientManager()
