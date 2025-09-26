import { NextRequest } from 'next/server'
import {
    GoogleGenAI,
    FunctionCallingConfigMode,
    mcpToTool
} from '@google/genai'
import { mcpServerManager } from '@/lib/mcp-client-server'

// GEMINI_API_KEY는 .env.local에서 가져옴
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request: NextRequest) {
    try {
        const { message, history, enableMCP = true } = await request.json()

        if (!message) {
            return new Response('메시지가 필요합니다', { status: 400 })
        }

        // MCP 도구 설정
        const tools: unknown[] = []
        const toolConfig: Record<string, unknown> = {}

        if (enableMCP) {
            try {
                const activeClients = mcpServerManager.getAllActiveClients()
                if (activeClients.length > 0) {
                    // 모든 활성 MCP 클라이언트를 도구로 변환
                    tools.push(
                        ...activeClients.map(client => mcpToTool(client))
                    )

                    Object.assign(toolConfig, {
                        functionCallingConfig: {
                            mode: FunctionCallingConfigMode.AUTO
                        }
                    })

                    console.log(
                        `${activeClients.length}개의 MCP 서버 도구가 활성화되었습니다`
                    )
                }
            } catch (error) {
                console.error('MCP 도구 설정 중 오류:', error)
                // MCP 오류가 있어도 일반 채팅은 계속 진행
            }
        }

        // 채팅 세션 생성 (기존 대화 기록 포함)
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-001',
            config: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                tools: tools.length > 0 ? tools : undefined,
                ...toolConfig
            },
            history: history || []
        })

        // 스트리밍 응답 생성
        const stream = await chat.sendMessageStream({ message })

        // ReadableStream 생성하여 SSE 형태로 응답
        const encoder = new TextEncoder()
        const readableStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        const text = chunk.text || ''

                        // 도구 호출 정보가 있는지 확인
                        const functionCalls = chunk.functionCalls || []

                        // 텍스트가 있으면 전송
                        if (text) {
                            const data = `data: ${JSON.stringify({
                                type: 'text',
                                text
                            })}\n\n`
                            controller.enqueue(encoder.encode(data))
                        }

                        // 함수 호출 정보가 있으면 전송
                        if (functionCalls.length > 0) {
                            for (const call of functionCalls) {
                                const functionData = `data: ${JSON.stringify({
                                    type: 'function_call',
                                    function: {
                                        name: call.name,
                                        arguments: call.args
                                    }
                                })}\n\n`
                                controller.enqueue(encoder.encode(functionData))
                            }
                        }

                        // 함수 응답은 현재 Gemini 스트리밍에서 별도로 제공되지 않으므로
                        // 함수 호출이 포함된 경우 자동으로 처리됨
                    }

                    // 스트림 종료 신호
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                } catch (error) {
                    console.error('스트리밍 오류:', error)
                    controller.error(error)
                }
            }
        })

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            }
        })
    } catch (error) {
        console.error('API 오류:', error)
        return new Response('서버 오류가 발생했습니다', { status: 500 })
    }
}
