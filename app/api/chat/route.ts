import { ChatBody, Message } from '@/types/chat'
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const'
import { OpenAIError, OpenAIStream } from '@/utils/server'
import { getTiktokenEncoding } from '@/utils/server/tiktoken'
import { NextRequest, NextResponse } from 'next/server'

export const runtime =  'edge';

export async function POST (req: NextRequest): Promise<NextResponse> {
  const encoding = await getTiktokenEncoding()
  try {
    const { model, messages, key } = (await req.json()) as ChatBody

    let promptToSend = DEFAULT_SYSTEM_PROMPT
    

    const prompt_tokens = encoding.encode(promptToSend)

    let tokenCount = prompt_tokens.length
    let messagesToSend: Message[] = []

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i]
      const tokens = encoding.encode(message.content)

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break
      }
      tokenCount += tokens.length
      messagesToSend = [message, ...messagesToSend]
    }

    const stream = await OpenAIStream(model, promptToSend, key, messagesToSend)

    return new NextResponse(stream, {
      status: 200,
      headers: { statusText: 'success', 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error) {
    console.error(error)
    if (error instanceof OpenAIError) {
      return new NextResponse('Error', { status: 500, statusText: error.message })
    } else {
      return new NextResponse('Error', { status: 500 })
    }
  } finally {
    encoding.free()
  }
}
