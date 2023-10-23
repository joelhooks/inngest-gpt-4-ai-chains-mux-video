import {inngest} from "@/inngest/inngest.server";
import {MUX_WEBHOOK_EVENT} from "@/inngest/events/mux-webhook";
import {env} from "@/env.mjs";

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

    const transcript = await step.run('get asset transcript', async () => {
      const playbackId = muxAsset.playback_ids.filter((playbackId: any) => playbackId.policy === 'public')[0]?.id
      const trackId = muxAsset.tracks.filter((track: { type: string, status: string }) => track.type === 'text' && track.status === 'ready')[0]?.id
      const response = await fetch(`https://stream.mux.com/${playbackId}/text/${trackId}.txt`)
      return response.text()
    })

    const subtitles = await step.run('get asset subtitles', async () => {
      const playbackId = muxAsset.playback_ids.filter((playbackId: any) => playbackId.policy === 'public')[0]?.id
      const trackId = muxAsset.tracks.filter((track: { type: string, status: string }) => track.type === 'text' && track.status === 'ready')[0]?.id
      const response = await fetch(`https://stream.mux.com/${playbackId}/text/${trackId}.vtt`)
      return response.text()
    })

    return event.data.muxWebhookEvent.data
  }
)