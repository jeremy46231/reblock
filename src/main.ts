import { ObjectRenderer, type Root } from './renderer.ts'
import { jsxToBlocks } from './blocks.ts'
import type React from 'react'
import type { types as Slack } from '@slack/bolt'
import './types.d.ts'

export function appHome(element: React.ReactNode): Slack.HomeView {
  const jsx = ObjectRenderer.render(element)
  const blocks = jsxToBlocks(jsx)
  console.log(JSON.stringify(blocks, null, 2))
  return {
    type: 'home',
    blocks,
  }
}
