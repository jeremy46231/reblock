import { Temporal } from 'temporal-polyfill'

import type { Instance, TextInstance } from './renderer.ts'
import type { types as Slack } from '@slack/bolt'
import {
  assertNoChildren,
  dateToSlackTimestamp,
  getTextChild,
} from './helpers.ts'

function assertElementsAllowedInCodeBlock(
  elements: Slack.RichTextElement[]
): elements is (Slack.RichTextText | Slack.RichTextLink)[] {
  for (const el of elements) {
    if (el.type !== 'text' && el.type !== 'link') {
      throw new Error(`Element ${el.type} not allowed in code block`)
    }
  }
  return true
}

export function jsxToRichTextPart(
  jsx: Instance | TextInstance
): Slack.RichTextBlockElement[] {
  if (jsx.type === 'text') {
    throw new Error('Text nodes not allowed in rich text')
  }
  if (jsx.element === 'section') {
    return [
      {
        type: 'rich_text_section',
        elements: jsx.children.flatMap((el) => jsxToRichTextElements(el)),
      },
    ]
  }
  if (jsx.element === 'codeblock') {
    const elements = jsx.children.flatMap((el) => jsxToRichTextElements(el))
    if (!assertElementsAllowedInCodeBlock(elements))
      throw new Error('Assertion failed')
    return [
      {
        type: 'rich_text_preformatted',
        elements: elements,
      },
    ]
  }
  if (jsx.element === 'blockquote') {
    return [
      {
        type: 'rich_text_quote',
        elements: jsx.children.flatMap((el) => jsxToRichTextElements(el)),
      },
    ]
  }
  if (jsx.element === 'ul' || jsx.element === 'ol') {
    return jsxToList(jsx)
  }

  throw new Error(`Unsupported element type: ${jsx.type} ${jsx.element}`)
}

export function jsxToList(
  jsx: Instance,
  defaultIndent = 0
): Slack.RichTextList[] {
  const style = jsx.element === 'ol' ? 'ordered' : 'bullet'
  const indent = Number(jsx.props['indent'] || defaultIndent)
  const parts: Slack.RichTextList[] = []
  let index = 0
  let currentlyWritingList = false
  for (const listItem of jsx.children) {
    if (listItem.type !== 'instance') {
      throw new Error(`Expected element but got ${listItem.type}`)
    }
    if (listItem.element === 'li') {
      const specifiedIndex = listItem.props['index']
      if (
        style === 'ordered' &&
        typeof specifiedIndex === 'number' &&
        specifiedIndex !== index
      ) {
        index = specifiedIndex
        currentlyWritingList = false
      }
      if (!currentlyWritingList) {
        parts.push({
          type: 'rich_text_list',
          elements: [],
          style,
          indent,
          // slack types are wrong here, bypass with destructuring
          ...(style === 'ordered' ? { offset: index } : {}),
        })
        currentlyWritingList = true
      }
      const currentList = parts[parts.length - 1]
      currentList.elements.push({
        type: 'rich_text_section',
        elements: listItem.children.flatMap((el) => jsxToRichTextElements(el)),
      })
      index++
    }
    if (listItem.element === 'ul' || listItem.element === 'ol') {
      parts.push(...jsxToList(listItem, indent + 1))
      currentlyWritingList = false
    }
  }
  return parts
}

type RichTextTextStyle = {
  bold?: boolean
  italic?: boolean
  strike?: boolean
  code?: boolean
}
export function jsxToRichTextElements(
  jsx: Instance | TextInstance,
  style: RichTextTextStyle = {}
): Slack.RichTextElement[] {
  if (jsx.type === 'text') {
    return [
      {
        type: 'text',
        text: jsx.text,
        style,
      },
    ]
  }
  if (jsx.element === 'a') {
    const text = getTextChild(jsx)
    const url = String(jsx.props['href'])
    const unsafe = Boolean(jsx.props['unsafe'])
    return [
      {
        type: 'link',
        url,
        text,
        unsafe,
        style,
      },
    ]
  }
  if (jsx.element === 'user') {
    const userId = getTextChild(jsx)
    return [
      {
        type: 'user',
        user_id: userId,
        style,
      },
    ]
  }
  if (jsx.element === 'usergroup') {
    const usergroupId = getTextChild(jsx)
    return [
      {
        type: 'usergroup',
        usergroup_id: usergroupId,
        style,
      },
    ]
  }
  if (jsx.element === 'channel') {
    const channelId = getTextChild(jsx)
    return [
      {
        type: 'channel',
        channel_id: channelId,
        style,
      },
    ]
  }
  if (jsx.element === 'emoji') {
    const emoji = getTextChild(jsx)
    return [
      {
        type: 'emoji',
        name: emoji,
        style,
      },
    ]
  }
  if (jsx.element === 'color') {
    const rawColor = getTextChild(jsx)
    const color = rawColor.startsWith('#') ? rawColor : `#${rawColor}`
    return [
      {
        type: 'color',
        value: color,
      },
    ]
  }
  if (jsx.element === 'ateveryone') {
    assertNoChildren(jsx)
    return [
      {
        type: 'broadcast',
        range: 'everyone',
      },
    ]
  }
  if (jsx.element === 'atchannel') {
    assertNoChildren(jsx)
    return [
      {
        type: 'broadcast',
        range: 'channel',
      },
    ]
  }
  if (jsx.element === 'athere') {
    assertNoChildren(jsx)
    return [
      {
        type: 'broadcast',
        range: 'here',
      },
    ]
  }
  if (jsx.element === 'date') {
    assertNoChildren(jsx)
    const timestamp = dateToSlackTimestamp(jsx.props['timestamp'])
    if (!timestamp) {
      throw new Error('Date span missing valid timestamp')
    }
    return [
      {
        type: 'date',
        timestamp,
        format: String(jsx.props['format']),
      },
    ]
  }

  if (jsx.element === 'b') {
    return jsx.children.flatMap<Slack.RichTextElement>((child) =>
      jsxToRichTextElements(child, { ...style, bold: true })
    )
  }
  if (jsx.element === 'i') {
    return jsx.children.flatMap<Slack.RichTextElement>((child) =>
      jsxToRichTextElements(child, { ...style, italic: true })
    )
  }
  if (jsx.element === 's') {
    return jsx.children.flatMap<Slack.RichTextElement>((child) =>
      jsxToRichTextElements(child, { ...style, strike: true })
    )
  }
  if (jsx.element === 'code') {
    return jsx.children.flatMap<Slack.RichTextElement>((child) =>
      jsxToRichTextElements(child, { ...style, code: true })
    )
  }
  console.error(jsx)
  throw new Error(`Unsupported element type: ${jsx.type} ${jsx.element}`)
}
