import type { types as Slack } from '@slack/bolt'
import type { Instance, TextInstance } from './renderer.ts'
import {
  assertNoChildren,
  dateToSlackTimestamp,
  getTextChild,
  getTextProperty,
  jsxToImageObject,
  plainDateToString,
} from './helpers.ts'

type BlockElement =
  | Slack.SectionBlockAccessory
  | Slack.InputBlockElement
  | Slack.ActionsBlockElement
  | Slack.ContextBlockElement
type BlockElementType = BlockElement['type']

function jsxChildrenToOptions(
  children: (Instance | TextInstance)[],
  elementName: string,
  plainTextOnly?: false
): { options: Slack.Option[]; selectedOptions: Slack.Option[] }
function jsxChildrenToOptions(
  children: (Instance | TextInstance)[],
  elementName: string,
  plainTextOnly: true
): {
  options: Slack.PlainTextOption[]
  selectedOptions: Slack.PlainTextOption[]
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
  return { options, selectedOptions }
}

export function jsxToBlockElement(jsx: Instance | TextInstance): BlockElement {
  if (jsx.type === 'text') {
    throw new Error('Text nodes not allowed as block elements')
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

  if (jsx.element === 'button') {
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
    }
  }
  if (jsx.element === 'checkboxlist') {
    return {
      type: 'checkboxes',
      ...jsxChildrenToOptions(jsx.children, 'checkbox'),
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'datepicker') {
    assertNoChildren(jsx)
    return {
      type: 'datepicker',
      initial_date: plainDateToString(jsx.props.initial),
      confirm,
      placeholder,
    }
  }
  if (jsx.element === 'datetimepicker') {
    assertNoChildren(jsx)
    return {
      type: 'datetimepicker',
      initial_date_time: dateToSlackTimestamp(jsx.props.initial),
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'email') {
    assertNoChildren(jsx)
    return {
      type: 'email_text_input',
      initial_value: getTextProperty(jsx.props.initial),
      placeholder,
    }
  }
  if (jsx.element === 'file') {
    assertNoChildren(jsx)
    return {
      type: 'file_input',
      filetypes: jsx.props.filetypes as string[] | undefined,
      max_files: Number(jsx.props.maxFiles ?? 10),
    }
  }
  if (jsx.element === 'select') {
    const { options, selectedOptions } = jsxChildrenToOptions(
      jsx.children,
      'option',
      true
    )
    return {
      type: 'static_select',
      options,
      initial_option: selectedOptions[0],
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'selectusers') {
    assertNoChildren(jsx)
    return {
      type: 'users_select',
      initial_user: getTextProperty(jsx.props.initial),
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'selectconversations') {
    assertNoChildren(jsx)
    return {
      type: 'conversations_select',
      initial_conversation: getTextProperty(jsx.props.initial),
      default_to_current_conversation: !!jsx.props.defaultToCurrent,
      filter: jsx.props.filter as Slack.ConversationFilter | undefined,
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'selectchannels') {
    assertNoChildren(jsx)
    return {
      type: 'channels_select',
      initial_channel: getTextProperty(jsx.props.initial),
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'multiselect') {
    return {
      type: 'multi_static_select',
      ...jsxChildrenToOptions(jsx.children, 'option', true),
      max_selected_items: jsx.props.max as number | undefined,
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'multiselectusers') {
    assertNoChildren(jsx)
    return {
      type: 'multi_users_select',
      initial_users: jsx.props.initial as string[] | undefined,
      max_selected_items: jsx.props.max as number | undefined,
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'multiselectconversations') {
    assertNoChildren(jsx)
    return {
      type: 'multi_conversations_select',
      initial_conversations: jsx.props.initial as string[] | undefined,
      max_selected_items: jsx.props.max as number | undefined,
      default_to_current_conversation: !!jsx.props.defaultToCurrent,
      filter: jsx.props.filter as Slack.ConversationFilter | undefined,
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'multiselectchannels') {
    assertNoChildren(jsx)
    return {
      type: 'multi_channels_select',
      initial_channels: jsx.props.initial as string[] | undefined,
      max_selected_items: jsx.props.max as number | undefined,
      placeholder,
      confirm,
      focus_on_load,
    }
  }
  if (jsx.element === 'number') {
    assertNoChildren(jsx)
    return {
      type: 'plain_text_input',
      placeholder,
      initial_value: getTextProperty(jsx.props.initial),
    }
  }

  if (jsx.element === 'img') {
    return jsxToImageObject(jsx)
  }

  throw new Error(`Unsupported block element: ${jsx.element}`)
}

jsxToBlockElement({} as any)
