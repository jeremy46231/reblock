import type { Temporal } from 'temporal-polyfill'
import type * as Slack from '@slack/bolt'
import type { JSX as ReactJSX } from 'react/jsx-runtime'

type NoChildren = { children?: never }
type AllowsChildren = { children?: React.ReactNode }
type AllowsKey = { key?: React.Key | null | undefined }

export namespace JSX {
  export type ElementType = ReactJSX.ElementType
  export type Element = ReactJSX.Element
  export type ElementClass = ReactJSX.ElementClass
  export type ElementAttributesProperty = ReactJSX.ElementAttributesProperty
  export type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute
  export type LibraryManagedAttributes<C, P> =
    ReactJSX.LibraryManagedAttributes<C, P>
  export type IntrinsicAttributes = ReactJSX.IntrinsicAttributes
  export type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>

  export interface IntrinsicElements {
    messagetext: AllowsChildren

    // Slack.types Blocks
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
          workflow: Slack.types.WorkflowButton['workflow']
        }
      | {
          url?: string
          onEvent?: (
            event: Slack.BlockButtonAction,
            client: Slack.webApi.WebClient
          ) => void
        }
    ) & {
      primary?: boolean
      danger?: boolean
      alt?: string
      confirm?: Slack.types.ConfirmationDialog
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
      onEvent?: (
        event: Slack.BlockPlainTextInputAction,
        client: Slack.webApi.WebClient
      ) => void
    } & AllowsChildren
    textarea: {
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockAction<Slack.RichTextInputAction>,
        client: Slack.webApi.WebClient
      ) => void
    } & AllowsChildren
    datepicker: {
      initial?: string | Temporal.PlainDate | Date
      confirm?: Slack.types.ConfirmationDialog
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockDatepickerAction,
        client: Slack.webApi.WebClient
      ) => void
    } & NoChildren
    datetimepicker: {
      initial?: string | Temporal.Instant | Date
      confirm?: Slack.types.ConfirmationDialog
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockAction,
        client: Slack.webApi.WebClient
      ) => void // TODO: why doesn't DatetimepickerAction exist?
    } & NoChildren
    timepicker: {
      initial?: string | Temporal.PlainTime
      timezone?: string | Temporal.TimeZone
      confirm?: Slack.types.ConfirmationDialog
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockTimepickerAction,
        client: Slack.webApi.WebClient
      ) => void
    } & NoChildren
    email: {
      initial?: string
      placeholder?: string
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockAction,
        client: Slack.webApi.WebClient
      ) => void // TODO
    } & NoChildren
    url: {
      initial?: string
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockAction,
        client: Slack.webApi.WebClient
      ) => void // TODO
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
      onEvent?: (
        event: Slack.BlockAction,
        client: Slack.webApi.WebClient
      ) => void // TODO
    } & NoChildren
    file: {
      filetypes?: string[]
      maxFiles?: number
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockAction,
        client: Slack.webApi.WebClient
      ) => void // TODO
    } & NoChildren
    checkboxes: {
      confirm?: Slack.types.ConfirmationDialog
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockCheckboxesAction,
        client: Slack.webApi.WebClient
      ) => void
    } & AllowsChildren
    checkbox: {
      mrkdwn?: boolean
    } & AllowsChildren
    radio: {
      confirm?: Slack.types.ConfirmationDialog
      focus?: boolean
      label?: string
      hint?: string
      onEvent?: (
        event: Slack.BlockRadioButtonsAction,
        client: Slack.webApi.WebClient
      ) => void
    } & AllowsChildren
    option: {
      mrkdwn?: boolean
    } & AllowsChildren
    select: (
      | {
          multi: true
          max?: number
          onEvent?: (
            event: Slack.BlockAction<Slack.MultiStaticSelectAction>,
            client: Slack.webApi.WebClient
          ) => void
        }
      | {
          multi?: false
          onEvent?: (
            event: Slack.BlockStaticSelectAction,
            client: Slack.webApi.WebClient
          ) => void
        }
    ) & {
      placeholder?: string
      confirm?: Slack.types.ConfirmationDialog
      focus?: boolean
      label?: string
      hint?: string
    } & AllowsChildren
    selectuser: (
      | {
          multi: true
          initial?: string[]
          onEvent?: (
            event: Slack.BlockAction<Slack.MultiUsersSelectAction>,
            client: Slack.webApi.WebClient
          ) => void
        }
      | {
          multi?: false
          initial?: string
          onEvent?: (
            event: Slack.BlockUsersSelectAction,
            client: Slack.webApi.WebClient
          ) => void
        }
    ) & {
      confirm?: Slack.types.ConfirmationDialog
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
    } & NoChildren
    selectconversation: (
      | {
          multi: true
          initial?: string[]
          onEvent?: (
            event: Slack.BlockAction<Slack.MultiConversationsSelectAction>,
            client: Slack.webApi.WebClient
          ) => void
        }
      | {
          multi?: false
          initial?: string
          onEvent?: (
            event: Slack.BlockConversationsSelectAction,
            client: Slack.webApi.WebClient
          ) => void
        }
    ) & {
      initial?: string
      defaultToCurrent?: boolean
      filter?: Slack.types.ConversationFilter
      confirm?: Slack.types.ConfirmationDialog
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
    } & NoChildren
    selectchannel: (
      | {
          multi: true
          initial?: string[]
          onEvent?: (
            event: Slack.BlockAction<Slack.MultiConversationsSelectAction>,
            client: Slack.webApi.WebClient
          ) => void
        }
      | {
          multi?: false
          initial?: string
          onEvent?: (
            event: Slack.BlockConversationsSelectAction,
            client: Slack.webApi.WebClient
          ) => void
        }
    ) & {
      initial?: string
      confirm?: Slack.types.ConfirmationDialog
      placeholder?: string
      focus?: boolean
      label?: string
      hint?: string
    } & NoChildren
    overflow: {
      confirm?: Slack.types.ConfirmationDialog
      onEvent?: (
        event: Slack.BlockOverflowAction,
        client: Slack.webApi.WebClient
      ) => void
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
