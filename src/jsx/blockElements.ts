import type { types as Slack } from '@slack/bolt'
import type { Instance, TextInstance } from '../renderer.ts'
import {
  assertNoChildren,
  dateToSlackTimestamp,
  getTextChild,
  getTextProperty,
  jsxToImageObject,
  plainDateToString,
} from '../helpers.ts'
import { Temporal } from 'temporal-polyfill'

export type BlockElement =
  | Slack.SectionBlockAccessory
  | Slack.InputBlockElement
  | Slack.ActionsBlockElement
  | Slack.ContextBlockElement

function jsxChildrenToOptions(
  children: (Instance | TextInstance)[],
  elementName: string,
  plainTextOnly?: false
): {
  options: Slack.Option[]
  initial_options: Slack.Option[]
  initial_option: Slack.Option
}
function jsxChildrenToOptions(
  children: (Instance | TextInstance)[],
  elementName: string,
  plainTextOnly: true
): {
  options: Slack.PlainTextOption[]
  initial_options: Slack.PlainTextOption[]
  initial_option: Slack.PlainTextOption
}
function jsxChildrenToOptions(
  children: (Instance | TextInstance)[],
  elementName: string,
  plainTextOnly = false
) {
  const options: Slack.Option[] = []
  const selectedOptions: Slack.Option[] = []
  for (const child of children) {
    if (child.type !== 'instance') {
      throw new Error(`Only ${elementName} elements allowed here`)
    }
    if (child.element !== elementName) {
      throw new Error(`Only ${elementName} elements allowed here`)
    }
    if (plainTextOnly && child.props.mrkdwn) {
      throw new Error('Only plain text allowed here')
    }
    const option =
      child.props.mrkdwn && !plainTextOnly
        ? {
            text: {
              type: 'mrkdwn' as const,
              text: getTextChild(child),
            },
          }
        : {
            text: {
              type: 'plain_text' as const,
              text: getTextChild(child),
            },
          }
    options.push(option)
    if (child.props.selected) {
      selectedOptions.push(option)
    }
  }
  return {
    options,
    initial_options: selectedOptions,
    initial_option: selectedOptions[0],
  }
}

