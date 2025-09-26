'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Server,
    Plus,
    Trash2,
    Edit3,
    Power,
    PowerOff,
    CheckCircle,
    XCircle,
    AlertCircle,
    Eye,
    ArrowLeft,
    Folder,
    Wrench,
    MessageSquare,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { useMCPClient } from '@/hooks/use-mcp-client'
import MCPServerDetails from './mcp-server-details'
import type { MCPTransportType } from '@/lib/mcp-client'
import { useAuth } from '@/contexts/AuthContext'
import {
    saveMCPServer,
    getMCPServers,
    updateMCPServer,
    deleteMCPServer,
    type MCPServer as DBMCPServer
} from '@/lib/database-client'

// 데이터베이스 타입을 사용 (호환성 유지)
type MCPServer = DBMCPServer

// 서버 통계 컴포넌트
function ServerStats({
    serverId,
    isConnected
}: {
    serverId: string
    isConnected: boolean
}) {
    const [stats, setStats] = useState<{
        resources: number
        tools: number
        prompts: number
        loading: boolean
        loaded: boolean
    }>({
        resources: 0,
        tools: 0,
        prompts: 0,
        loading: false,
        loaded: false
    })

    const { listResources, listTools, listPrompts } = useMCPClient()

    const fetchStats = useCallback(async () => {
        // 이미 로드된 경우 다시 조회하지 않음
        if (stats.loaded) return

        setStats(prev => ({ ...prev, loading: true }))

        try {
            const [resourcesResult, toolsResult, promptsResult] =
                await Promise.allSettled([
                    listResources(serverId),
                    listTools(serverId),
                    listPrompts(serverId)
                ])

            setStats({
                resources:
                    resourcesResult.status === 'fulfilled'
                        ? resourcesResult.value.length
                        : 0,
                tools:
                    toolsResult.status === 'fulfilled'
                        ? toolsResult.value.length
                        : 0,
                prompts:
                    promptsResult.status === 'fulfilled'
                        ? promptsResult.value.length
                        : 0,
                loading: false,
                loaded: true
            })
        } catch (error) {
            console.error('통계 조회 실패:', error)
            setStats(prev => ({ ...prev, loading: false }))
        }
    }, [serverId, listResources, listTools, listPrompts, stats.loaded])

    useEffect(() => {
        if (isConnected && !stats.loaded) {
            fetchStats()
        } else if (!isConnected) {
            setStats({
                resources: 0,
                tools: 0,
                prompts: 0,
                loading: false,
                loaded: false
            })
        }
    }, [isConnected, stats.loaded, fetchStats])

    if (stats.loading) {
        return (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="animate-pulse">통계 로딩 중...</div>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
                <Folder className="w-3 h-3" />
                <span>{stats.resources}</span>
            </div>
            <div className="flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                <span>{stats.tools}</span>
            </div>
            <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{stats.prompts}</span>
            </div>
        </div>
    )
}

// 사전 정의된 MCP 서버 템플릿
const SERVER_TEMPLATES = [
    {
        name: 'File System (stdio)',
        description: '파일 시스템 접근을 위한 MCP 서버',
        transport: 'stdio' as const,
        command: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '/path/to/directory']
    },
    {
        name: 'SQLite (stdio)',
        description: 'SQLite 데이터베이스 접근을 위한 MCP 서버',
        transport: 'stdio' as const,
        command: 'npx',
        args: ['@modelcontextprotocol/server-sqlite', '/path/to/database.db']
    },
    {
        name: 'Git (stdio)',
        description: 'Git 저장소 관리를 위한 MCP 서버',
        transport: 'stdio' as const,
        command: 'npx',
        args: ['@modelcontextprotocol/server-git', '/path/to/repo']
    },
    {
        name: 'Browser (stdio)',
        description: '웹 브라우저 자동화를 위한 MCP 서버',
        transport: 'stdio' as const,
        command: 'npx',
        args: ['@modelcontextprotocol/server-browser']
    },
    {
        name: 'Smithery Server (StreamableHTTP)',
        description: 'Smithery.ai StreamableHTTP MCP 서버',
        transport: 'http' as const,
        url: 'https://server.smithery.ai/@devbrother2024/typescript-mcp-server-boilerplate/mcp'
    },
    {
        name: 'Custom stdio',
        description: '사용자 정의 stdio MCP 서버',
        transport: 'stdio' as const,
        command: '',
        args: []
    },
    {
        name: 'Custom StreamableHTTP',
        description: '사용자 정의 StreamableHTTP MCP 서버',
        transport: 'http' as const,
        url: ''
    }
]

