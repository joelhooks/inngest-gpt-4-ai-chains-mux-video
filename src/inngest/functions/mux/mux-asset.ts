import {inngest} from "@/inngest/inngest.server";
import {MUX_WEBHOOK_EVENT} from "@/inngest/events/mux-webhook";
import {env} from "@/env.mjs";
import {AI_WRITING_COMPLETED_EVENT, AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {sanityMutation, sanityQuery} from "@/server/sanity.server";


export const muxVideoAssetCreated = inngest.createFunction(
  {id: `mux-video-asset-created`, name: 'Mux Video Asset Created'},
  {event: MUX_WEBHOOK_EVENT, if: 'event.data.muxWebhookEvent.type == "video.asset.created"'},
  async ({event, step}) => {

    const videoResource = await step.run('create the video resource in Sanity', async () => {
      return sanityMutation( [
        {"createOrReplace": {
            "_id": "mux-asset.",
            "_type": "videoResource",
            "muxAssetId": event.data.muxWebhookEvent.data.id,
            "state": `processing`,
            "muxUploadId": event.data.muxWebhookEvent.data.upload_id,
            "muxPlaybackId": event.data.muxWebhookEvent.data.playback_ids[0].id,
          }}
      ])
    })
    return event.data.muxWebhookEvent.data
  }
)

export const muxVideoAssetReady = inngest.createFunction(
  {id: `mux-video-asset-ready`, name: 'Mux Video Asset Ready'},
  {event: MUX_WEBHOOK_EVENT, if: 'event.data.muxWebhookEvent.type == "video.asset.ready"'},
  async ({event, step}) => {
    return event.data.muxWebhookEvent.data
  }
)

export const muxVideoAssetTrackReady = inngest.createFunction(
  {id: `mux-video-asset-track-ready`, name: 'Mux Video Asset Track Ready'},
  {event: MUX_WEBHOOK_EVENT, if: 'event.data.muxWebhookEvent.type == "video.asset.track.ready"'},
  async ({event, step}) => {
    const muxAsset = await step.run('get the mux mux asset', async () => {
      const assetId = event.data.muxWebhookEvent.data.asset_id
      const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
          "Content-Type": "application/json"
        }
      })
      const json = await response.json()

      return json.data
    })

    const playbackId = muxAsset.playback_ids.filter((playbackId: any) => playbackId.policy === 'public')[0]?.id
    const trackId = muxAsset.tracks.filter((track: { type: string, status: string }) => track.type === 'text' && track.status === 'ready')[0]?.id

    const transcript = await step.run('get asset transcript', async () => {
      const response = await fetch(`https://stream.mux.com/${playbackId}/text/${trackId}.txt`)
      return response.text()
    })

    const subtitles = await step.run('get asset subtitles', async () => {
      const response = await fetch(`https://stream.mux.com/${playbackId}/text/${trackId}.vtt`)
      return response.text()
    })

    const videoResource = await step.run('get the video resource from Sanity', async () => {
      return await sanityQuery(`*[_type == "videoResource" && muxAssetId == "${muxAsset.id}"][0]`)
    })

    if(videoResource) {
      await step.run('update the video resource in Sanity', async () => {
        return await sanityMutation( [
          {
            "patch": {
              "id": videoResource._id,
              "set": {
                "srt": subtitles,
                transcript,
                "state": `ready`,
              },
            }
          }
        ])
      })
    }

    await step.sendEvent('send transcript to gpt-4 to summarize', {
      name: AI_WRITING_REQUESTED_EVENT,
      data: {
        requestId: muxAsset.id,
        input: {
          input: transcript
        }
      }
    })

    const writingResult = await step.waitForEvent('wait for the ai to write the title and text', {
      event: AI_WRITING_COMPLETED_EVENT,
      if: `event.data.muxWebhookEvent.data.asset_id == async.data.requestId`,
      timeout: '1h',
    })

    if(videoResource && writingResult) {
      await step.run('update the video resource in Sanity', async () => {
        return await sanityMutation( [
          {
            "patch": {
              "id": videoResource._id,
              "set": {
                "title": writingResult.data.result.title,
              },
            }
          }
        ])
      })
    }

    return event.data.muxWebhookEvent.data
  }
)