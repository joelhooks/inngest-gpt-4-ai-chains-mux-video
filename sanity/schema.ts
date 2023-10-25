import { type SchemaTypeDefinition } from 'sanity'
import workflow from "./schemas/documents/workflow";
import delay from "./schemas/actions/delay";
import sendEmail from "./schemas/actions/send-email";
import slack from "./schemas/actions/slack";
import filter from "./schemas/actions/filter";
import videoResource from "./schemas/documents/videoResource";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    workflow,
    videoResource,
    //actions
    delay,
    sendEmail,
    filter,
    slack
  ],
}
