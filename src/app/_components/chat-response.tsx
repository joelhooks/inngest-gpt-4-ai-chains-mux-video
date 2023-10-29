'use client'

import ReactMarkdown from "react-markdown";
import * as React from "react";
import usePartySocket from "partysocket/react";
import {env} from "@/env.mjs";
import {STREAM_COMPLETE} from "@/lib/streaming-chunk-publisher";

export function ChatResponse(props: {requestId:string}) {
  const [messages, setMessages] = React.useState<{ requestId: string, body: string }[]>([])
  const socket = usePartySocket({
    room: env.NEXT_PUBLIC_PARTYKIT_ROOM_NAME,
    host: env.NEXT_PUBLIC_PARTY_KIT_URL,
    onMessage: (messageEvent) => {
      const messageData = JSON.parse(messageEvent.data)

      if(messageData.body !== STREAM_COMPLETE && messageData.requestId === props.requestId) {
        setMessages((messages) => [...messages, {body: messageData.body, requestId: messageData.requestId}])
      }
    }
  });

  // Group messages by requestId
  const groupedMessages = messages.reduce((groups, message) => {
    if (!groups[message.requestId]) {
      groups[message.requestId] = []
    }

    groups[message.requestId]?.push(message.body)
    return groups;
  }, {} as Record<string, string[]>)
  return (
    <div className="mt-[21px] min-h-[400px] rounded-md border bg-muted lg:min-h-[700px]">
      {Object.entries(groupedMessages).map(([requestId, bodies], index) => (
        <div key={requestId} className="mb-4 bg-blue-100 rounded-md p-4 shadow">
          <h2 className="font-bold text-blue-700 mb-2">Stream {index + 1} ({requestId})</h2>
          <div className="prose prose-blue text-sm max-w-none"><ReactMarkdown>{bodies.join('')}</ReactMarkdown></div>
        </div>
      ))}
    </div>
  )
}