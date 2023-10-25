import axios from 'axios'


export async function uploadToMux({
  fileContents,
  onUploadProgress = () => {},
}: {
  fileContents: File
  onUploadProgress: (progressEvent: {loaded: number; total?: number}) => void
}) {
  const presignedPostUrl = await getPresignedPostUrl()

  // we use axios because it does XHR request and gives us progress
  await axios.put(presignedPostUrl.url, fileContents, {
    headers: {'Content-Type': 'application/octet-stream'},
    onUploadProgress,
  })

  return presignedPostUrl
}

async function getPresignedPostUrl() {
  const response = await fetch(`/api/mux/`, {
    method: 'POST'
  })
  return await response.json()
}
