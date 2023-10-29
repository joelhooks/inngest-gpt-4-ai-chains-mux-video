'use client'

import * as React from 'react'
import {uploadToS3} from '@/lib/upload-file'
import {Button} from "@/components/ui/button";
import {Input} from '@/components/ui/input';
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {z} from 'zod';
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {Progress} from "@/components/ui/progress"
import {usePathname, useRouter, useSearchParams} from 'next/navigation'
import {useCallback} from "react";
import {api} from "@/trpc/react";
import usePartySocket from "partysocket/react";
import {env} from "@/env.mjs";
import {ChatResponse} from "@/app/_components/chat-response";
import MuxPlayer from "@mux/mux-player-react";
import ReactMarkdown from "react-markdown";


const FormSchema = z.object({
  video: z.instanceof(File).nullable(),
})

const VideoUploader = () => {
  const [formProgress, setFormProgress] = React.useState(0)
  const [messages, setMessages] = React.useState<{ requestId: string, body: string }[]>([])
  const [playbackId, setPlaybackId] = React.useState<string>('')
  const [requestId, setRequestId] = React.useState<string>('')
  const [generatedDraft, setGeneratedDraft] = React.useState<{title:string, description: string} | null>(null)
  const [transcriptReady, setTranscriptReady] = React.useState<boolean>(false)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      video: null,
    }
  })

  const {mutate: createVideoResource} = api.videoResource.create.useMutation()
  const {mutate: generatePost} = api.post.generate.useMutation()


  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const socket = usePartySocket({
    room: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    host: env.NEXT_PUBLIC_PARTY_KIT_URL,
    onMessage: (messageEvent) => {
      const data = JSON.parse(messageEvent.data)
      console.log('data is', data)
      if(data.name === 'video.asset.ready' && requestId === data.requestId) {
        setPlaybackId(data.body)
      }
      if(data.name === 'transcript.ready' && requestId === data.requestId) {
        setTranscriptReady(true)
      }
      if(data.name === 'ai.draft.completed' && requestId === data.requestId) {
        setGeneratedDraft(data.body)
      }
    }
  });


  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      if (data.video) {
        const presignedUrl = await uploadToS3({
          fileContents: data.video,
          fileType: data.video.type,
          onUploadProgress: (progressEvent) => {
            setFormProgress((progressEvent.total
              ? (progressEvent.loaded / progressEvent.total) * 100
              : 0))
          },
        })

        setRequestId(presignedUrl.filename)

        createVideoResource({
          s3Url: presignedUrl.publicUrl,
          fileName: presignedUrl.filename
        })

        form.reset()
      }
    } catch (err) {
      console.log('error is', err)
    }
  }
  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
    <div className="flex flex-col space-y-4">
      <Form {...form} >
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="video"
            render={({field: {onChange, value, ...field}}) => {
              return (
                <FormItem>
                  <FormLabel>Video File to Upload</FormLabel>
                  <FormControl>
                    <Input  {...field}
                            accept="video/*"
                            id="video"
                            type="file"
                            onChange={(event) => {
                              onChange(event.target.files?.[0]);
                            }}
                    />
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )
            }}
          />
          <Button type="submit" >
            Upload to Mux
          </Button>
        </form>
      </Form>
      <Progress value={formProgress}/>
      {requestId}
      {playbackId && (
        <MuxPlayer playbackId={playbackId} />
      )}
      {transcriptReady && (
        <Button onClick={() => {
          setGeneratedDraft(null)
          generatePost({
            requestId
          })
        } }>Generate Post</Button>
      )}
      {generatedDraft && (
        <div>
          <h2 className="text-2xl font-semibold">{generatedDraft.title}</h2>
          <ReactMarkdown>{generatedDraft.description}</ReactMarkdown>
        </div>
      )}
    </div>
    <ChatResponse requestId={requestId} />
    </div>
  )
}

export default VideoUploader
