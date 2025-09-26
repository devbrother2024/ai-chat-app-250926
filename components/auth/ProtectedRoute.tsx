'use client'

import { useAuth } from '@/contexts/AuthContext'
import { AuthPage } from './AuthPage'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-muted-foreground">로딩 중...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return <AuthPage />
    }

    return <>{children}</>
}
