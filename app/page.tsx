'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Send,
    Settings,
    Bot,
    User,
    Loader2,
    Trash2,
    AlertTriangle,
    Copy,
    Check,
    Plus,
    MessageSquare,
    Server
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import MCPServerManager from '@/components/mcp-server-manager'

interface Message {
    id: string
    content: string
    sender: 'user' | 'ai'
    timestamp: Date
    isStreaming?: boolean
}

interface ChatSession {
    id: string
    title: string
    messages: Message[]
    createdAt: Date
    updatedAt: Date
}

const STORAGE_KEY = 'ai-chat-history'
const SESSIONS_STORAGE_KEY = 'ai-chat-sessions'
const CURRENT_SESSION_KEY = 'ai-current-session'

// 마크다운 렌더링 컴포넌트
interface MarkdownRendererProps {
    content: string
    isUser: boolean
}

// React 요소에서 텍스트 콘텐츠 추출하는 함수
function extractTextContent(node: React.ReactNode): string {
    if (typeof node === 'string') return node
    if (typeof node === 'number') return String(node)
    if (Array.isArray(node)) {
        return node.map(extractTextContent).join('')
    }
    if (React.isValidElement(node) && node.props) {
        return extractTextContent(
            (node.props as { children?: React.ReactNode }).children
        )
    }
    return ''
}

// 코드블록 복사 컴포넌트
function CodeBlock({
    language,
    children
}: {
    language?: string
    children: React.ReactNode
}) {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(extractTextContent(children))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('복사에 실패했습니다:', err)
        }
    }

    return (
        <Card className="w-full max-w-full p-0 border border-border">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
                <span className="text-xs text-muted-foreground font-mono">
                    {language || 'code'}
                </span>
                <Button
                    onClick={copyToClipboard}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    title="코드 복사"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 mr-1" />
                            복사됨
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3 mr-1" />
                            복사
                        </>
                    )}
                </Button>
            </div>
            <CardContent className="p-0">
                <pre className="p-3 whitespace-pre-wrap break-words overflow-hidden text-sm font-mono bg-muted/20">
                    <code
                        className={
                            language ? `language-${language}` : undefined
                        }
                    >
                        {children}
                    </code>
                </pre>
            </CardContent>
        </Card>
    )
}