export function jsxToBlockElement(jsx: Instance | TextInstance): BlockElement {
  if (jsx.type === 'text') {
    return {
      type: 'plain_text',
      text: jsx.text,
    } satisfies Slack.PlainTextElement
  }
  if (jsx.element === 'mrkdwn') {
    return {
      type: 'mrkdwn',
      text: getTextChild(jsx),
    } satisfies Slack.MrkdwnElement
  }

  // Common props
  const confirm = jsx.props.confirm as Slack.ConfirmationDialog | undefined
  const focus_on_load = !!jsx.props.focus
  const placeholder = jsx.props.placeholder
    ? {
        type: 'plain_text' as const,
        text: getTextProperty(jsx.props.placeholder, true),
      }
    : undefined
  const action_id = `reblock_${jsx.id}`

  if (jsx.element === 'button') {
    if (jsx.props.workflow) {
      return {
        type: 'workflow_button',
        workflow: jsx.props.workflow as Slack.WorkflowButton['workflow'],
        text: {
          type: 'plain_text',
          text: getTextChild(jsx),
        },
        style: jsx.props.primary
          ? 'primary'
          : jsx.props.danger
          ? 'danger'
          : undefined,
        accessibility_label: getTextProperty(jsx.props.alt),
        confirm,
      } satisfies Slack.WorkflowButton
    }
    return {
      type: 'button',
      text: {
        type: 'plain_text',
        text: getTextChild(jsx),
      },
      url: getTextProperty(jsx.props.url),
      style: jsx.props.primary
        ? 'primary'
        : jsx.props.danger
        ? 'danger'
        : undefined,
      accessibility_label: getTextProperty(jsx.props.alt),
      confirm,
      action_id,
    } satisfies Slack.Button
  }
  if (jsx.element === 'text') {
    return {
      type: 'plain_text_input',
      initial_value: getTextProperty(jsx.props.initial),
      multiline: !!jsx.props.multiline,
      min_length: jsx.props.minLength ? Number(jsx.props.minLength) : undefined,
      max_length: jsx.props.maxLength ? Number(jsx.props.maxLength) : undefined,
      placeholder,
      focus_on_load,
      action_id,
    } satisfies Slack.PlainTextInput
  }
  if (jsx.element === 'textarea') {
    return {
      type: 'rich_text_input',
      // TODO: initial_value
      placeholder,
      focus_on_load,
      action_id,
    } satisfies Slack.RichTextInput
  }
  if (jsx.element === 'datepicker') {
    assertNoChildren(jsx)
    return {
      type: 'datepicker',
      initial_date: plainDateToString(jsx.props.initial),
      confirm,
      placeholder,
      focus_on_load,
      action_id,
    } satisfies Slack.Datepicker
  }
  if (jsx.element === 'datetimepicker') {
    assertNoChildren(jsx)
    return {
      type: 'datetimepicker',
      initial_date_time: dateToSlackTimestamp(jsx.props.initial),
      confirm,
      focus_on_load,
      action_id,
    } satisfies Slack.DateTimepicker
  }
  if (jsx.element === 'timepicker') {
    assertNoChildren(jsx)
    const timezoneRaw = jsx.props.timezone
    let timezone = getTextProperty(timezoneRaw)
    if (timezoneRaw instanceof Temporal.TimeZone) {
      timezone = timezoneRaw.id
    }
    const initialRaw = jsx.props.initial
    let initial_time = getTextProperty(initialRaw)
    if (initialRaw instanceof Temporal.PlainTime) {
      initial_time = initialRaw.toString()
    }
    return {
      type: 'timepicker',
      initial_time,
      timezone,
      confirm,
      placeholder,
      focus_on_load,
      action_id,
    } satisfies Slack.Timepicker
  }
  if (jsx.element === 'email') {
    assertNoChildren(jsx)
    return {
      type: 'email_text_input',
      initial_value: getTextProperty(jsx.props.initial),
      placeholder,
      action_id,
    } satisfies Slack.EmailInput
  }
  if (jsx.element === 'url') {
    assertNoChildren(jsx)
    return {
      type: 'url_text_input',
      initial_value: getTextProperty(jsx.props.initial),
      placeholder,
      focus_on_load,
      action_id,
    } satisfies Slack.URLInput
  }
  if (jsx.element === 'number') {
    assertNoChildren(jsx)
    const numberString = (input: unknown) => {
      if (typeof input === 'number') {
        return String(input)
      }
      if (typeof input === 'string') {
        return input
      }
      return undefined
    }
    return {
      type: 'number_input',
      is_decimal_allowed: !!jsx.props.decimal,
      initial_value: numberString(jsx.props.initial),
      min_value: numberString(jsx.props.min),
      max_value: numberString(jsx.props.max),
      placeholder,
      focus_on_load,
      action_id,
    } satisfies Slack.NumberInput
  }
  if (jsx.element === 'file') {
    assertNoChildren(jsx)
    return {
      type: 'file_input',
      filetypes: jsx.props.filetypes as string[] | undefined,
      max_files: Number(jsx.props.maxFiles ?? 10),
      action_id,
    } satisfies Slack.FileInput
  }

  if (jsx.element === 'checkboxes') {
    return {
      type: 'checkboxes',
      ...jsxChildrenToOptions(jsx.children, 'checkbox'),
      confirm,
      focus_on_load,
      action_id,
    } satisfies Slack.Checkboxes
  }
  if (jsx.element === 'radio') {
    return {
      type: 'radio_buttons',
      ...jsxChildrenToOptions(jsx.children, 'option'),
      confirm,
      focus_on_load,
      action_id,
    } satisfies Slack.RadioButtons
  }

  if (jsx.element === 'select') {
    return {
      type: jsx.props.multi ? 'multi_static_select' : 'static_select',
      ...jsxChildrenToOptions(jsx.children, 'option', true),
      max_selected_items: jsx.props.max as number | undefined,
      placeholder,
      confirm,
      focus_on_load,
      action_id,
    } satisfies Slack.StaticSelect | Slack.MultiStaticSelect
  }
  if (jsx.element === 'selectuser') {
    assertNoChildren(jsx)
    if (jsx.props.multi) {
      return {
        type: 'multi_users_select',
        initial_users: jsx.props.initial as string[] | undefined,
        max_selected_items: jsx.props.max as number | undefined,
        placeholder,
        confirm,
        focus_on_load,
        action_id,
      } satisfies Slack.MultiUsersSelect
    }
    return {
      type: 'users_select',
      initial_user: getTextProperty(jsx.props.initial),
      placeholder,
      confirm,
      focus_on_load,
      action_id,
    } satisfies Slack.UsersSelect
  }
  if (jsx.element === 'selectconversation') {
    assertNoChildren(jsx)
    if (jsx.props.multi) {
      return {
        type: 'multi_conversations_select',
        initial_conversations: jsx.props.initial as string[] | undefined,
        max_selected_items: jsx.props.max as number | undefined,
        default_to_current_conversation: !!jsx.props.defaultToCurrent,
        filter: jsx.props.filter as Slack.ConversationFilter | undefined,
        placeholder,
        confirm,
        focus_on_load,
        action_id,
      } satisfies Slack.MultiConversationsSelect
    }
    return {
      type: 'conversations_select',
      initial_conversation: getTextProperty(jsx.props.initial),
      default_to_current_conversation: !!jsx.props.defaultToCurrent,
      filter: jsx.props.filter as Slack.ConversationFilter | undefined,
      placeholder,
      confirm,
      focus_on_load,
      action_id,
    } satisfies Slack.ConversationsSelect
  }
  if (jsx.element === 'selectchannel') {
    assertNoChildren(jsx)
    if (jsx.props.multi) {
      return {
        type: 'multi_channels_select',
        initial_channels: jsx.props.initial as string[] | undefined,
        max_selected_items: jsx.props.max as number | undefined,
        placeholder,
        confirm,
        focus_on_load,
        action_id,
      } satisfies Slack.MultiChannelsSelect
    }
    return {
      type: 'channels_select',
      initial_channel: getTextProperty(jsx.props.initial),
      placeholder,
      confirm,
      focus_on_load,
      action_id,
    }
  }
  if (jsx.element === 'overflow') {
    return {
      type: 'overflow',
      options: jsxChildrenToOptions(jsx.children, 'option', true).options,
      confirm,
      action_id,
    }
  }

  if (jsx.element === 'img') {
    if (jsx.props.title) {
      throw new Error(
        'Title not allowed on image element, only image blocks allow titles'
      )
    }
    return jsxToImageObject(jsx) satisfies Slack.ImageElement
  }

  throw new Error(`Unsupported block element: ${jsx.element}`)
}

