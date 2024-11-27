import type { Temporal } from 'temporal-polyfill'
import type React from 'react'
import type { types as Slack } from '@slack/bolt'

type NoChildren = Record<string, never>
type AllowsChildren = { children?: React.ReactNode }

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Slack Blocks
      rich: AllowsChildren
      hr: AllowsChildren
      h1: AllowsChildren
      img: { src: string; alt: string; title?: string } & NoChildren
      video: {
        alt: string
        title: string
        thumbnailUrl: string
        videoUrl: string

        author?: string
        description?: string
        providerIcon?: string
        providerName?: string
        titleUrl?: string
      } & NoChildren
      section: {
        expand?: boolean
      } & AllowsChildren
      field: { mrkdwn?: boolean } & AllowsChildren
      context: AllowsChildren
      input: {
        label: string
        hint?: string
        optional?: boolean
      } & AllowsChildren
      actions: AllowsChildren

      // Block Elements
      mrkdwn: AllowsChildren
      button: (
        | {
            workflow: Slack.WorkflowButton['workflow']
          }
        | {
            url?: string
          }
      ) & {
        primary?: boolean
        danger?: boolean
        alt?: string
        confirm?: Slack.ConfirmationDialog
      } & AllowsChildren
      text: {
        initial?: string
        multiline?: boolean
        minLength?: number
        maxLength?: number
        placeholder?: string
        focus?: boolean
      } & AllowsChildren
      textarea: {
        placeholder?: string
        focus?: boolean
      } & AllowsChildren
      datepicker: {
        initial?: string | Temporal.PlainDate | Date
        confirm?: Slack.ConfirmationDialog
        placeholder?: string
        focus?: boolean
      } & NoChildren
      datetimepicker: {
        initial?: string | Temporal.Instant | Date
        confirm?: Slack.ConfirmationDialog
        focus?: boolean
      } & NoChildren
      timepicker: {
        initial?: string | Temporal.PlainTime
        timezone?: string | Temporal.TimeZone
        confirm?: Slack.ConfirmationDialog
        placeholder?: string
        focus?: boolean
      } & NoChildren
      email: {
        initial?: string
        placeholder?: string
      } & NoChildren
      url: {
        initial?: string
        placeholder?: string
        focus?: boolean
      } & NoChildren
      number: {
        decimal?: boolean
        initial?: number
        min?: number
        max?: number
        placeholder?: string
        focus?: boolean
      } & NoChildren
      file: {
        filetypes?: string[]
        maxFiles?: number
      } & NoChildren
      checkboxes: {
        confirm?: Slack.ConfirmationDialog
        focus?: boolean
      } & AllowsChildren
      checkbox: {
        mrkdwn?: boolean
      } & AllowsChildren
      radio: {
        confirm?: Slack.ConfirmationDialog
        focus?: boolean
      } & AllowsChildren
      option: {
        mrkdwn?: boolean
      } & AllowsChildren
      select: (
        | {
            multi: true
            max?: number
          }
        | {}
      ) & {
        placeholder?: string
        confirm?: Slack.ConfirmationDialog
        focus?: boolean
      } & AllowsChildren
      selectuser: (
        | {
            multi: true
            initial?: string[]
          }
        | {
            multi?: false
            initial?: string
          }
      ) & {
        confirm?: Slack.ConfirmationDialog
        placeholder?: string
        focus?: boolean
      } & NoChildren
      selectconversation: (
        | {
            multi: true
            initial?: string[]
          }
        | {
            multi?: false
            initial?: string
          }
      ) & {
        initial?: string
        defaultToCurrent?: boolean
        filter?: Slack.ConversationFilter
        confirm?: Slack.ConfirmationDialog
        placeholder?: string
        focus?: boolean
      } & NoChildren
      selectchannel: (
        | {
            multi: true
            initial?: string[]
          }
        | {
            multi?: false
            initial?: string
          }
      ) & {
        initial?: string
        confirm?: Slack.ConfirmationDialog
        placeholder?: string
        focus?: boolean
      } & NoChildren
      overflow: {
        confirm?: Slack.ConfirmationDialog
      } & AllowsChildren

      // Rich Text Parts
      codeblock: AllowsChildren
      blockquote: AllowsChildren
      ul: AllowsChildren
      ol: AllowsChildren
      li: AllowsChildren

      // Rich Text Elements
      b: AllowsChildren
      i: AllowsChildren
      s: AllowsChildren
      code: AllowsChildren

      a: { href: string; unsafe?: boolean } & AllowsChildren
      user: AllowsChildren
      usergroup: AllowsChildren
      channel: AllowsChildren
      emoji: AllowsChildren
      color: AllowsChildren
      ateveryone: NoChildren
      atchannel: NoChildren
      athere: NoChildren
      date: {
        timestamp: number | string | Date | Temporal.Instant
        format: string
      } & AllowsChildren
    }
  }
}
