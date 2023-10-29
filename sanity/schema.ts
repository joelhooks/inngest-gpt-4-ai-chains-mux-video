import { type SchemaTypeDefinition } from 'sanity'
import workflow from "./schemas/documents/workflow";
import delay from "./schemas/actions/delay";
import sendEmail from "./schemas/actions/send-email";
import slack from "./schemas/actions/slack";
import filter from "./schemas/actions/filter";
import videoResource from "./schemas/documents/videoResource";
import authorType from "./schemas/documents/author";
import postType from "./schemas/documents/post";
import settingsType from "./schemas/settings";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    workflow,
    videoResource,
    //actions
    delay,
    sendEmail,
    filter,
    slack,
    authorType, postType, settingsType
  ],
}
