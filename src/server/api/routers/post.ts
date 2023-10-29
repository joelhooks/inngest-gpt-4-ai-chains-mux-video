import {z} from 'zod'
import {v4} from 'uuid'
import {customAlphabet} from 'nanoid'
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";
import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {sanityQuery} from "@/server/sanity.server";

export const postRouter = createTRPCRouter({
  generate: publicProcedure
    .input(
      z.object({
        requestId: z.string()
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

      const {transcript} = await sanityQuery(`*[_type == "videoResource" && _id == "${input.requestId}"][0]`)

      await inngest.send({
        name: AI_WRITING_REQUESTED_EVENT,
        data: {
          requestId: input.requestId,
          input: {
            input: transcript
          }
        },
      })
    })
})
