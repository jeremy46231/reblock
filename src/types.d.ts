import type { Temporal } from 'temporal-polyfill'
import type React from 'react'
import type Slack from '@slack/bolt'
import type { types as SlackTypes, webApi as SlackAPITypes } from '@slack/bolt'

type NoChildren = { children?: never }
type AllowsChildren = { children?: React.ReactNode }
type AllowsKey = { key?: React.Key | null | undefined }

declare global {
  namespace JSX {
    interface IntrinsicElements {
      messagetext: AllowsChildren
      
      // SlackTypes Blocks
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
            workflow: SlackTypes.WorkflowButton['workflow']
          }
        | {
            url?: string
            onEvent?: (event: Slack.BlockButtonAction, client: SlackAPITypes.WebClient) => void
          }
      ) & {
        primary?: boolean
        danger?: boolean
        alt?: string
        confirm?: SlackTypes.ConfirmationDialog 
      } & AllowsChildren
      text: {
        initial?: string
        multiline?: boolean
        minLength?: number
        maxLength?: number
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockPlainTextInputAction, client: SlackAPITypes.WebClient) => void
      } & AllowsChildren
      textarea: {
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockAction<Slack.RichTextInputAction>, client: SlackAPITypes.WebClient) => void
      } & AllowsChildren
      datepicker: {
        initial?: string | Temporal.PlainDate | Date
        confirm?: SlackTypes.ConfirmationDialog
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockDatepickerAction, client: SlackAPITypes.WebClient) => void
      } & NoChildren
      datetimepicker: {
        initial?: string | Temporal.Instant | Date
        confirm?: SlackTypes.ConfirmationDialog
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockAction, client: SlackAPITypes.WebClient) => void // TODO: why doesn't DatetimepickerAction exist?
      } & NoChildren
      timepicker: {
        initial?: string | Temporal.PlainTime
        timezone?: string | Temporal.TimeZone
        confirm?: SlackTypes.ConfirmationDialog
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockTimepickerAction, client: SlackAPITypes.WebClient) => void
      } & NoChildren
      email: {
        initial?: string
        placeholder?: string
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockAction, client: SlackAPITypes.WebClient) => void // TODO
      } & NoChildren
      url: {
        initial?: string
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockAction, client: SlackAPITypes.WebClient) => void // TODO
      } & NoChildren
      number: {
        decimal?: boolean
        initial?: number
        min?: number
        max?: number
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockAction, client: SlackAPITypes.WebClient) => void // TODO
      } & NoChildren
      file: {
        filetypes?: string[]
        maxFiles?: number
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockAction, client: SlackAPITypes.WebClient) => void // TODO
      } & NoChildren
      checkboxes: {
        confirm?: SlackTypes.ConfirmationDialog
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockCheckboxesAction, client: SlackAPITypes.WebClient) => void
      } & AllowsChildren
      checkbox: {
        mrkdwn?: boolean
      } & AllowsChildren
      radio: {
        confirm?: SlackTypes.ConfirmationDialog
        focus?: boolean
        label?: string
        hint?: string
        onEvent?: (event: Slack.BlockRadioButtonsAction, client: SlackAPITypes.WebClient) => void
      } & AllowsChildren
      option: {
        mrkdwn?: boolean
      } & AllowsChildren
      select: (
        | {
            multi: true
            max?: number
            onEvent?: (event: Slack.BlockAction<Slack.MultiStaticSelectAction>, client: SlackAPITypes.WebClient) => void
          }
        | {
            multi?: false
            onEvent?: (event: Slack.BlockStaticSelectAction, client: SlackAPITypes.WebClient) => void
          }
      ) & {
        placeholder?: string
        confirm?: SlackTypes.ConfirmationDialog
        focus?: boolean
        label?: string
        hint?: string
      } & AllowsChildren
      selectuser: (
        | {
            multi: true
            initial?: string[]
            onEvent?: (event: Slack.BlockAction<Slack.MultiUsersSelectAction>, client: SlackAPITypes.WebClient) => void
          }
        | {
            multi?: false
            initial?: string
            onEvent?: (event: Slack.BlockUsersSelectAction, client: SlackAPITypes.WebClient) => void
          }
      ) & {
        confirm?: SlackTypes.ConfirmationDialog
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
      } & NoChildren
      selectconversation: (
        | {
            multi: true
            initial?: string[]
            onEvent?: (event: Slack.BlockAction<Slack.MultiConversationsSelectAction>, client: SlackAPITypes.WebClient) => void
          }
        | {
            multi?: false
            initial?: string
            onEvent?: (event: Slack.BlockConversationsSelectAction, client: SlackAPITypes.WebClient) => void
          }
      ) & {
        initial?: string
        defaultToCurrent?: boolean
        filter?: SlackTypes.ConversationFilter
        confirm?: SlackTypes.ConfirmationDialog
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
      } & NoChildren
      selectchannel: (
        | {
            multi: true
            initial?: string[]
            onEvent?: (event: Slack.BlockAction<Slack.MultiConversationsSelectAction>, client: SlackAPITypes.WebClient) => void
          }
        | {
            multi?: false
            initial?: string
            onEvent?: (event: Slack.BlockConversationsSelectAction, client: SlackAPITypes.WebClient) => void
          }
      ) & {
        initial?: string
        confirm?: SlackTypes.ConfirmationDialog
        placeholder?: string
        focus?: boolean
        label?: string
        hint?: string
      } & NoChildren
      overflow: {
        confirm?: SlackTypes.ConfirmationDialog
        onEvent?: (event: Slack.BlockOverflowAction, client: SlackAPITypes.WebClient) => void
      } & AllowsChildren

      // Rich Text Parts
      codeblock: AllowsChildren
      blockquote: AllowsChildren
      ul: AllowsChildren
      ol: AllowsChildren
      li: AllowsChildren & AllowsKey

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
