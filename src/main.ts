import { ObjectRenderer, type Root } from './renderer.ts'
import {
  assertNoChildren,
  getTextChild,
  jsxToImageObject,
  type Block,
} from './helpers.ts'

import './types.d.ts'
import Slack, { types as SlackTypes } from '@slack/bolt'

import React from 'react'
import { jsxToRichTextElements, jsxToRichTextPart } from './richText.ts'

function jsxToBlocks(jsx: Root): Block[] {
  return jsx.children.map<Block>((child) => {
    if (child.type === 'text') {
      return {
        type: 'section',
        text: {
          type: 'plain_text',
          text: child.text,
        },
      }
    }
    if (child.element === 'hr') {
      assertNoChildren(child)
      return {
        type: 'divider',
      }
    }
    if (child.element === 'h1') {
      const text = getTextChild(child)
      return {
        type: 'header',
        text: {
          type: 'plain_text',
          text,
        },
      }
    }
    if (child.element === 'rich') {
      return {
        type: 'rich_text',
        elements: child.children.flatMap((el) => jsxToRichTextPart(el)),
      }
    }
    if (child.element === 'img') {
      return jsxToImageObject(child)
    }
    if (child.element === 'video') {
      return {
        type: 'video',
        alt_text: child.props.alt,
        author_name: child.props.author,
        description:
          typeof child.props.description === 'string'
            ? { type: 'plain_text', text: child.props.description }
            : undefined,
        provider_icon_url: child.props.providerIcon,
        provider_name: child.props.providerName,
        title: { type: 'plain_text', text: child.props.title },
        title_url: child.props.titleUrl,
        thumbnail_url: child.props.thumbnailUrl,
        video_url: child.props.videoUrl,
      }
    }
    if (child.element === 'section') {
      const block: SlackTypes.SectionBlock = {
        type: 'section',
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
            text: el.children.map((el) => el.text).join(''),
          })
          continue
        }
        if (el.element === 'accessory') {
          if (block.accessory) {
            throw new Error('Section may only have one accessory')
          }
          block.accessory = JSON.parse(getTextChild(el)) // TODO: Implement object parsing
          continue
        }
        throw new Error(`Unsupported section child: ${el.element}`)
      }
      return block
    }

    throw new Error(`Unsupported element type: ${child.type} ${child.element}`)
  })
}

export function appHome(element: React.ReactNode): SlackTypes.HomeView {
  const jsx = ObjectRenderer.render(element)
  const blocks = jsxToBlocks(jsx)
  console.log(JSON.stringify(blocks, null, 2))
  return {
    type: 'home',
    blocks,
  }
}
