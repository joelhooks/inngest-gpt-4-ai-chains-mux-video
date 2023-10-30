import {inngest} from "@/inngest/inngest.server"
import {AI_WRITING_REQUESTED_EVENT} from "@/inngest/events"
import {type ChatCompletionRequestMessage} from "openai-edge"
import {promptStep} from "@/lib/prompt-step"
import {Liquid} from 'liquidjs'
import {sanityQuery} from "@/server/sanity.server";
import {last} from "lodash";

const engine = new Liquid()

/**
 * TODO: migrate prompts to sanity
 */
export const writeAnEmail = inngest.createFunction(
  {id: `gpt-4-writer`, name: 'GPT-4 Writer'},
  {event: AI_WRITING_REQUESTED_EVENT},
  async ({event, step}) => {
    const workflow = await step.run('load workflow from sanity', async () => {
      return await sanityQuery(`*[_type == "workflow" && trigger == '${AI_WRITING_REQUESTED_EVENT}'][0]`)
    })

    let shouldContinue = Boolean(workflow)
    let messages: ChatCompletionRequestMessage[] = []

    while (workflow.actions.length > 0 && shouldContinue) {
      const action = workflow.actions.shift()
      switch (action._type) {
        case 'prompt':
          messages = await step.run(action.title, async () => {
            if(action.role === 'system') {
              return [...messages, {role: action.role, content: action.content}]
            } else {
              const nonSystemMessages = messages.filter(message => message.role !== 'system')
              const input = last(nonSystemMessages)?.content || event.data.input.input
              const content = await engine.parseAndRender(
                action.content, {
                  input
                })
              const userMessage = {
                role: action.role,
                ...(action.name && {name: action.name}),
                ...(action.content && {content}),
              }
              messages = [...messages, userMessage]
              return [...messages, await promptStep({
                requestId: event.data.requestId, promptMessages: messages
              })]
            }
          })
          break
        default:
          shouldContinue = false
      }
    }

    return {workflow, messages}
  },
)
