'use client'

import React, { useState, useEffect } from 'react'
import {
    Server,
    Plus,
    Trash2,
    Edit3,
    Power,
    PowerOff,
    CheckCircle,
    XCircle,
    AlertCircle
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

// MCP 서버 타입 정의
interface MCPServer {
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

// 사전 정의된 MCP 서버 템플릿
const SERVER_TEMPLATES = [
    {
        name: 'File System',
        description: '파일 시스템 접근을 위한 MCP 서버',
        command: 'npx',
        args: ['@modelcontextprotocol/server-filesystem', '/path/to/directory']
    },
    {
        name: 'SQLite',
        description: 'SQLite 데이터베이스 접근을 위한 MCP 서버',
        command: 'npx',
        args: ['@modelcontextprotocol/server-sqlite', '/path/to/database.db']
    },
    {
        name: 'Git',
        description: 'Git 저장소 관리를 위한 MCP 서버',
        command: 'npx',
        args: ['@modelcontextprotocol/server-git', '/path/to/repo']
    },
    {
        name: 'Browser',
        description: '웹 브라우저 자동화를 위한 MCP 서버',
        command: 'npx',
        args: ['@modelcontextprotocol/server-browser']
    },
    {
        name: 'Custom',
        description: '사용자 정의 MCP 서버',
        command: '',
        args: []
    }
]

const STORAGE_KEY = 'mcp-servers'

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
        command: server?.command || '',
        args: server?.args?.join(' ') || '',
        env: JSON.stringify(server?.env || {}, null, 2),
        enabled: server?.enabled ?? true
    })
    const [selectedTemplate, setSelectedTemplate] = useState('')

    const handleTemplateSelect = (templateName: string) => {
        const template = SERVER_TEMPLATES.find(t => t.name === templateName)
        if (template) {
            setFormData(prev => ({
                ...prev,
                name: template.name !== 'Custom' ? template.name : prev.name,
                description: template.description,
                command: template.command,
                args: template.args.join(' ')
            }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const envObj = formData.env.trim() ? JSON.parse(formData.env) : {}
            const argsArray = formData.args.trim()
                ? formData.args.split(' ').filter(arg => arg.trim())
                : []

            onSave({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                command: formData.command.trim(),
                args: argsArray.length > 0 ? argsArray : undefined,
                env: Object.keys(envObj).length > 0 ? envObj : undefined,
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
                        setFormData(prev => ({ ...prev, args: e.target.value }))
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
                        setFormData(prev => ({ ...prev, env: e.target.value }))
                    }
                    placeholder='{"KEY": "value"}'
                    rows={3}
                    className="font-mono text-sm"
                />
            </div>

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
    const [servers, setServers] = useState<MCPServer[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingServer, setEditingServer] = useState<MCPServer | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // localStorage에서 서버 목록 로드
    useEffect(() => {
        const savedServers = localStorage.getItem(STORAGE_KEY)
        if (savedServers) {
            try {
                const parsed: MCPServer[] = JSON.parse(savedServers)
                const serversWithDate = parsed.map(server => ({
                    ...server,
                    createdAt: new Date(server.createdAt),
                    updatedAt: new Date(server.updatedAt),
                    lastConnected: server.lastConnected
                        ? new Date(server.lastConnected)
                        : undefined
                }))
                setServers(serversWithDate)
            } catch (error) {
                console.error('서버 목록 로드 실패:', error)
            }
        }
    }, [])

    // 서버 목록을 localStorage에 저장
    const saveServers = (updatedServers: MCPServer[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedServers))
        setServers(updatedServers)
    }

    // 새 서버 추가
    const handleAddServer = (
        serverData: Omit<
            MCPServer,
            'id' | 'connected' | 'status' | 'createdAt' | 'updatedAt'
        >
    ) => {
        const newServer: MCPServer = {
            id: Date.now().toString(),
            ...serverData,
            connected: false,
            status: 'disconnected',
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const updatedServers = [...servers, newServer]
        saveServers(updatedServers)
        setIsDialogOpen(false)
    }

    // 서버 수정
    const handleEditServer = (
        serverData: Omit<
            MCPServer,
            'id' | 'connected' | 'status' | 'createdAt' | 'updatedAt'
        >
    ) => {
        if (!editingServer) return

        const updatedServer: MCPServer = {
            ...editingServer,
            ...serverData,
            updatedAt: new Date()
        }

        const updatedServers = servers.map(server =>
            server.id === editingServer.id ? updatedServer : server
        )
        saveServers(updatedServers)
        setEditingServer(null)
    }

    // 서버 삭제
    const handleDeleteServer = (serverId: string) => {
        if (confirm('정말로 이 서버를 삭제하시겠습니까?')) {
            const updatedServers = servers.filter(
                server => server.id !== serverId
            )
            saveServers(updatedServers)
        }
    }

    // 서버 연결/연결 해제 (현재는 UI만 구현)
    const handleToggleConnection = async (serverId: string) => {
        setIsLoading(true)

        const server = servers.find(s => s.id === serverId)
        if (!server) return

        // TODO: 실제 MCP 클라이언트 구현 시 여기에 연결 로직 추가

        // 현재는 시뮬레이션
        const updatedServers = servers.map(s => {
            if (s.id === serverId) {
                const newConnected = !s.connected
                return {
                    ...s,
                    connected: newConnected,
                    status: newConnected
                        ? ('connected' as const)
                        : ('disconnected' as const),
                    lastConnected: newConnected ? new Date() : s.lastConnected,
                    errorMessage: undefined
                }
            }
            return s
        })

        // 연결 지연 시뮬레이션
        setTimeout(() => {
            saveServers(updatedServers)
            setIsLoading(false)
        }, 1000)
    }

    // 서버 활성화/비활성화 토글
    const handleToggleEnabled = (serverId: string) => {
        const updatedServers = servers.map(server => {
            if (server.id === serverId) {
                const newEnabled = !server.enabled
                return {
                    ...server,
                    enabled: newEnabled,
                    connected: newEnabled ? server.connected : false,
                    status: newEnabled
                        ? server.status
                        : ('disconnected' as const),
                    updatedAt: new Date()
                }
            }
            return server
        })
        saveServers(updatedServers)
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
                {servers.length === 0 ? (
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
                                <div className="text-sm">
                                    <div className="font-mono bg-muted p-2 rounded text-xs">
                                        {server.command}{' '}
                                        {server.args?.join(' ')}
                                    </div>
                                </div>

                                {server.lastConnected && (
                                    <div className="text-xs text-muted-foreground">
                                        마지막 연결:{' '}
                                        {server.lastConnected.toLocaleString()}
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
                                                setEditingServer(server)
                                            }
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
