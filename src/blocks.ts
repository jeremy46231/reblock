import { jsxToRichTextPart } from './richText.ts'
import {
  assertNoChildren,
  getTextChild,
  getTextProperty,
  jsxToImageObject,
} from './helpers.ts'
import type { Rendered } from './renderer.ts'
import type { types as Slack } from '@slack/bolt'
import {
  type BlockElement,
  blockElementIsActionsBlockElement,
  blockElementIsContextBlockElement,
  blockElementIsInputBlockElement,
  blockElementIsSectionAccessory,
  inputBlockElementTagNames,
  jsxToBlockElement,
} from './blockElements.ts'

export function jsxToBlocks(jsx: Rendered): [blocks: Slack.KnownBlock[], text: string] {
  let text = ''
  const blocks = jsx.flatMap<Slack.KnownBlock>((child) => {
    if (child.type === 'text') {
      return [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: child.text,
          },
        },
      ] satisfies [Slack.SectionBlock]
    }
    if (child.element === 'messagetext') {
      text = getTextChild(child)
      return []
    }
    if (child.element === 'hr') {
      assertNoChildren(child)
      return [
        {
          type: 'divider',
        },
      ] satisfies [Slack.DividerBlock]
    }
    if (child.element === 'h1') {
      const text = getTextChild(child)
      return [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text,
          },
        },
      ] satisfies [Slack.HeaderBlock]
    }
    if (child.element === 'rich') {
      return [
        {
          type: 'rich_text',
          elements: child.children.flatMap((el) => jsxToRichTextPart(el)),
        },
      ] satisfies [Slack.RichTextBlock]
    }
    if (child.element === 'img') {
      return [jsxToImageObject(child)] satisfies [Slack.ImageBlock]
    }
    if (child.element === 'video') {
      return [
        {
          type: 'video',
          alt_text: getTextProperty(child.props.alt, true),
          title: {
            type: 'plain_text',
            text: getTextProperty(child.props.title, true),
          },
          thumbnail_url: getTextProperty(child.props.thumbnailUrl, true),
          video_url: getTextProperty(child.props.videoUrl, true),
          author_name: getTextProperty(child.props.author),
          description: child.props.description
            ? {
                type: 'plain_text',
                text: getTextProperty(child.props.description, true),
              }
            : undefined,
          provider_icon_url: getTextProperty(child.props.providerIcon),
          provider_name: getTextProperty(child.props.providerName),
          title_url: getTextProperty(child.props.titleUrl),
        },
      ] satisfies [Slack.VideoBlock]
    }
    if (child.element === 'section') {
      const block: Slack.SectionBlock = {
        type: 'section',
        // @ts-ignore This feature isn't in the type definitions yet
        expand: !!child.props.expand,
      }
      for (const el of child.children) {
        if (el.type === 'text') {
          if (!block.text) {
            block.text = {
              type: 'mrkdwn',
              text: '',
            }
          }
          block.text.text += el.text
          continue
        }
        if (el.element === 'field') {
          if (!block.fields) {
            block.fields = []
          }
          block.fields.push({
            type: el.props.mrkdwn ? 'mrkdwn' : 'plain_text',
            text: getTextChild(el),
          })
          continue
        }
        // it must be an accessory
        if (block.accessory) {
          throw new Error('Section may only have one accessory')
        }
        const accessory = jsxToBlockElement(el)
        if (!blockElementIsSectionAccessory(accessory)) {
          throw new Error(`Unsupported accessory type: ${accessory.type}`)
        }
        block.accessory = accessory
      }
      return [block] satisfies [Slack.SectionBlock]
    }
    if (child.element === 'context') {
      return [
        {
          type: 'context',
          elements: child.children.map((el) => {
            const element = jsxToBlockElement(el)
            if (!blockElementIsContextBlockElement(element)) {
              throw new Error(`Unsupported element type: ${element.type}`)
            }
            return element
          }),
        },
      ] satisfies [Slack.ContextBlock]
    }
    if (inputBlockElementTagNames.includes(child.element)) {
      const element = jsxToBlockElement(child)
      if (blockElementIsInputBlockElement(element)) {
        return [
          {
            type: 'input',
            element,
            label: {
              type: 'plain_text',
              text: getTextProperty(child.props.label, true),
            },
            hint: child.props.hint
              ? {
                  type: 'plain_text',
                  text: getTextProperty(child.props.hint, true),
                }
              : undefined,
            optional: !!child.props.optional,
          },
        ] satisfies [Slack.InputBlock]
      }
    }
    if (child.element === 'actions') {
      return [
        {
          type: 'actions',
          elements: child.children.map((el) => {
            const element = jsxToBlockElement(el)
            if (!blockElementIsActionsBlockElement(element)) {
              throw new Error(`Unsupported element type: ${element.type}`)
            }
            return element
          }),
        },
      ] satisfies [Slack.ActionsBlock]
    }

    throw new Error(`Unsupported element type: ${child.type} ${child.element}`)
  })
  return [blocks, text]
}
