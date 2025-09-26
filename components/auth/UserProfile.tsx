'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { User, LogOut, Mail, Calendar } from 'lucide-react'

export function UserProfile() {
    const { user, signOut } = useAuth()
    const [open, setOpen] = useState(false)

    if (!user) return null

    const handleSignOut = async () => {
        await signOut()
        setOpen(false)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="사용자 프로필">
                    <User className="w-5 h-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>사용자 프로필</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center justify-center">
                        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-primary-foreground" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">이메일</p>
                                <p className="text-sm text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {user.created_at && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        가입일
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(user.created_at)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t">
                        <Button
                            onClick={handleSignOut}
                            variant="outline"
                            className="w-full"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            로그아웃
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
