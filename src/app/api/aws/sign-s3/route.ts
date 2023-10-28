import {NextRequest} from "next/server";
import AWS from 'aws-sdk'
import {v4 as uuidv4} from 'uuid'
import {env} from "@/env.mjs";
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";

const options = {
  bucket: env.AWS_VIDEO_UPLOAD_BUCKET,
  region: env.AWS_VIDEO_UPLOAD_REGION,
  signatureVersion: 'v4',
  ACL: 'public-read',
}

const credentials = {
  accessKeyId: env.AWS_VIDEO_UPLOAD_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_VIDEO_UPLOAD_SECRET_ACCESS_KEY,
}

AWS.config.credentials = credentials

const s3 = new AWS.S3(options)

export async function GET(req: NextRequest) {
  const session = await getServerAuthSession()
  const ability = getAbility({user: session?.user})

  if (!ability.can('upload', 'Media')) {
    return new Response(null, {
      status: 403,
    })
  }

  const searchParams = req.nextUrl.searchParams
  const objectName = searchParams.get('objectName')
  const contentType = searchParams.get('contentType')

  const filename = `${objectName}`

  const params = {
    Bucket: options.bucket,
    Key: `upload-example/${filename}`,
    Expires: 60,
    ContentType: contentType,
    ACL: options.ACL,
  }

  const signedUrl = s3.getSignedUrl('putObject', params)

  console.log('signedUrl', signedUrl)

  return new Response(JSON.stringify({
    signedUrl,
    filename,
    objectName,
    publicUrl: signedUrl.split('?').shift(),
  }), {
    status: 200,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    }
  })
}