import { NextRequest } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// GEMINI_API_KEY는 .env.local에서 가져옴
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

export async function POST(request: NextRequest) {
    try {
        const { message, history } = await request.json()

        if (!message) {
            return new Response('메시지가 필요합니다', { status: 400 })
        }

        // 채팅 세션 생성 (기존 대화 기록 포함)
        const chat = ai.chats.create({
            model: 'gemini-2.0-flash-001',
            config: {
                temperature: 0.7,
                maxOutputTokens: 2048
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
                        if (text) {
                            // SSE 형식으로 데이터 전송
                            const data = `data: ${JSON.stringify({ text })}\n\n`
                            controller.enqueue(encoder.encode(data))
                        }
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
