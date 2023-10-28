import axios from 'axios'
import {getUniqueFilename} from '@/lib/get-unique-filename'

const S3_SIGNING_URL = `/api/aws/sign-s3`
const MUX_SIGNING_URL = `/api/mux`

export async function uploadToS3({
                                   fileType,
                                   fileContents,
                                   onUploadProgress = () => {},
                                 }: {
  fileType: string
  fileContents: File
  onUploadProgress: (progressEvent: {loaded: number; total?: number}) => void
}) {
  const presignedPostUrl = await getPresignedPostUrl(
    fileType,
    fileContents.name,
  )

  await axios.put(presignedPostUrl.signedUrl, fileContents, {
    headers: {'Content-Type': 'application/octet-stream'},
    onUploadProgress,
  })

  return presignedPostUrl
}

type PresignedPostUrlResponse = {
  signedUrl: string
  publicUrl: string
  filename: string
  objectName: string
}

async function getPresignedPostUrl(fileType: string, fileName: string) {
  const {data: presignedPostUrl} = await axios.get<PresignedPostUrlResponse>(
    `${S3_SIGNING_URL}?contentType=${fileType}&objectName=${getUniqueFilename(
      fileName,
    )}`,
  )

  return presignedPostUrl
}


export async function uploadToMux({
  url,
}: {
  url: string
}) {
  const presignedPostUrl = await getPresignedMuxPostUrl()

  // we use axios because it does XHR request and gives us progress
  await fetch(MUX_SIGNING_URL, {

  })

  return presignedPostUrl
}

async function getPresignedMuxPostUrl() {
  const response = await fetch(MUX_SIGNING_URL, {
    method: 'POST'
  })
  return await response.json()
}
