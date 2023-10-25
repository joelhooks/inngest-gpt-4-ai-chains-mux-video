import {env} from "@/env.mjs";

export const muxRequestHeaders = {
  Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
  "Content-Type": "application/json"
}

type MuxApiOptions = {passthrough: string, test: boolean}

export function getMuxOptions(options?: MuxApiOptions ) {
    return {
      "cors_origin": "*",
      "test": options?.test,
      "new_asset_settings": {
        "master_access": "temporary",
        "max_resolution_tier": "2160p",
        "playback_policy": [
          "public"
        ],
        "inputs": [
          {
            "generated_subtitles": [
              {
                "name": "English CC",
                "language_code": "en"
              }
            ]
          }
        ],
        "mp4_support": "standard",
        ...(options?.passthrough ? {passthrough: options.passthrough} : {})
      }
    }
}

