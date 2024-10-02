import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai'
import { OPENAI_API_HOST } from '@/utils/app/const'
import { NextRequest,NextResponse } from 'next/server'

export const runtime = 'edge';


export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { key } = (await req.json()) as {
      key: string
    }

    const response = await fetch(`${OPENAI_API_HOST}/v1/models`, {
      method : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
        ...(process.env.OPENAI_ORGANIZATION && {
          'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
        }),
      },
    })

    if (response.status === 401) {
      return new NextResponse(response.body, {
        status: 500,
        headers: response.headers,
      })
    } else if (response.status !== 200) {
      console.error(`OpenAI API returned an error ${response.status}: ${await response.text()}`)
      throw new Error('OpenAI API returned an error')
    }

    const json = await response.json()

    const models: OpenAIModel[] = json.data
      .map((model: any) => {
        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model.id) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
            }
          }
        }
      })
      .filter(Boolean)

    return new NextResponse(JSON.stringify(models), { status: 200 })
  } catch (error) {
    console.error(error)
    return new NextResponse('Error', { status: 500 })
  }
}
