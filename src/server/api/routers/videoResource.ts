import {z} from 'zod'
import {v4} from 'uuid'
import {customAlphabet} from 'nanoid'
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";
import {inngest} from "@/inngest/inngest.server";
import {VIDEO_UPLOADED_EVENT} from "@/inngest/events/video-uploaded";

export const videoResourceRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        s3Url: z.string(),
        fileName: z.string().nullable(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      // create a video resource, which should trigger the process of uploading to
      // mux and ordering a transcript because of the active webhook
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})
      if (!ability.can('upload', 'Media')) {
        throw new Error('Unauthorized')
      }

      await inngest.send({
        name: VIDEO_UPLOADED_EVENT,
        data: {
          originalMediaUrl: input.s3Url,
          fileName: input.fileName,
          title: input.title
        },
      })
    })
})