export function blockElementIsSectionAccessory(
  element: BlockElement
): element is Slack.SectionBlockAccessory {
  return [
    'image',
    'button',
    'checkboxes',
    'datepicker',
    'multi_users_select',
    'multi_static_select',
    'multi_conversations_select',
    'multi_channels_select',
    'multi_external_select',
    'overflow',
    'radio_buttons',
    'users_select',
    'static_select',
    'conversations_select',
    'channels_select',
    'external_select',
    'timepicker',
    'workflow_button',
  ].includes(element.type)
}
/** The JSX tag names which correspond to block elements an input block allows */
export const inputBlockElementTagNames = [
  'text',
  'textarea',
  'datepicker',
  'datetimepicker',
  'timepicker',
  'email',
  'url',
  'number',
  'file',
  'checkboxes',
  'radio',
  'select',
  'selectuser',
  'selectconversation',
  'selectchannel',
]
export function blockElementIsInputBlockElement(
  element: BlockElement
): element is Slack.InputBlockElement {
  return [
    'checkboxes',
    'datepicker',
    'multi_users_select',
    'multi_static_select',
    'multi_conversations_select',
    'multi_channels_select',
    'multi_external_select',
    'radio_buttons',
    'users_select',
    'static_select',
    'conversations_select',
    'channels_select',
    'external_select',
    'timepicker',
    'datetimepicker',
    'email_text_input',
    'file_input',
    'number_input',
    'plain_text_input',
    'rich_text_input',
    'url_text_input',
  ].includes(element.type)
}

/** The JSX tag names which correspond to block elements an actions block allows */
export const actionsBlockElementTagNames = [
  'button',
  'checkboxes',
  'datepicker',
  'datetimepicker',
  'timepicker',
  'select',
  'selectuser',
  'selectconversation',
  'selectchannel',
  'overflow',
  'radio',
  'textarea',
]

export function blockElementIsActionsBlockElement(
  element: BlockElement
): element is Slack.ActionsBlockElement {
  return [
    'button',
    'checkboxes',
    'datepicker',
    'multi_users_select',
    'multi_static_select',
    'multi_conversations_select',
    'multi_channels_select',
    'multi_external_select',
    'overflow',
    'radio_buttons',
    'users_select',
    'static_select',
    'conversations_select',
    'channels_select',
    'external_select',
    'timepicker',
    'workflow_button',
    'datetimepicker',
    'rich_text_input',
  ].includes(element.type)
}
export function blockElementIsContextBlockElement(
  element: BlockElement
): element is Slack.ContextBlockElement {
  return ['image', 'mrkdwn', 'plain_text'].includes(element.type)
}
