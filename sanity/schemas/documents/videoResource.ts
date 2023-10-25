/* eslint-disable import/no-anonymous-default-export */
import {MdVideocam} from 'react-icons/md'
import {defineField} from "sanity";

export default {
  name: 'videoResource',
  title: 'Video Resource',
  type: 'document',
  icon: MdVideocam,
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    defineField({
      name: 'state',
      title: 'Current State',
      type: 'string',
      validation: (Rule) => Rule.required(),
      initialValue: 'new',
      options: {
        list: [
          {title: 'new', value: 'new'},
          {title: 'new', value: 'processing'},
          {title: 'preparing', value: 'preparing'},
          {title: 'ready', value: 'ready'},
          {title: 'errored', value: 'errored'},
        ],
      },
      readOnly: true,
    }),
    {
      name: 'originalMediaUrl',
      title: 'Original Media Url',
      description: 'A URL to the source video on the Internet',
      type: 'url',
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'duration',
      title: 'Duration',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'muxPlaybackId',
      title: 'Mux Playback ID',
      description: 'Hashed ID of a video on mux',
      type: 'string',
    },
    {
      name: 'muxUploadId',
      title: 'Mux Upload ID',
      description: 'Upload ID when directly uploaded to Mux.',
      type: 'string',
    },
    {
      name: 'muxAssetId',
      title: 'Mux Asset ID',
      description: 'ID that references the asset in Mux.',
      type: 'string',
    },
    defineField({
      name: 'text',
      title: 'Transcript Text',
      type: 'text',
    }),
    defineField({
      title: 'SRT',
      name: 'srt',
      type: 'text',
    }),
  ],
}
