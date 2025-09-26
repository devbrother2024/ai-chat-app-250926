import { NextRequest, NextResponse } from 'next/server'
import { mcpServerManager } from '@/lib/mcp-client-server'

// MCP 서버 관리 API
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    try {
        const { action } = await params
        const body = await request.json()

        switch (action) {
            case 'connect': {
                const { server } = body
                await mcpServerManager.connect(server)
                return NextResponse.json({ success: true })
            }

            case 'disconnect': {
                const { serverId } = body
                await mcpServerManager.disconnect(serverId)
                return NextResponse.json({ success: true })
            }

            case 'status': {
                const { serverId } = body
                const status = await mcpServerManager.checkServerStatus(
                    serverId
                )
                return NextResponse.json({ status })
            }

            case 'list-resources': {
                const { serverId } = body
                const resources = await mcpServerManager.listResources(serverId)
                return NextResponse.json({ resources })
            }

            case 'list-tools': {
                const { serverId } = body
                const tools = await mcpServerManager.listTools(serverId)
                return NextResponse.json({ tools })
            }

            case 'list-prompts': {
                const { serverId } = body
                const prompts = await mcpServerManager.listPrompts(serverId)
                return NextResponse.json({ prompts })
            }

            case 'call-tool': {
                const { serverId, toolName, args } = body
                const result = await mcpServerManager.callTool(
                    serverId,
                    toolName,
                    args
                )
                return NextResponse.json({ result })
            }

            case 'read-resource': {
                const { serverId, uri } = body
                const resource = await mcpServerManager.readResource(
                    serverId,
                    uri
                )
                return NextResponse.json({ resource })
            }

            case 'get-prompt': {
                const { serverId, promptName, args } = body
                const prompt = await mcpServerManager.getPrompt(
                    serverId,
                    promptName,
                    args
                )
                return NextResponse.json({ prompt })
            }

            default:
                return NextResponse.json(
                    { error: '지원하지 않는 액션입니다' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('MCP API 오류:', error)
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : '알 수 없는 오류가 발생했습니다',
                success: false
            },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    try {
        const { action } = await params
        const { searchParams } = new URL(request.url)
        const serverId = searchParams.get('serverId')

        if (!serverId) {
            return NextResponse.json(
                { error: 'serverId가 필요합니다' },
                { status: 400 }
            )
        }

        switch (action) {
            case 'status': {
                const status = await mcpServerManager.checkServerStatus(
                    serverId
                )
                return NextResponse.json({ status })
            }

            case 'list-resources': {
                const resources = await mcpServerManager.listResources(serverId)
                return NextResponse.json({ resources })
            }

            case 'list-tools': {
                const tools = await mcpServerManager.listTools(serverId)
                return NextResponse.json({ tools })
            }

            case 'list-prompts': {
                const prompts = await mcpServerManager.listPrompts(serverId)
                return NextResponse.json({ prompts })
            }

            default:
                return NextResponse.json(
                    { error: '지원하지 않는 액션입니다' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('MCP API 오류:', error)
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : '알 수 없는 오류가 발생했습니다',
                success: false
            },
            { status: 500 }
        )
    }
}
