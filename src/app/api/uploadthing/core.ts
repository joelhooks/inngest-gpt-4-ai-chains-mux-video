import { createUploadthing, type FileRouter } from "uploadthing/next";
import {getServerAuthSession} from "@/server/auth";
import {getAbility} from "@/lib/ability";
import {inngest} from "@/inngest/inngest.server";
import {VIDEO_UPLOADED_EVENT} from "@/inngest/events/video-uploaded";
import { z } from "zod";
import {getUniqueFilename} from "@/lib/get-unique-filename";

const f = createUploadthing();

export const ourFileRouter = {

  videoUploader: f({ video: { maxFileSize: "2GB" } })
    .middleware(async (stuff) => {
      const session = await getServerAuthSession()
      const ability = getAbility({user: session?.user})

      if (!session || !ability.can('upload', 'Media')) {
        throw new Error("Unauthorized");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async (opts) => {
      console.log("Upload complete for userId:", opts.metadata.userId);

      console.log("file url", opts);

      await inngest.send({
        name: VIDEO_UPLOADED_EVENT,
        data: {
          originalMediaUrl: opts.file.url,
          fileName: opts.file.name || 'untitled',
          title: opts.file.name || 'untitled',
        },
      })
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;