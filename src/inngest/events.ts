import OpenAI from 'openai'

export const AI_WRITING_COMPLETED_EVENT = 'ai/writing-completed'

export type AIWritingRequestCompleted = {
    name: typeof AI_WRITING_COMPLETED_EVENT
    data: {
        result?: string | null
        fullPrompt: OpenAI.ChatCompletionMessage[]
    }
}

export const AI_WRITING_REQUESTED_EVENT = 'ai/writing-requested'

export type AIWritingRequested = {
    name: typeof AI_WRITING_REQUESTED_EVENT
    data: {
        requestId: string
        input: Record<any, any>
    }
}

