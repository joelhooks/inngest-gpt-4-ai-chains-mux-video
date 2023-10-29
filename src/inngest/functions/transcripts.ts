import {inngest} from "@/inngest/inngest.server";
import {TRANSCRIPT_READY_EVENT, TRANSCRIPT_REQUESTED_EVENT} from "@/inngest/events/transcript-requested";
import {env} from "@/env.mjs";
import {sanityMutation, sanityQuery} from "@/server/sanity.server";

const deepgramUrl = `https://api.deepgram.com/v1/listen`

import z from 'zod'

export const VideoResourceSchema = z.object({
  _id: z.string().optional(),
  muxPlaybackId: z.string().optional(),
  muxAssetId: z.string().optional(),
  transcript: z.string().optional(),
  srt: z.string().optional(),
})

export type VideoResource = z.infer<typeof VideoResourceSchema>

export const transcriptRequested = inngest.createFunction(
  {id: `transcript-requested`, name: 'Transcript Requested'},
  {event: TRANSCRIPT_REQUESTED_EVENT},
  async ({event, step}) => {
    const deepgramResponse = await step.run('send the media to Deepgram', async () => {
      const utteranceSpiltThreshold = 0.5

      const callbackParams = new URLSearchParams({
        videoResourceId: event.data.videoResourceId,
      })

      const deepgramParams = new URLSearchParams({
        model: 'whisper-large',
        punctuate: 'true',
        paragraphs: 'true',
        utterances: 'true',
        utt_split: String(utteranceSpiltThreshold),
        callback: `${env.NEXTAUTH_URL}/api/deepgram/webhook?${callbackParams.toString()}`,
      })

      const deepgramResponse = await fetch(`${deepgramUrl}?${deepgramParams.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${env.DEEPGRAM_API_KEY}`,
        },
        body: JSON.stringify({
          url: event.data.mediaUrl,
        }),
      })

      return await deepgramResponse.json()
    })

    return {
      ...event.data,
      deepgramResponse
    }
  }
)

export const transcriptReady = inngest.createFunction(
  {id: `transcript-ready`, name: 'Transcript Ready'},
  {event: TRANSCRIPT_READY_EVENT},
  async ({event, step}) => {
    const videoResource = await step.run('get the video resource from Sanity', async () => {
      const resourceTemp = VideoResourceSchema.safeParse(await sanityQuery(`*[_type == "videoResource" && _id == "${event.data.videoResourceId}"][0]`))
      return resourceTemp.success ? resourceTemp.data : null
    })

    if (videoResource) {
      await step.run('update the video resource in Sanity', async () => {
        return await sanityMutation( [
          {
            "patch": {
              "id": videoResource._id,
              "set": {
                "srt": event.data.srt,
                "transcript": event.data.transcript,
                "state": `ready`,
              },
            }
          }
        ])
      })

      const muxAsset = await step.run('get the mux asset', async () => {
        const assetId = videoResource.muxAssetId
        const {data} = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
            "Content-Type": "application/json"
          }
        }).then(async (response) => await response.json())
        return data
      })

      await step.run('delete existing srt track from mux asset', async () => {
        const trackId = muxAsset.tracks.filter((track: { type: string, status: string }) => track.type === 'text')[0]?.id
        return await fetch(`https://api.mux.com/video/v1/assets/${videoResource.muxAssetId}/tracks/${trackId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
            "Content-Type": "application/json"
          }
        }).catch((error) => {
          console.error(error)
        })
      })

      await step.run('add srt track to mux asset', async () => {
        return await fetch(`https://api.mux.com/video/v1/assets/${muxAsset.id}/tracks`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "url": `${env.NEXTAUTH_URL}/api/videos/${videoResource._id}/srt`,
            "type": "text",
            "text_type": "subtitles",
            "closed_captions": true,
            "language_code": "en-US",
            "name": "English",
            "passthrough": "English"
          })
        }).then(async (response) => await response.json()).catch((error) => {
          console.error(error)
        })
      })
    }

    await step.run('send the transcript to the party', async () => {
      await fetch(`${env.NEXT_PUBLIC_PARTY_KIT_URL}/party/${env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME}`, {
        method: 'POST',
        body: JSON.stringify({
          body: event.data.transcript,
          requestId: event.data.videoResourceId,
          name: 'transcript.ready',
        }),
      }).catch((e) => {
        console.error(e);
      })
    })

    return event.data
  }
)




