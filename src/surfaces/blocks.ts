import { createContainer, render, Root } from '../renderer.ts'
import { jsxToBlocks } from '../jsx/blocks.ts'

import type React from 'react'
import type Slack from '@slack/bolt'

class OneTimeRoot extends Root {
  publish() {}
}
export function blocks(element: React.ReactNode): Slack.types.KnownBlock[] {
  const root = new OneTimeRoot()
  const container = createContainer(root)
  render(element, container)
  const children = root.getChildren()
  const [blocks] = jsxToBlocks(children)
  render(null, container)
  return blocks
}
