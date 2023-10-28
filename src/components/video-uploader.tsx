'use client'

import * as React from 'react'
import {uploadToMux, uploadToS3} from '@/lib/upload-file'
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


const FormSchema = z.object({
  video: z.instanceof(File).nullable(),
})

const VideoUploader = () => {
  const [formProgress, setFormProgress] = React.useState(0)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      video: null,
    }
  })

  const {mutate: createVideoResource} = api.videoResource.create.useMutation()


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
    <div className="grid gap-2 pt-2 ">
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
    </div>
  )
}

export default VideoUploader
