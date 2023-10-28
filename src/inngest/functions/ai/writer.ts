import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_COMPLETED_EVENT, AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {type ChatCompletionRequestMessage} from "openai-edge";
import {promptStep} from "@/lib/prompt-step";

/**
 * TODO: migrate prompts to sanity
 */
export const writeAnEmail = inngest.createFunction(
  {id: `gpt-4-writer`, name: 'GPT-4 Writer'},
  {event: AI_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {

    const systemPrompt: string = event.data.input.instructions || `You craft thoughtful titles and descriptive summaries
    of technical video transcripts through a series of semi-adversarial interactions with a writer and editors.`

    const primarySystemWriterPrompt = `
    # Instructions
    Pause. Take a deep breath and think. You are the technical writer. You are writing a title and a summary description
    of a technical video transcript. You are writing a clown college. 
    
    * conversational and focused on the reader
    * SEO is important for the title
    * the description should summarize the video transcript
    * the title should summarize the description and transcript further
    * the title is not to exceed 90 characters
    * do **not** use any emojis
    * do **not** use colons \`:\` or parentheses \`( )\`
    * if you are missing information, do not include generic information
    * do **not** use phrases like "this video" or "in this video" or "the speaker"
    * do not reference "the video"
    

    ## Video Transcript
    ${event.data.input.input}
   
    `

    const aiResponse: ChatCompletionRequestMessage | null = await step.run(
      'send to writer for first draft',
      async () => {
        return promptStep({requestId: event.data.requestId, promptMessages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: primarySystemWriterPrompt},
          ]})
      },
    )

    const editorPrompt = `You are the editor. You are reviewing the first draft a title and description summary of a video transcript. Provide 
    structured feedback to the writer. Be specific. Be concise. Most of all be useful.
    
    - you have all the data, don't assume more data exists outside of the conversation
    - feedback should be in bullet points
    - keep the initial instructions in mind
    - don't suggest generic crap
    - you are extremely biased against phrases like "this video" or "in this video" or "the speaker" or referencing the video or speaker as subjects

     ${event.data.input.editor}`

    const editorResponse: ChatCompletionRequestMessage = await step.run(
      'send draft to editor',
      async () => {
        return promptStep({requestId: event.data.requestId, promptMessages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: primarySystemWriterPrompt},
            aiResponse,
            {role: 'user', content: editorPrompt},
          ]})

      },
    )

    const authorRevisionsPrompt = `
    stop. calm down. take the editors feedback seriously and create a final draft.
    
    ${event.data.input.revisions}
    `

    const authorRevisionsResponse: ChatCompletionRequestMessage = await step.run(
      'send writer for final draft',
      async () => {
        return promptStep({requestId: event.data.requestId, promptMessages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: primarySystemWriterPrompt},
            aiResponse,
            {role: 'user', content: editorPrompt},
            editorResponse,
            {role: 'user', content: authorRevisionsPrompt},
          ]})
      },
    )



      const formatCheck = await step.run(
        'check and format the json',
        async () => {
            return promptStep({requestId: event.data.requestId, promptMessages: [
                    {role: 'system', content: `you're a strict JSON formatter`},
                    {role: 'user', content: `Please check the following JSON and correct any errors 
              in the structure so it will parse with JSON.parse. don't 
              explain it please, just return the corrected json and only 
              the corrected json ready to be parsed. use newline character 
              for long strings that need to be a single line but do not escape 
              the newline character.
              
                  Output Format:
    Use JSON to output the title and description. The title should be \`title\` and the description should be \`description\`.
    
        
        ${authorRevisionsResponse.content}`},
                ]})
        },
      )

    await step.sendEvent('announce completion', {
      name: AI_WRITING_COMPLETED_EVENT,
      data: {
          requestId: event.data.requestId,
          result: formatCheck,
          fullPrompt: [
              {role: 'system', content: systemPrompt},
              {role: 'user', content: primarySystemWriterPrompt},
              aiResponse,
              {role: 'user', content: editorPrompt},
              editorResponse,
              {role: 'user', content: authorRevisionsPrompt},
              authorRevisionsResponse
          ]
      }
    })

    return {content: formatCheck, prompts: [
        {role: 'system', content: systemPrompt},
        {role: 'user', content: primarySystemWriterPrompt},
        aiResponse,
        {role: 'user', content: editorPrompt},
        editorResponse,
        {role: 'user', content: authorRevisionsPrompt},
        authorRevisionsResponse
    ]}
  },
)
