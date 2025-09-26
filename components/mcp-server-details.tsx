'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Folder,
    Wrench,
    MessageSquare,
    RefreshCw,
    ExternalLink,
    FileText,
    Code,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import type {
    MCPResource,
    MCPTool,
    MCPPrompt,
    MCPServer
} from '@/lib/mcp-client'
import { useMCPClient } from '@/hooks/use-mcp-client'

interface MCPServerDetailsProps {
    server: MCPServer
}

export default function MCPServerDetails({ server }: MCPServerDetailsProps) {
    const [resources, setResources] = useState<MCPResource[]>([])
    const [tools, setTools] = useState<MCPTool[]>([])
    const [prompts, setPrompts] = useState<MCPPrompt[]>([])
    const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null)
    const [toolArgs, setToolArgs] = useState<string>('{}')
    const [toolResult, setToolResult] = useState<unknown>(null)
    const [isExecutingTool, setIsExecutingTool] = useState(false)
    const [_selectedResource, setSelectedResource] =
        useState<MCPResource | null>(null)
    const [resourceContent, setResourceContent] = useState<string>('')
    const [isLoadingResource, setIsLoadingResource] = useState(false)
    const [selectedPrompt, setSelectedPrompt] = useState<MCPPrompt | null>(null)
    const [promptArgs, setPromptArgs] = useState<string>('{}')
    const [promptResult, setPromptResult] = useState<unknown>(null)
    const [isExecutingPrompt, setIsExecutingPrompt] = useState(false)

    const {
        isLoading,
        error,
        listResources,
        listTools,
        listPrompts,
        callTool,
        readResource,
        getPrompt,
        clearError
    } = useMCPClient()

    // 서버 정보 새로고침
    const refreshServerInfo = useCallback(async () => {
        if (!server.connected) {
            return
        }

        clearError()

        try {
            const [resourcesResult, toolsResult, promptsResult] =
                await Promise.allSettled([
                    listResources(server.id),
                    listTools(server.id),
                    listPrompts(server.id)
                ])

            if (resourcesResult.status === 'fulfilled') {
                setResources(resourcesResult.value)
            } else {
                console.error('리소스 조회 실패:', resourcesResult.reason)
            }

            if (toolsResult.status === 'fulfilled') {
                setTools(toolsResult.value)
            } else {
                console.error('도구 조회 실패:', toolsResult.reason)
            }

            if (promptsResult.status === 'fulfilled') {
                setPrompts(promptsResult.value)
            } else {
                console.error('프롬프트 조회 실패:', promptsResult.reason)
            }
        } catch (err) {
            console.error('정보 조회 실패:', err)
        }
    }, [
        server.connected,
        server.id,
        listResources,
        listTools,
        listPrompts,
        clearError
    ])

    // 도구 실행
    const executeTool = async () => {
        if (!selectedTool) return

        setIsExecutingTool(true)
        setToolResult(null)

        try {
            const args = JSON.parse(toolArgs)
            const result = await callTool(server.id, selectedTool.name, args)
            setToolResult(result)
        } catch (err) {
            setToolResult({
                error: err instanceof Error ? err.message : '도구 실행 실패'
            })
        } finally {
            setIsExecutingTool(false)
        }
    }

    // 리소스 읽기
    const loadResource = async (resource: MCPResource) => {
        setSelectedResource(resource)
        setIsLoadingResource(true)
        setResourceContent('')

        try {
            const result = await readResource(server.id, resource.uri)
            if (result && typeof result === 'object' && 'contents' in result) {
                const contents = (result as any).contents
                if (Array.isArray(contents) && contents.length > 0) {
                    setResourceContent(
                        contents[0].text || JSON.stringify(contents[0], null, 2)
                    )
                } else {
                    setResourceContent(JSON.stringify(result, null, 2))
                }
            } else {
                setResourceContent(JSON.stringify(result, null, 2))
            }
        } catch (err) {
            setResourceContent(
                `오류: ${
                    err instanceof Error ? err.message : '리소스 읽기 실패'
                }`
            )
        } finally {
            setIsLoadingResource(false)
        }
    }

    // 프롬프트 실행
    const executePrompt = async () => {
        if (!selectedPrompt) return

        setIsExecutingPrompt(true)
        setPromptResult(null)

        try {
            const args = promptArgs.trim() ? JSON.parse(promptArgs) : {}
            const result = await getPrompt(server.id, selectedPrompt.name, args)
            setPromptResult(result)
        } catch (err) {
            setPromptResult({
                error: err instanceof Error ? err.message : '프롬프트 실행 실패'
            })
        } finally {
            setIsExecutingPrompt(false)
        }
    }

    // 서버 연결 상태가 변경될 때마다 정보 새로고침
    useEffect(() => {
        if (server.connected) {
            refreshServerInfo()
        } else {
            setResources([])
            setTools([])
            setPrompts([])
        }
    }, [server.connected, server.id, refreshServerInfo])

    if (!server.connected) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        서버가 연결되지 않았습니다
                    </h3>
                    <p className="text-muted-foreground text-center">
                        서버에 연결한 후 세부 정보를 확인할 수 있습니다.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">
                        {server.name} 세부 정보
                    </h2>
                    <p className="text-muted-foreground">
                        {server.description}
                    </p>
                </div>
                <Button
                    onClick={refreshServerInfo}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                >
                    <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                            isLoading ? 'animate-spin' : ''
                        }`}
                    />
                    새로고침
                </Button>
            </div>

            {error && (
                <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* 리소스 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Folder className="w-4 h-4" />
                            리소스
                            <Badge variant="secondary">
                                {resources.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        ) : resources.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                리소스가 없습니다
                            </p>
                        ) : (
                            resources.map((resource, index) => (
                                <Dialog key={index}>
                                    <DialogTrigger asChild>
                                        <div
                                            className="p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() =>
                                                loadResource(resource)
                                            }
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm font-medium truncate">
                                                    {resource.name ||
                                                        resource.uri}
                                                </span>
                                                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto flex-shrink-0" />
                                            </div>
                                            {resource.description && (
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {resource.description}
                                                </p>
                                            )}
                                            {resource.mimeType && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs mt-1"
                                                >
                                                    {resource.mimeType}
                                                </Badge>
                                            )}
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>
                                                리소스:{' '}
                                                {resource.name || resource.uri}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {resource.description ||
                                                    '리소스 내용을 확인합니다.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label>URI</Label>
                                                <div className="text-sm font-mono bg-muted p-2 rounded">
                                                    {resource.uri}
                                                </div>
                                            </div>
                                            <div>
                                                <Label>내용</Label>
                                                {isLoadingResource ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <Loader2 className="w-6 h-6 animate-spin" />
                                                        <span className="ml-2">
                                                            로딩 중...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <Textarea
                                                        value={resourceContent}
                                                        readOnly
                                                        className="font-mono text-sm min-h-[300px]"
                                                        placeholder="리소스를 클릭하여 내용을 확인하세요"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* 도구 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Wrench className="w-4 h-4" />
                            도구
                            <Badge variant="secondary">{tools.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        ) : tools.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                도구가 없습니다
                            </p>
                        ) : (
                            tools.map((tool, index) => (
                                <Dialog key={index}>
                                    <DialogTrigger asChild>
                                        <div
                                            className="p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setSelectedTool(tool)
                                                setToolArgs('{}')
                                                setToolResult(null)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Code className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    {tool.name}
                                                </span>
                                            </div>
                                            {tool.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {tool.description}
                                                </p>
                                            )}
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>
                                                도구 실행: {tool.name}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {tool.description ||
                                                    '도구를 실행합니다.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="tool-args">
                                                    인수 (JSON)
                                                </Label>
                                                <Textarea
                                                    id="tool-args"
                                                    value={toolArgs}
                                                    onChange={e =>
                                                        setToolArgs(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder='{"arg1": "value1", "arg2": "value2"}'
                                                    className="font-mono text-sm"
                                                    rows={4}
                                                />
                                            </div>
                                            {toolResult !== null && (
                                                <div>
                                                    <Label>실행 결과</Label>
                                                    <Textarea
                                                        value={
                                                            typeof toolResult ===
                                                            'string'
                                                                ? toolResult
                                                                : JSON.stringify(
                                                                      toolResult,
                                                                      null,
                                                                      2
                                                                  )
                                                        }
                                                        readOnly
                                                        className="font-mono text-sm"
                                                        rows={6}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                onClick={executeTool}
                                                disabled={isExecutingTool}
                                            >
                                                {isExecutingTool ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        실행 중...
                                                    </>
                                                ) : (
                                                    '실행'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* 프롬프트 */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MessageSquare className="w-4 h-4" />
                            프롬프트
                            <Badge variant="secondary">{prompts.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                        ) : prompts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                프롬프트가 없습니다
                            </p>
                        ) : (
                            prompts.map((prompt, index) => (
                                <Dialog key={index}>
                                    <DialogTrigger asChild>
                                        <div
                                            className="p-2 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setSelectedPrompt(prompt)
                                                setPromptArgs('{}')
                                                setPromptResult(null)
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3 text-muted-foreground" />
                                                <span className="text-sm font-medium">
                                                    {prompt.name}
                                                </span>
                                            </div>
                                            {prompt.description && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {prompt.description}
                                                </p>
                                            )}
                                            {prompt.arguments &&
                                                prompt.arguments.length > 0 && (
                                                    <div className="mt-1 space-x-1">
                                                        {prompt.arguments.map(
                                                            (arg, argIndex) => (
                                                                <Badge
                                                                    key={
                                                                        argIndex
                                                                    }
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {arg.name}
                                                                    {arg.required &&
                                                                        '*'}
                                                                </Badge>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>
                                                프롬프트 실행: {prompt.name}
                                            </DialogTitle>
                                            <DialogDescription>
                                                {prompt.description ||
                                                    '프롬프트를 실행합니다.'}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            {prompt.arguments &&
                                                prompt.arguments.length > 0 && (
                                                    <div>
                                                        <Label htmlFor="prompt-args">
                                                            인수 (JSON)
                                                        </Label>
                                                        <div className="text-xs text-muted-foreground mb-2">
                                                            필수 인수:{' '}
                                                            {prompt.arguments
                                                                .filter(
                                                                    arg =>
                                                                        arg.required
                                                                )
                                                                .map(
                                                                    arg =>
                                                                        arg.name
                                                                )
                                                                .join(', ') ||
                                                                '없음'}
                                                        </div>
                                                        <Textarea
                                                            id="prompt-args"
                                                            value={promptArgs}
                                                            onChange={e =>
                                                                setPromptArgs(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder='{"arg1": "value1", "arg2": "value2"}'
                                                            className="font-mono text-sm"
                                                            rows={4}
                                                        />
                                                    </div>
                                                )}
                                            {promptResult !== null && (
                                                <div>
                                                    <Label>실행 결과</Label>
                                                    <Textarea
                                                        value={
                                                            typeof promptResult ===
                                                            'string'
                                                                ? promptResult
                                                                : JSON.stringify(
                                                                      promptResult,
                                                                      null,
                                                                      2
                                                                  )
                                                        }
                                                        readOnly
                                                        className="font-mono text-sm"
                                                        rows={8}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                onClick={executePrompt}
                                                disabled={isExecutingPrompt}
                                            >
                                                {isExecutingPrompt ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        실행 중...
                                                    </>
                                                ) : (
                                                    '실행'
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
