import {serve} from 'inngest/next'
import {inngest} from '@/inngest/inngest.server'
import {writeAnEmail} from "@/inngest/functions/ai/writer";
import {muxVideoAssetCreated, muxVideoAssetReady, muxVideoAssetTrackReady} from "@/inngest/functions/mux/mux-asset";
import {deepgramTranscriptReady} from "@/inngest/functions/deepgram/transcript";
import {transcriptReady, transcriptRequested} from "@/inngest/functions/transcripts";
import {videoUploaded} from "@/inngest/functions/sanity/video-resource";

export const runtime = 'edge'

export const {GET, POST, PUT} = serve({
  client: inngest, functions: [
    writeAnEmail,
    muxVideoAssetCreated,
    muxVideoAssetReady,
    muxVideoAssetTrackReady,
    deepgramTranscriptReady,
    transcriptRequested,
    transcriptReady,
    videoUploaded
  ]
})
