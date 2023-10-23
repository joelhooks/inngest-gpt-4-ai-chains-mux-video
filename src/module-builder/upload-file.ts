import axios from 'axios'


export async function uploadToS3({
  fileContents,
  onUploadProgress = () => {},
}: {
  fileType: string
  fileContents: File
  onUploadProgress: (progressEvent: {loaded: number; total?: number}) => void
}) {
  const presignedPostUrl = await getPresignedPostUrl()

  console.log('presignedPostUrl', presignedPostUrl)

  await axios.put(presignedPostUrl.url, fileContents, {
    headers: {'Content-Type': 'application/octet-stream'},
    onUploadProgress,
  })

  return 'done'
}

async function getPresignedPostUrl() {
  const response = await fetch(`/api/mux/`, {
    method: 'POST'
  })
  return await response.json()
}
