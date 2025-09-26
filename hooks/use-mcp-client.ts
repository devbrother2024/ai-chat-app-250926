'use client'

import { useState, useCallback } from 'react'
import type {
    MCPServer,
    MCPResource,
    MCPTool,
    MCPPrompt,
    MCPClientStatus
} from '@/lib/mcp-client'

// MCP 클라이언트 훅 (서버 API 호출)
export function useMCPClient() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // API 호출 헬퍼 함수
    const apiCall = useCallback(
        async (action: string, data?: Record<string, unknown>) => {
            const response = await fetch(`/api/mcp/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || '요청 실패')
            }

            return response.json()
        },
        []
    )

    const connectServer = useCallback(
        async (server: MCPServer): Promise<void> => {
            setIsLoading(true)
            setError(null)

            try {
                await apiCall('connect', { server })
                console.log(`실제 연결: 서버 "${server.name}" 연결 성공`)
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '연결 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            } finally {
                setIsLoading(false)
            }
        },
        [apiCall]
    )

    const disconnectServer = useCallback(
        async (serverId: string): Promise<void> => {
            setIsLoading(true)
            setError(null)

            try {
                await apiCall('disconnect', { serverId })
                console.log(`실제 연결 해제: 서버 ID "${serverId}" 연결 해제`)
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '연결 해제 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            } finally {
                setIsLoading(false)
            }
        },
        [apiCall]
    )

    const getServerStatus = useCallback(
        async (serverId: string): Promise<MCPClientStatus> => {
            try {
                const response = await apiCall('status', { serverId })
                return response.status
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '상태 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
    )

    const listResources = useCallback(
        async (serverId: string): Promise<MCPResource[]> => {
            setError(null)

            try {
                const response = await apiCall('list-resources', { serverId })
                return response.resources
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '리소스 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
    )

    const listTools = useCallback(
        async (serverId: string): Promise<MCPTool[]> => {
            setError(null)

            try {
                const response = await apiCall('list-tools', { serverId })
                return response.tools
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '도구 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
    )

    const listPrompts = useCallback(
        async (serverId: string): Promise<MCPPrompt[]> => {
            setError(null)

            try {
                const response = await apiCall('list-prompts', { serverId })
                return response.prompts
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '프롬프트 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
    )

    const callTool = useCallback(
        async (
            serverId: string,
            toolName: string,
            args: Record<string, unknown>
        ): Promise<unknown> => {
            setError(null)

            try {
                const response = await apiCall('call-tool', {
                    serverId,
                    toolName,
                    args
                })
                return response.result
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '도구 실행 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
    )

    const readResource = useCallback(
        async (serverId: string, uri: string): Promise<unknown> => {
            setError(null)

            try {
                const response = await apiCall('read-resource', {
                    serverId,
                    uri
                })
                return response.resource
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '리소스 읽기 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
    )

    const getPrompt = useCallback(
        async (
            serverId: string,
            promptName: string,
            args?: Record<string, unknown>
        ): Promise<unknown> => {
            setError(null)

            try {
                const response = await apiCall('get-prompt', {
                    serverId,
                    promptName,
                    args
                })
                return response.prompt
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : '프롬프트 조회 실패'
                setError(errorMessage)
                throw new Error(errorMessage)
            }
        },
        [apiCall]
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
