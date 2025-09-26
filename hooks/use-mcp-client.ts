'use client'

import { useState, useCallback } from 'react'
import type {
    MCPServer,
    MCPResource,
    MCPTool,
    MCPPrompt,
    MCPClientStatus
} from '@/lib/mcp-client'

// 브라우저용 MCP 클라이언트 훅 (시뮬레이션 데이터 사용)
export function useMCPClient() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 브라우저에서는 실제 API 호출 대신 시뮬레이션 사용
    const simulateDelay = (ms: number = 500) =>
        new Promise(resolve => setTimeout(resolve, ms))

    const connectServer = useCallback(
        async (server: MCPServer): Promise<void> => {
            setIsLoading(true)
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 연결
                await simulateDelay(1000)

                // 90% 성공률로 시뮬레이션
                if (Math.random() > 0.1) {
                    console.log(`시뮬레이션: 서버 "${server.name}" 연결 성공`)
                } else {
                    throw new Error('시뮬레이션된 연결 실패')
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '연결 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    const disconnectServer = useCallback(
        async (serverId: string): Promise<void> => {
            setIsLoading(true)
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 연결 해제
                await simulateDelay(300)
                console.log(`시뮬레이션: 서버 ID "${serverId}" 연결 해제`)
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '연결 해제 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            } finally {
                setIsLoading(false)
            }
        },
        []
    )

    const getServerStatus = useCallback(
        async (_serverId: string): Promise<MCPClientStatus> => {
            try {
                // 브라우저에서는 시뮬레이션 상태 반환
                await simulateDelay(200)
                return {
                    connected: false,
                    status: 'disconnected'
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '상태 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    const listResources = useCallback(
        async (serverId: string): Promise<MCPResource[]> => {
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 리소스 반환
                await simulateDelay(300)
                console.log(`시뮬레이션: 서버 "${serverId}" 리소스 목록 조회`)
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
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '리소스 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    const listTools = useCallback(
        async (serverId: string): Promise<MCPTool[]> => {
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 도구 반환
                await simulateDelay(250)
                console.log(`시뮬레이션: 서버 "${serverId}" 도구 목록 조회`)
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
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '도구 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    const listPrompts = useCallback(
        async (serverId: string): Promise<MCPPrompt[]> => {
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 프롬프트 반환
                await simulateDelay(280)
                console.log(`시뮬레이션: 서버 "${serverId}" 프롬프트 목록 조회`)
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
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '프롬프트 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    const callTool = useCallback(
        async (
            serverId: string,
            toolName: string,
            args: Record<string, unknown>
        ): Promise<unknown> => {
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 도구 실행
                await simulateDelay(500)
                console.log(
                    `시뮬레이션: 서버 "${serverId}"에서 도구 "${toolName}" 실행`
                )

                if (toolName === 'echo') {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Echo: ${
                                    args &&
                                    typeof args === 'object' &&
                                    'message' in args
                                        ? String(args.message)
                                        : 'No message provided'
                                }`
                            }
                        ]
                    }
                } else if (toolName === 'calculate') {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `계산 결과: ${
                                    args &&
                                    typeof args === 'object' &&
                                    'expression' in args
                                        ? String(args.expression)
                                        : '계산식 없음'
                                } = (시뮬레이션 결과)`
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
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '도구 실행 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    const readResource = useCallback(
        async (serverId: string, uri: string): Promise<unknown> => {
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 리소스 읽기
                await simulateDelay(300)
                console.log(
                    `시뮬레이션: 서버 "${serverId}"에서 리소스 "${uri}" 읽기`
                )

                return {
                    contents: [
                        {
                            uri: uri,
                            text: `시뮬레이션된 리소스 내용입니다.\nURI: ${uri}\n\n이것은 브라우저 환경에서의 모의 데이터입니다.`
                        }
                    ]
                }
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '리소스 읽기 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    const getPrompt = useCallback(
        async (
            serverId: string,
            promptName: string,
            args?: Record<string, unknown>
        ): Promise<unknown> => {
            setError(null)

            try {
                // 브라우저에서는 시뮬레이션 프롬프트 실행
                await simulateDelay(400)
                console.log(
                    `시뮬레이션: 서버 "${serverId}"에서 프롬프트 "${promptName}" 실행`
                )

                if (promptName === 'greeting') {
                    const name =
                        args && typeof args === 'object' && 'name' in args
                            ? String(args.name)
                            : 'Anonymous'
                    const time =
                        args && typeof args === 'object' && 'time' in args
                            ? String(args.time)
                            : 'day'
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
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '프롬프트 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        []
    )

    return {
        // 상태
        isLoading,
        error,

        // 서버 관리
        connectServer,
        disconnectServer,
        getServerStatus,

        // 기능들
        listResources,
        listTools,
        listPrompts,
        callTool,
        readResource,
        getPrompt,

        // 유틸리티
        clearError: () => setError(null)
    }
}