// 로컬 스토리지는 더 이상 사용하지 않음 (데이터베이스로 마이그레이션됨)

// 상태 표시 컴포넌트
function StatusBadge({ status }: { status: MCPServer['status'] }) {
    const config = {
        connected: {
            icon: CheckCircle,
            label: '연결됨',
            variant: 'default' as const,
            className:
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        },
        disconnected: {
            icon: XCircle,
            label: '연결 해제',
            variant: 'secondary' as const,
            className:
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        },
        error: {
            icon: AlertCircle,
            label: '오류',
            variant: 'destructive' as const,
            className:
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        },
        connecting: {
            icon: AlertCircle,
            label: '연결 중',
            variant: 'outline' as const,
            className:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }
    }

    const { icon: Icon, label, className } = config[status]

    return (
        <Badge variant="secondary" className={className}>
            <Icon className="w-3 h-3 mr-1" />
            {label}
        </Badge>
    )
}

// 서버 등록/편집 폼 컴포넌트
function ServerForm({
    server,
    onSave,
    onCancel
}: {
    server?: MCPServer
    onSave: (
        server: Omit<
            MCPServer,
            'id' | 'connected' | 'status' | 'createdAt' | 'updatedAt'
        >
    ) => void
    onCancel: () => void
}) {
    const [formData, setFormData] = useState({
        name: server?.name || '',
        description: server?.description || '',
        transport: server?.transport || ('stdio' as MCPTransportType),
        command: server?.command || '',
        args: server?.args?.join(' ') || '',
        env: JSON.stringify(server?.env || {}, null, 2),
        url: server?.url || '',
        headers: JSON.stringify(server?.headers || {}, null, 2),
        enabled: server?.enabled ?? true
    })
    const [selectedTemplate, setSelectedTemplate] = useState('')

    const handleTemplateSelect = (templateName: string) => {
        const template = SERVER_TEMPLATES.find(t => t.name === templateName)
        if (template) {
            setFormData(prev => ({
                ...prev,
                name: !template.name.startsWith('Custom')
                    ? template.name
                    : prev.name,
                description: template.description,
                transport: template.transport,
                command: template.command || '',
                args: template.args?.join(' ') || '',
                url: template.url || '',
                headers: JSON.stringify({}, null, 2)
            }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const envObj = formData.env.trim() ? JSON.parse(formData.env) : {}
            const headersObj = formData.headers.trim()
                ? JSON.parse(formData.headers)
                : {}
            const argsArray = formData.args.trim()
                ? formData.args.split(' ').filter(arg => arg.trim())
                : []

            onSave({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                transport: formData.transport,
                command:
                    formData.transport === 'stdio'
                        ? formData.command.trim()
                        : undefined,
                args:
                    formData.transport === 'stdio' && argsArray.length > 0
                        ? argsArray
                        : undefined,
                env:
                    formData.transport === 'stdio' &&
                    Object.keys(envObj).length > 0
                        ? envObj
                        : undefined,
                url:
                    formData.transport === 'http'
                        ? formData.url.trim()
                        : undefined,
                headers:
                    formData.transport === 'http' &&
                    Object.keys(headersObj).length > 0
                        ? headersObj
                        : undefined,
                enabled: formData.enabled,
                lastConnected: server?.lastConnected
            })
        } catch {
            alert('환경 변수 JSON 형식이 올바르지 않습니다.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {!server && (
                <div className="space-y-2">
                    <Label htmlFor="template">템플릿 선택</Label>
                    <Select
                        value={selectedTemplate}
                        onValueChange={value => {
                            setSelectedTemplate(value)
                            handleTemplateSelect(value)
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="템플릿을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {SERVER_TEMPLATES.map(template => (
                                <SelectItem
                                    key={template.name}
                                    value={template.name}
                                >
                                    {template.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="name">서버 이름 *</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={e =>
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="MCP 서버 이름을 입력하세요"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">설명</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                        setFormData(prev => ({
                            ...prev,
                            description: e.target.value
                        }))
                    }
                    placeholder="서버에 대한 설명을 입력하세요"
                    rows={2}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="transport">연결 방식 *</Label>
                <Select
                    value={formData.transport}
                    onValueChange={(value: MCPTransportType) =>
                        setFormData(prev => ({ ...prev, transport: value }))
                    }
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="stdio">stdio (프로세스)</SelectItem>
                        <SelectItem value="http">
                            HTTP (StreamableHTTP)
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.transport === 'stdio' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="command">실행 명령어 *</Label>
                        <Input
                            id="command"
                            value={formData.command}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    command: e.target.value
                                }))
                            }
                            placeholder="예: npx, python, node"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="args">명령어 인수</Label>
                        <Input
                            id="args"
                            value={formData.args}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    args: e.target.value
                                }))
                            }
                            placeholder="예: @modelcontextprotocol/server-filesystem /path/to/directory"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="env">환경 변수 (JSON)</Label>
                        <Textarea
                            id="env"
                            value={formData.env}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    env: e.target.value
                                }))
                            }
                            placeholder='{"KEY": "value"}'
                            rows={3}
                            className="font-mono text-sm"
                        />
                    </div>
                </>
            )}

            {formData.transport === 'http' && (
                <>
                    <div className="space-y-2">
                        <Label htmlFor="url">서버 URL *</Label>
                        <Input
                            id="url"
                            value={formData.url}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    url: e.target.value
                                }))
                            }
                            placeholder="예: https://server.example.com/mcp"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="headers">HTTP 헤더 (JSON)</Label>
                        <Textarea
                            id="headers"
                            value={formData.headers}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    headers: e.target.value
                                }))
                            }
                            placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                            rows={3}
                            className="font-mono text-sm"
                        />
                    </div>
                </>
            )}

            <div className="flex items-center space-x-2">
                <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={checked =>
                        setFormData(prev => ({ ...prev, enabled: checked }))
                    }
                />
                <Label htmlFor="enabled">서버 활성화</Label>
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    취소
                </Button>
                <Button type="submit">{server ? '수정' : '등록'}</Button>
            </DialogFooter>
        </form>
    )
}

