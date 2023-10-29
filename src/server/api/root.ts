import { createTRPCRouter } from "@/server/api/trpc";
import {videoResourceRouter} from "@/server/api/routers/videoResource";
import {postRouter} from "@/server/api/routers/post";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  videoResource: videoResourceRouter,
  post: postRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
