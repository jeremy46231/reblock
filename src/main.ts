import { ObjectRenderer, type Root } from './renderer.ts'
import { jsxToBlocks } from './blocks.ts'
import type React from 'react'
import type { types as Slack } from '@slack/bolt'
import './types.d.ts'

export function appHome(element: React.ReactNode): Slack.HomeView {
  const jsx = ObjectRenderer.render(element)
  const blocks = jsxToBlocks(jsx)
  console.log(JSON.stringify(blocks))
  return {
    type: 'home',
    blocks,
  }
}

export function modal(title: string, element: React.ReactNode): Slack.ModalView {
  const jsx = ObjectRenderer.render(element)
  const blocks = jsxToBlocks(jsx)
  console.log(JSON.stringify(blocks))
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: title,
    },
    blocks,
  }
}

export function message(element: React.ReactNode): Slack.Block[] {
  const jsx = ObjectRenderer.render(element)
  const blocks = jsxToBlocks(jsx)
  console.log(JSON.stringify(blocks))
  return blocks
}

export default {
  appHome,
  modal,
  message,
}