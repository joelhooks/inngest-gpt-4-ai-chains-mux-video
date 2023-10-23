import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import {CounterClockwiseClockIcon} from "@radix-ui/react-icons";
import {TabsContent} from "@/components/ui/tabs";
import {inngest} from "@/inngest/inngest.server";
import {AI_WRITING_REQUESTED_EVENT} from "@/inngest/events";
import {customAlphabet} from "nanoid";
import * as React from "react";

import {ChatResponse} from "./chat-response";
const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  7
);


export function TabEdit() {
  return (
    <TabsContent value="edit" className="mt-0 border-0 p-0">
      <form action={async (event) => {
        'use server'
        await inngest.send({
          name: AI_WRITING_REQUESTED_EVENT,
          data: {
            requestId: nanoid(),
            input: Object.fromEntries(event.entries()),
          }
        })
      }}>
        <div className="flex flex-col space-y-4">
          <div className="grid h-full gap-6 lg:grid-cols-2">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="instructions">System Instructions</Label>
                <Textarea
                  id="instructions"
                  name='instructions'
                  placeholder="Fix the grammar."
                />
              </div>
              <Label htmlFor="input">Main Prompt</Label>
              <Textarea
                id="input"
                name='input'
                placeholder="We is going to the market."
              />

              <div className="flex flex-col space-y-2">
                <Label htmlFor="editor">Editor prompt</Label>
                <Textarea
                  id="editor"
                  name='editor'
                  placeholder="Prompt the editor"
                />
              </div>
              <Label htmlFor="revision">Author Revision Instructions</Label>
              <Textarea
                id="revision"
                name='revision'
                placeholder="We is going to the market."
              />
            </div>
            <ChatResponse />
          </div>
          <div className="flex items-center space-x-2">
            <Button type='submit'>Submit</Button>
            <Button variant="secondary" type='button'>
              <span className="sr-only">Show history</span>
              <CounterClockwiseClockIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </TabsContent>
  )
}