function MarkdownRenderer({ content, isUser }: MarkdownRendererProps) {
    if (isUser) {
        // 사용자 메시지는 플레인 텍스트로 표시
        return <p className="whitespace-pre-wrap flex-1">{content}</p>
    }

    // AI 메시지는 마크다운 렌더링
    const components: Components = {
        // pre 태그 (코드 블록) 처리
        pre({ children }) {
            // React 요소 타입 체크
            if (React.isValidElement(children) && children.props) {
                const className = (children.props as { className?: string })
                    .className
                if (className) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeContent = extractTextContent(
                        (children.props as { children?: React.ReactNode })
                            .children
                    ).replace(/\n$/, '')
                    return (
                        <CodeBlock language={match?.[1]}>
                            {codeContent}
                        </CodeBlock>
                    )
                }

                // 언어가 명시되지 않은 코드블록
                const codeContent = extractTextContent(
                    (children.props as { children?: React.ReactNode }).children
                )
                return <CodeBlock>{codeContent}</CodeBlock>
            }

            // children이 React 요소가 아닌 경우
            return <CodeBlock>{extractTextContent(children)}</CodeBlock>
        },

        // 인라인 코드 처리
        code({ children, ...props }) {
            // pre 태그 안의 code는 이미 위에서 처리됨
            return (
                <code
                    className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm"
                    {...props}
                >
                    {children}
                </code>
            )
        },
        // 링크 스타일링
        a({ children, href, ...props }) {
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    {...props}
                >
                    {children}
                </a>
            )
        },
        // 제목 스타일링
        h1: ({ children }) => (
            <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>
        ),
        h2: ({ children }) => (
            <h2 className="text-md font-bold mt-3 mb-2">{children}</h2>
        ),
        h3: ({ children }) => (
            <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>
        ),
        // 리스트 스타일링
        ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1">
                {children}
            </ol>
        ),
        // 인용문 스타일링
        blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic">
                {children}
            </blockquote>
        ),
        // 단락 스타일링
        p: ({ children }) => <p className="my-1">{children}</p>
    }

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert flex-1">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    )
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showWarning, setShowWarning] = useState(true)
    const [currentSessionId, setCurrentSessionId] = useState<string>('')
    const [sessions, setSessions] = useState<ChatSession[]>([])
    const [currentView, setCurrentView] = useState<'chat' | 'mcp-manager'>(
        'chat'
    )
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // 채팅 제목 생성 함수
    const generateChatTitle = (firstMessage: string): string => {
        const maxLength = 30
        const cleaned = firstMessage.trim().replace(/\n/g, ' ')
        if (cleaned.length <= maxLength) return cleaned
        return cleaned.substring(0, maxLength) + '...'
    }

    // 새 세션 생성
    const createNewSession = useCallback((): string => {
        const newSessionId = Date.now().toString()
        const newSession: ChatSession = {
            id: newSessionId,
            title: '새로운 채팅',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }

        setSessions(prev => {
            const updatedSessions = [newSession, ...prev]
            // localStorage에 저장
            localStorage.setItem(
                SESSIONS_STORAGE_KEY,
                JSON.stringify(updatedSessions)
            )
            return updatedSessions
        })
        setCurrentSessionId(newSessionId)
        setMessages([])
        localStorage.setItem(CURRENT_SESSION_KEY, newSessionId)

        return newSessionId
    }, [])

    // 세션 전환
    const switchToSession = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId)
        if (session) {
            setCurrentSessionId(sessionId)
            setMessages(
                session.messages.map(msg => ({
                    ...msg,
                    timestamp: new Date(msg.timestamp)
                }))
            )
            localStorage.setItem(CURRENT_SESSION_KEY, sessionId)
        }
    }

    // 현재 세션 업데이트
    const updateCurrentSession = useCallback(
        (messages: Message[]) => {
            if (!currentSessionId) return

            setSessions(prev =>
                prev.map(session => {
                    if (session.id === currentSessionId) {
                        const updatedSession = {
                            ...session,
                            messages,
                            updatedAt: new Date(),
                            // 첫 번째 사용자 메시지로 제목 업데이트
                            title:
                                messages.length > 0 &&
                                session.title === '새로운 채팅'
                                    ? generateChatTitle(
                                          messages.find(
                                              m => m.sender === 'user'
                                          )?.content || '새로운 채팅'
                                      )
                                    : session.title
                        }
                        return updatedSession
                    }
                    return session
                })
            )
        },
        [currentSessionId]
    )

    // 컴포넌트 마운트 시 세션들과 현재 세션 로드
    useEffect(() => {
        // 기존 세션들 로드
        const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY)
        const savedCurrentSessionId = localStorage.getItem(CURRENT_SESSION_KEY)

        if (savedSessions) {
            try {
                const parsed: ChatSession[] = JSON.parse(savedSessions)
                const sessionsWithDate = parsed.map(session => ({
                    ...session,
                    createdAt: new Date(session.createdAt),
                    updatedAt: new Date(session.updatedAt),
                    messages: session.messages.map(msg => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }))
                setSessions(sessionsWithDate)

                // 현재 세션 설정
                if (
                    savedCurrentSessionId &&
                    sessionsWithDate.find(s => s.id === savedCurrentSessionId)
                ) {
                    setCurrentSessionId(savedCurrentSessionId)
                    const currentSession = sessionsWithDate.find(
                        s => s.id === savedCurrentSessionId
                    )
                    if (currentSession) {
                        setMessages(currentSession.messages)
                    }
                } else if (sessionsWithDate.length > 0) {
                    // 가장 최근 세션을 현재 세션으로 설정
                    const latestSession = sessionsWithDate[0]
                    setCurrentSessionId(latestSession.id)
                    setMessages(latestSession.messages)
                    localStorage.setItem(CURRENT_SESSION_KEY, latestSession.id)
                }
            } catch (error) {
                console.error('세션 로드 실패:', error)
                // 오류 발생 시 새 세션 생성
                createNewSession()
            }
        } else {
            // 저장된 세션이 없으면 기존 메시지 마이그레이션 시도
            const savedMessages = localStorage.getItem(STORAGE_KEY)
            if (savedMessages) {
                try {
                    const parsed = JSON.parse(savedMessages)
                    const messagesWithDate = parsed.map(
                        (msg: Message & { timestamp: string }) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        })
                    )

                    // 기존 메시지로 첫 번째 세션 생성
                    const firstSessionId = Date.now().toString()
                    const firstSession: ChatSession = {
                        id: firstSessionId,
                        title:
                            messagesWithDate.length > 0
                                ? generateChatTitle(
                                      messagesWithDate.find(
                                          (m: Message) => m.sender === 'user'
                                      )?.content || '이전 채팅'
                                  )
                                : '이전 채팅',
                        messages: messagesWithDate,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }

                    setSessions([firstSession])
                    setCurrentSessionId(firstSessionId)
                    setMessages(messagesWithDate)

                    // 새 형식으로 저장
                    localStorage.setItem(
                        SESSIONS_STORAGE_KEY,
                        JSON.stringify([firstSession])
                    )
                    localStorage.setItem(CURRENT_SESSION_KEY, firstSessionId)

                    // 기존 저장소 정리
                    localStorage.removeItem(STORAGE_KEY)
                } catch (error) {
                    console.error('기존 채팅 기록 마이그레이션 실패:', error)
                    createNewSession()
                }
            } else {
                // 완전히 새로운 사용자
                createNewSession()
            }
        }
    }, [createNewSession])

    // 메시지 변경 시 현재 세션 업데이트 및 localStorage에 저장
    useEffect(() => {
        if (messages.length > 0 && currentSessionId) {
            updateCurrentSession(messages)

            // sessions 상태가 업데이트된 후 localStorage에 저장
            const timer = setTimeout(() => {
                setSessions(currentSessions => {
                    localStorage.setItem(
                        SESSIONS_STORAGE_KEY,
                        JSON.stringify(currentSessions)
                    )
                    return currentSessions
                })
            }, 100)

            return () => clearTimeout(timer)
        }
    }, [messages, currentSessionId, updateCurrentSession])

    // 새 메시지 추가 시 스크롤 하단으로 이동
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputValue.trim(),
            sender: 'user',
            timestamp: new Date()
        }

        const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: '',
            sender: 'ai',
            timestamp: new Date(),
            isStreaming: true
        }

        setMessages(prev => [...prev, userMessage, aiMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            // 대화 기록 준비 (최근 10개 메시지만)
            const recentMessages = messages.slice(-10).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }))

            const response = await fetch('/api/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: recentMessages
                })
            })

            if (!response.ok) {
                throw new Error('응답 실패')
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('스트림 리더를 생성할 수 없습니다')
            }

            let accumulatedText = ''

            while (true) {
                const { done, value } = await reader.read()

                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)

                        if (data === '[DONE]') {
                            // 스트리밍 완료
                            setMessages(prev =>
                                prev.map(msg =>
                                    msg.id === aiMessage.id
                                        ? { ...msg, isStreaming: false }
                                        : msg
                                )
                            )
                            return
                        }

                        try {
                            const parsed = JSON.parse(data)
                            if (parsed.text) {
                                accumulatedText += parsed.text

                                // 실시간으로 AI 메시지 업데이트
                                setMessages(prev =>
                                    prev.map(msg =>
                                        msg.id === aiMessage.id
                                            ? {
                                                  ...msg,
                                                  content: accumulatedText
                                              }
                                            : msg
                                    )
                                )
                            }
                        } catch (error) {
                            console.error('JSON 파싱 오류:', error)
                        }
                    }
                }
            }
        } catch (error) {
            console.error('메시지 전송 오류:', error)
            // 오류 발생 시 AI 메시지를 오류 메시지로 업데이트
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === aiMessage.id
                        ? {
                              ...msg,
                              content:
                                  '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
                              isStreaming: false
                          }
                        : msg
                )
            )
        } finally {
            setIsLoading(false)
        }
    }

    const clearCurrentChat = () => {
        if (!currentSessionId) return

        setMessages([])
        setSessions(prev =>
            prev.map(session =>
                session.id === currentSessionId
                    ? { ...session, messages: [], updatedAt: new Date() }
                    : session
            )
        )

        // localStorage 업데이트
        setTimeout(() => {
            setSessions(currentSessions => {
                localStorage.setItem(
                    SESSIONS_STORAGE_KEY,
                    JSON.stringify(currentSessions)
                )
                return currentSessions
            })
        }, 100)
    }

    const deleteSession = useCallback(
        (sessionId: string) => {
            setSessions(prev => {
                const updatedSessions = prev.filter(
                    session => session.id !== sessionId
                )

                if (sessionId === currentSessionId) {
                    if (updatedSessions.length > 0) {
                        // 다른 세션으로 전환
                        const nextSession = updatedSessions[0]
                        setCurrentSessionId(nextSession.id)
                        setMessages(nextSession.messages)
                        localStorage.setItem(
                            CURRENT_SESSION_KEY,
                            nextSession.id
                        )
                    } else {
                        // 마지막 세션이었다면 새 세션 생성 (비동기로 처리)
                        setTimeout(() => createNewSession(), 0)
                    }
                }

                localStorage.setItem(
                    SESSIONS_STORAGE_KEY,
                    JSON.stringify(updatedSessions)
                )
                return updatedSessions
            })
        },
        [currentSessionId, createNewSession]
    )

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className="flex h-screen bg-background">
            {/* 사이드바 - 세션 리스트 */}
            <aside className="w-64 border-r border-border bg-muted/20 flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-sm">채팅 기록</h2>
                        <Button
                            onClick={createNewSession}
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                        >
                            <Plus className="w-4 h-4 mr-1" />새 채팅
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => switchToSession(session.id)}
                            className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                                session.id === currentSessionId
                                    ? 'bg-muted'
                                    : ''
                            }`}
                        >
                            <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {session.title}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {session.messages.length}개 메시지
                                </div>
                            </div>
                            <Button
                                onClick={e => {
                                    e.stopPropagation()
                                    deleteSession(session.id)
                                }}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* 메인 채팅 영역 */}
            <div className="flex flex-col flex-1">
                {/* 상단 헤더 */}
                <header className="border-b border-border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold">AI 채팅</h1>
                        {/* 현재 세션 제목 */}
                        <div className="text-sm text-muted-foreground">
                            {sessions.find(s => s.id === currentSessionId)
                                ?.title || '새로운 채팅'}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() =>
                                setCurrentView(
                                    currentView === 'chat'
                                        ? 'mcp-manager'
                                        : 'chat'
                                )
                            }
                            variant="ghost"
                            size="icon"
                            aria-label="MCP 서버 관리"
                            title="MCP 서버 관리"
                        >
                            <Server className="w-5 h-5" />
                        </Button>
                        {currentView === 'chat' && (
                            <Button
                                onClick={clearCurrentChat}
                                variant="ghost"
                                size="icon"
                                aria-label="현재 채팅 지우기"
                                title="현재 채팅 지우기"
                            >
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" aria-label="설정">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                </header>

                {/* 보안 경고 배너 */}
                {showWarning && currentView === 'chat' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 flex-1">
                                채팅 내역이 브라우저에 로컬 저장됩니다. 공용
                                또는 공유 PC에서는 민감한 정보 입력을
                                주의해주세요.
                            </p>
                            <Button
                                onClick={() => setShowWarning(false)}
                                variant="ghost"
                                size="sm"
                                className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 h-6"
                            >
                                닫기
                            </Button>
                        </div>
                    </div>
                )}

                {/* 메인 컨텐츠 영역 */}
                {currentView === 'chat' ? (
                    <>
                        {/* 채팅 메시지 영역 */}
                        <main className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <Bot className="w-12 h-12 mb-4" />
                                    <p className="text-lg">
                                        새로운 대화를 시작해보세요
                                    </p>
                                    <p className="text-sm">
                                        메시지를 입력하고 전송 버튼을 눌러주세요
                                    </p>
                                </div>
                            ) : (
                                messages.map(message => (
                                    <div
                                        key={message.id}
                                        className={`flex gap-3 ${
                                            message.sender === 'user'
                                                ? 'justify-end'
                                                : 'justify-start'
                                        }`}
                                    >
                                        {message.sender === 'ai' && (
                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                                <Bot className="w-4 h-4 text-primary-foreground" />
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                                message.sender === 'user'
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            <div className="flex items-start gap-2">
                                                {message.content ? (
                                                    <MarkdownRenderer
                                                        content={
                                                            message.content
                                                        }
                                                        isUser={
                                                            message.sender ===
                                                            'user'
                                                        }
                                                    />
                                                ) : (
                                                    <p className="whitespace-pre-wrap flex-1">
                                                        {message.isStreaming
                                                            ? ''
                                                            : '메시지를 생성 중입니다...'}
                                                    </p>
                                                )}
                                                {message.isStreaming && (
                                                    <Loader2 className="w-4 h-4 animate-spin mt-1 flex-shrink-0" />
                                                )}
                                            </div>
                                            <time className="text-xs opacity-70 mt-1 block">
                                                {message.timestamp.toLocaleTimeString()}
                                            </time>
                                        </div>

                                        {message.sender === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                                <User className="w-4 h-4 text-secondary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </main>

                        {/* 하단 입력 영역 */}
                        <footer className="border-t border-border p-4">
                            <div className="flex gap-2 items-end">
                                <div className="flex-1 relative">
                                    <Textarea
                                        value={inputValue}
                                        onChange={e =>
                                            setInputValue(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        placeholder='메시지를 입력하세요... ("/" 키로 프롬프트 힌트)'
                                        className="resize-none min-h-[40px] max-h-[120px]"
                                        rows={1}
                                        style={{
                                            height: 'auto',
                                            minHeight: '40px'
                                        }}
                                        onInput={e => {
                                            const target =
                                                e.target as HTMLTextAreaElement
                                            target.style.height = 'auto'
                                            target.style.height =
                                                Math.min(
                                                    target.scrollHeight,
                                                    120
                                                ) + 'px'
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!inputValue.trim() || isLoading}
                                    size="icon"
                                    className="w-10 h-10"
                                    aria-label="메시지 전송"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </footer>
                    </>
                ) : (
                    /* MCP 서버 관리 화면 */
                    <main className="flex-1 overflow-y-auto">
                        <MCPServerManager />
                    </main>
                )}
            </div>
        </div>
    )
}
