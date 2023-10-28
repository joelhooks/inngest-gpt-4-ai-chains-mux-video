import {inngest} from "@/inngest/inngest.server";
import {MUX_WEBHOOK_EVENT} from "@/inngest/events/mux-webhook";
import {env} from "@/env.mjs";
import {AI_WRITING_COMPLETED_EVENT, AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {sanityMutation, sanityQuery} from "@/server/sanity.server";
import {VideoResourceSchema} from "@/inngest/functions/transcripts";


export const muxVideoAssetCreated = inngest.createFunction(
  {id: `mux-video-asset-created`, name: 'Mux Video Asset Created'},
  {event: MUX_WEBHOOK_EVENT, if: 'event.data.muxWebhookEvent.type == "video.asset.created"'},
  async ({event, step}) => {

    return event.data.muxWebhookEvent.data
  }
)

export const muxVideoAssetReady = inngest.createFunction(
  {id: `mux-video-asset-ready`, name: 'Mux Video Asset Ready'},
  {event: MUX_WEBHOOK_EVENT, if: 'event.data.muxWebhookEvent.type == "video.asset.ready"'},
  async ({event, step}) => {
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      const resourceTemp = VideoResourceSchema.safeParse(await sanityQuery(`*[_type == "videoResource" && muxAssetId == "${event.data.muxWebhookEvent.data.id}"][0]`))
      return resourceTemp.success ? resourceTemp.data : null
    })

    if (videoResource) {
      await step.run('update the video resource in Sanity', async () => {
        return await sanityMutation([
          {
            "patch": {
              "id": videoResource._id,
              "set": {
                "duration": event.data.muxWebhookEvent.data.duration,
              },
            }
          }
        ])
      })
    }
    return event.data.muxWebhookEvent.data
  }
)

export const muxVideoAssetTrackReady = inngest.createFunction(
  {id: `mux-video-asset-track-ready`, name: 'Mux Video Asset Track Ready'},
  {event: MUX_WEBHOOK_EVENT, if: 'event.data.muxWebhookEvent.type == "video.asset.track.ready"'},
  async ({event, step}) => {



    return event.data.muxWebhookEvent.data
  }
)