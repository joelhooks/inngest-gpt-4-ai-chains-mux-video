import {EventSchemas, Inngest} from 'inngest'
import {
  AI_WRITING_COMPLETED_EVENT,
  AI_WRITING_REQUESTED_EVENT,
  AIWritingRequestCompleted,
  AIWritingRequested
} from "@/inngest/events";
import {MUX_WEBHOOK_EVENT, MuxWebhook} from "@/inngest/events/mux-webhook";

// Create a client to send and receive events
type Events = {
  [AI_WRITING_COMPLETED_EVENT]: AIWritingRequestCompleted,
  [AI_WRITING_REQUESTED_EVENT]: AIWritingRequested,
  [MUX_WEBHOOK_EVENT]: MuxWebhook,
}
export const inngest = new Inngest({
  id: 'gpt-4-ai-chains',
  schemas: new EventSchemas().fromRecord<Events>(),
})
