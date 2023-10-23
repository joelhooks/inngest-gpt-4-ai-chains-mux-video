import {env} from "@/env.mjs";

const baseUrl = 'https://api.mux.com'

const options = {
  headers: {
    Authorization: `Basic ${Buffer.from(`${env.MUX_ACCESS_TOKEN_ID}:${env.MUX_SECRET_KEY}`).toString('base64')}`,
    "Content-Type": "application/json"
  },
  method: 'POST',
  body: JSON.stringify({
    "cors_origin": "*",
    "test": true,


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
      "mp4_support": "standard"
    }
  })
}

export async function POST() {
  try {
    const response = await fetch(`${baseUrl}/video/v1/uploads`, options)
    const json = await response.json()
    return new Response(JSON.stringify(json.data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (error) {
    return new Response(JSON.stringify(error), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}