import {serve} from 'inngest/next'
import {inngest} from '@/inngest/inngest.server'
import {writeAnEmail} from "@/inngest/functions/ai/writer";
import {muxVideoAssetCreated, muxVideoAssetReady, muxVideoAssetTrackReady} from "@/inngest/functions/mux/mux-asset";

export const runtime = 'edge'

export const {GET, POST, PUT} = serve({client: inngest, functions:[writeAnEmail, muxVideoAssetCreated, muxVideoAssetReady, muxVideoAssetTrackReady]})