// 메인 MCP 서버 관리자 컴포넌트
export default function MCPServerManager() {
    const { user } = useAuth()
    const [servers, setServers] = useState<MCPServer[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingServer, setEditingServer] = useState<MCPServer | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [dbLoading, setDbLoading] = useState(true)
    const [viewingServer, setViewingServer] = useState<MCPServer | null>(null)

    const { connectServer, disconnectServer } = useMCPClient()

    // 데이터베이스에서 서버 목록 로드
    useEffect(() => {
        if (!user) return

        const loadServers = async () => {
            try {
                setDbLoading(true)
                const dbServers = await getMCPServers()
                setServers(dbServers)
            } catch (error) {
                console.error('서버 목록 로드 실패:', error)
            } finally {
                setDbLoading(false)
            }
        }

        loadServers()
    }, [user])

    // 새 서버 추가
    const handleAddServer = async (
        serverData: Omit<
            MCPServer,
            'id' | 'connected' | 'status' | 'createdAt' | 'updatedAt'
        >
    ) => {
        if (!user) return

        const newServer: MCPServer = {
            id: Date.now().toString(),
            ...serverData,
            connected: false,
            status: 'disconnected',
            createdAt: new Date(),
            updatedAt: new Date()
        }

        try {
            await saveMCPServer(newServer)
            setServers(prev => [...prev, newServer])
            setIsDialogOpen(false)
        } catch (error) {
            console.error('서버 추가 실패:', error)
        }
    }

    // 서버 수정
    const handleEditServer = async (
        serverData: Omit<
            MCPServer,
            'id' | 'connected' | 'status' | 'createdAt' | 'updatedAt'
        >
    ) => {
        if (!editingServer || !user) return

        const updatedServer: MCPServer = {
            ...editingServer,
            ...serverData,
            updatedAt: new Date()
        }

        try {
            await updateMCPServer(editingServer.id, updatedServer)
            setServers(prev =>
                prev.map(server =>
                    server.id === editingServer.id ? updatedServer : server
                )
            )
            setEditingServer(null)
        } catch (error) {
            console.error('서버 수정 실패:', error)
        }
    }

    // 서버 삭제
    const handleDeleteServer = async (serverId: string) => {
        if (!user || !confirm('정말로 이 서버를 삭제하시겠습니까?')) return

        const server = servers.find(s => s.id === serverId)

        // 연결되어 있다면 먼저 해제
        if (server?.connected) {
            try {
                await disconnectServer(serverId)
            } catch (error) {
                console.error('연결 해제 실패:', error)
            }
        }

        try {
            await deleteMCPServer(serverId)
            setServers(prev => prev.filter(server => server.id !== serverId))
        } catch (error) {
            console.error('서버 삭제 실패:', error)
        }
    }

    // 서버 연결/연결 해제
    const handleToggleConnection = async (serverId: string) => {
        if (!user) return

        setIsLoading(true)

        const server = servers.find(s => s.id === serverId)
        if (!server) {
            setIsLoading(false)
            return
        }

        try {
            if (server.connected) {
                // 연결 해제
                await disconnectServer(serverId)
                const updatedServer = {
                    ...server,
                    connected: false,
                    status: 'disconnected' as const
                }
                // 상태 업데이트
                setServers(prev =>
                    prev.map(s => (s.id === serverId ? updatedServer : s))
                )
                // 데이터베이스 업데이트
                await updateMCPServer(serverId, updatedServer)
            } else {
                // 연결 시도
                await connectServer(server)
                const updatedServer = {
                    ...server,
                    connected: true,
                    status: 'connected' as const,
                    lastConnected: new Date()
                }
                // 상태 업데이트
                setServers(prev =>
                    prev.map(s => (s.id === serverId ? updatedServer : s))
                )
                // 데이터베이스 업데이트
                await updateMCPServer(serverId, updatedServer)
            }
        } catch (error) {
            console.error('연결 토글 실패:', error)
            const errorServer = {
                ...server,
                connected: false,
                status: 'error' as const,
                errorMessage:
                    error instanceof Error ? error.message : '연결 실패'
            }
            // 실패 시 오류 상태로 업데이트
            setServers(prev =>
                prev.map(s => (s.id === serverId ? errorServer : s))
            )
            // 데이터베이스에도 오류 상태 저장
            try {
                await updateMCPServer(serverId, errorServer)
            } catch (updateError) {
                console.error('서버 상태 업데이트 실패:', updateError)
            }
        } finally {
            setIsLoading(false)
        }
    }

    // 서버 활성화/비활성화 토글
    const handleToggleEnabled = async (serverId: string) => {
        if (!user) return

        const server = servers.find(s => s.id === serverId)
        if (!server) return

        const newEnabled = !server.enabled

        // 비활성화하는 경우 연결도 해제
        if (!newEnabled && server.connected) {
            try {
                await disconnectServer(serverId)
            } catch (error) {
                console.error('연결 해제 실패:', error)
            }
        }

        const updatedServer = {
            ...server,
            enabled: newEnabled,
            connected: newEnabled ? server.connected : false,
            status: newEnabled ? server.status : ('disconnected' as const),
            updatedAt: new Date()
        }

        try {
            await updateMCPServer(serverId, updatedServer)
            setServers(prev =>
                prev.map(s => (s.id === serverId ? updatedServer : s))
            )
        } catch (error) {
            console.error('서버 활성화 토글 실패:', error)
        }
    }

    // 서버 세부 정보 보기 화면
    if (viewingServer) {
        return (
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingServer(null)}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        뒤로 가기
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Server className="w-6 h-6" />
                            MCP 서버 관리
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            서버 세부 정보 및 도구 관리
                        </p>
                    </div>
                </div>
                <MCPServerDetails server={viewingServer} />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Server className="w-6 h-6" />
                        MCP 서버 관리
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        MCP 서버를 등록하고 관리할 수 있습니다.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            서버 추가
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>새 MCP 서버 등록</DialogTitle>
                            <DialogDescription>
                                새로운 MCP 서버를 등록합니다. 템플릿을
                                선택하거나 직접 설정할 수 있습니다.
                            </DialogDescription>
                        </DialogHeader>
                        <ServerForm
                            onSave={handleAddServer}
                            onCancel={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* 서버 목록 */}
            <div className="grid gap-4">
                {dbLoading ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-12 h-12 text-muted-foreground mb-4 animate-spin" />
                            <h3 className="text-lg font-semibold mb-2">
                                서버 목록을 불러오는 중...
                            </h3>
                        </CardContent>
                    </Card>
                ) : servers.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Server className="w-12 h-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">
                                등록된 서버가 없습니다
                            </h3>
                            <p className="text-muted-foreground text-center mb-4">
                                첫 번째 MCP 서버를 등록하여 시작해보세요.
                            </p>
                            <Button onClick={() => setIsDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />첫 서버
                                추가하기
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    servers.map(server => (
                        <Card
                            key={server.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {server.name}
                                            <StatusBadge
                                                status={server.status}
                                            />
                                        </CardTitle>
                                        {server.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {server.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={server.enabled}
                                            onCheckedChange={() =>
                                                handleToggleEnabled(server.id)
                                            }
                                            disabled={isLoading}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {server.transport === 'stdio'
                                                ? 'stdio'
                                                : 'StreamableHTTP'}
                                        </Badge>
                                    </div>

                                    {server.transport === 'stdio' ? (
                                        <div className="font-mono bg-muted p-2 rounded text-xs">
                                            {server.command}{' '}
                                            {server.args?.join(' ')}
                                        </div>
                                    ) : (
                                        <div className="font-mono bg-muted p-2 rounded text-xs break-all">
                                            {server.url}
                                        </div>
                                    )}
                                </div>

                                {server.lastConnected && (
                                    <div className="text-xs text-muted-foreground">
                                        마지막 연결:{' '}
                                        {server.lastConnected.toLocaleString()}
                                    </div>
                                )}

                                {server.connected && (
                                    <div className="mt-2">
                                        <ServerStats
                                            serverId={server.id}
                                            isConnected={server.connected}
                                        />
                                    </div>
                                )}

                                {server.errorMessage && (
                                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                                        {server.errorMessage}
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleToggleConnection(
                                                    server.id
                                                )
                                            }
                                            disabled={
                                                !server.enabled || isLoading
                                            }
                                        >
                                            {server.connected ? (
                                                <>
                                                    <PowerOff className="w-4 h-4 mr-1" />
                                                    연결 해제
                                                </>
                                            ) : (
                                                <>
                                                    <Power className="w-4 h-4 mr-1" />
                                                    연결
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setViewingServer(server)
                                            }
                                            title="세부 정보 보기"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setEditingServer(server)
                                            }
                                            title="서버 편집"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleDeleteServer(server.id)
                                            }
                                            disabled={server.connected}
                                            title="서버 삭제"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* 서버 편집 다이얼로그 */}
            <Dialog
                open={!!editingServer}
                onOpenChange={open => !open && setEditingServer(null)}
            >
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>MCP 서버 수정</DialogTitle>
                        <DialogDescription>
                            서버 설정을 수정합니다.
                        </DialogDescription>
                    </DialogHeader>
                    {editingServer && (
                        <ServerForm
                            server={editingServer}
                            onSave={handleEditServer}
                            onCancel={() => setEditingServer(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
