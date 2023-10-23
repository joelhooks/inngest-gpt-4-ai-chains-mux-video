import { type SchemaTypeDefinition } from 'sanity'
import workflow from "./schemas/documents/workflow";
import delay from "./schemas/actions/delay";
import sendEmail from "./schemas/actions/send-email";
import slack from "./schemas/actions/slack";
import filter from "./schemas/actions/filter";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    workflow,
    //actions
    delay,
    sendEmail,
    filter,
    slack
  ],
}
