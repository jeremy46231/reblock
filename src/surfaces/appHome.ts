import { createContainer, render, Root } from '../renderer.ts'
import { jsxToBlocks } from '../jsx/blocks.ts'
import { activeRoots } from '../events.ts'
import { blocks } from './blocks.ts'

import type React from 'react'
import type Slack from '@slack/bolt'

export class AppHomeRoot extends Root {
  constructor(
    public client: Slack.webApi.WebClient,
    public userID: string,
    private resolve?: () => void,
    private reject?: (error: Error) => void
  ) {
    super()
  }
  async publish() {
    try {
      activeRoots.add(this)
      const children = this.getChildren()
      const [blocks] = jsxToBlocks(children)
      await this.client.views.publish({
        user_id: this.userID,
        view: {
          type: 'home',
          blocks: blocks,
        },
      })
      if (this.resolve) {
        this.resolve()
      }
    } catch (error) {
      if (this.reject) {
        this.reject(error)
      }
      console.error(error)
    }
  }
}
class AppHomeHandle {
  constructor(private root: AppHomeRoot) {}

  get rendering() {
    return this.root.rendering
  }
  async stop(behavior: 'keep' | 'clear' | React.ReactNode = 'clear') {
    this.root.stopRendering()
    activeRoots.delete(this.root)
    if (behavior === 'keep') return
    const finalBlocks = behavior === 'clear' ? [] : blocks(behavior)
    await this.root.client.views.publish({
      user_id: this.root.userID,
      view: {
        type: 'home',
        blocks: finalBlocks,
      },
    })
  }
}
export async function appHome(
  client: Slack.webApi.WebClient,
  userID: string,
  element: React.ReactNode
) {
  let resolve: (() => void) | undefined = undefined
  let reject: ((error: Error) => void) | undefined = undefined
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  const root = new AppHomeRoot(client, userID, resolve, reject)
  const container = createContainer(root)

  render(element, container)
  await promise

  return new AppHomeHandle(root)
}
