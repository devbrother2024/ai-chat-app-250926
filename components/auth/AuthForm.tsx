'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AlertTriangle,
    Loader2,
    Mail,
    Lock,
    User,
    MessageSquare
} from 'lucide-react'

interface AuthFormProps {
    mode: 'signin' | 'signup'
    onModeChange: (mode: 'signin' | 'signup') => void
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
    const { signIn, signUp } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            setError('이메일과 비밀번호를 입력해주세요.')
            return
        }

        if (password.length < 6) {
            setError('비밀번호는 최소 6자 이상이어야 합니다.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { error } =
                mode === 'signin'
                    ? await signIn(email, password)
                    : await signUp(email, password)

            if (error) {
                switch (error.message) {
                    case 'Invalid login credentials':
                        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
                        break
                    case 'User already registered':
                        setError('이미 등록된 이메일입니다.')
                        break
                    case 'Email not confirmed':
                        setError(
                            '이메일 인증이 필요합니다. 이메일을 확인해주세요.'
                        )
                        break
                    default:
                        setError(error.message)
                }
            } else if (mode === 'signup') {
                setError('')
                alert(
                    '회원가입이 완료되었습니다! 이메일을 확인하여 계정을 인증해주세요.'
                )
            }
        } catch (err) {
            setError('예상치 못한 오류가 발생했습니다.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-6">
                {/* 앱 로고/제목 */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                        <MessageSquare className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-bold">AI 채팅</h1>
                    <p className="text-muted-foreground">
                        {mode === 'signin'
                            ? '계정에 로그인하여 채팅을 시작하세요'
                            : '새 계정을 만들어 채팅을 시작하세요'}
                    </p>
                </div>

                {/* 인증 폼 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">
                            {mode === 'signin' ? '로그인' : '회원가입'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">이메일</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="example@email.com"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">비밀번호</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={e =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="최소 6자 이상"
                                        className="pl-10"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {error}
                                    </p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        처리 중...
                                    </>
                                ) : (
                                    <>
                                        {mode === 'signin' ? (
                                            <>
                                                <User className="w-4 h-4 mr-2" />
                                                로그인
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="w-4 h-4 mr-2" />
                                                회원가입
                                            </>
                                        )}
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="text-center">
                            <Button
                                type="button"
                                variant="link"
                                onClick={() =>
                                    onModeChange(
                                        mode === 'signin' ? 'signup' : 'signin'
                                    )
                                }
                                className="text-sm"
                            >
                                {mode === 'signin'
                                    ? '계정이 없으신가요? 회원가입'
                                    : '이미 계정이 있으신가요? 로그인'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* 보안 안내 */}
                <div className="text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                        이 서비스는 Supabase Auth를 사용하여 안전하게
                        보호됩니다.
                    </p>
                    <p className="text-xs text-muted-foreground">
                        채팅 내역은 로컬에만 저장되며, 개인정보는 암호화됩니다.
                    </p>
                </div>
            </div>
        </div>
    )
}
