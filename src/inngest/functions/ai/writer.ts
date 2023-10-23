import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {type ChatCompletionRequestMessage} from "openai-edge";
import {promptStep} from "@/lib/prompt-step";

export const writeAnEmail = inngest.createFunction(
  {id: `gpt-4-writer`, name: 'GPT-4 Writer'},
  {event: AI_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {

    const systemPrompt: string = event.data.input.instructions || `You craft thoughtful phrases for customer emails`

    const primarySystemWriterPrompt = `
    # Instructions
    Pause. Take a deep breath and think. 
    Below is an email template. Template items for you to fill in are surrounded by brackets like this {{item}}
    
    ${event.data.input.input}
    
    * be casual and conversational
    * generate text for the template items. 
    * Do not include additional template items or 
    * do not include brackets in the response
    * if you are missing information, include generic information
    * if you don't have a name, use phrasing that doesn't require a name but isn't rude and impersonal
    
    Template:
    {{Greeting}},
    
    Congrats on completing the work. We are so excited to have you on board.
    
    {{personalized}}
    
    {{holiday cheer}}
    
    {{termination notice}}
    
    Cheers,
    Joel
   
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

    const editorPrompt = `You are the editor. You are reviewing the first draft of the email. Provide 
    structured feedback to the writer. Be specific. Be concise. Most of all be useful.
    
    - you have all the data, don't assume more data exists outside of the conversation
    - feedback should be in bullet points
    - keep the initial instructions in mind
    - don't suggest generic greetings
    
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
      'send editor feedback to writer',
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

    return {content: authorRevisionsResponse.content, prompts: [
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
