import { createContainer, render, Root } from '../renderer'
import { jsxToBlocks } from '../jsx/blocks'
import { activeRoots, activeAppHomes, ensureEventRegistered } from '../events'
import { blocks } from './blocks'

import type React from 'react'
import type Slack from '@slack/bolt'

export class AppHomeRoot extends Root {
  constructor(
    public client: Slack.webApi.WebClient,
    public userID: string,
    private resolve?: () => void,
    private reject?: (error: unknown) => void
  ) {
    super()
  }
  async publish() {
    try {
      activeRoots.add(this)
      activeAppHomes.set(this.userID, this)
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
  handle = new AppHomeHandle(this)
}
export class AppHomeHandle {
  constructor(private root: AppHomeRoot) {}

  get rendering() {
    return this.root.rendering
  }
  async stop(behavior: 'keep' | 'clear' | React.ReactNode = 'clear') {
    this.root.stopRendering()
    activeRoots.delete(this.root)
    activeAppHomes.delete(this.root.userID)
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
export async function userAppHome(
  app: Slack.App,
  userID: string,
  element: React.ReactNode
) {
  ensureEventRegistered(app)
  const existing = activeAppHomes.get(userID)
  if (existing) {
    await existing.handle.stop('keep')
  }

  let resolve: (() => void) | undefined = undefined
  let reject: ((error: unknown) => void) | undefined = undefined
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })

  const root = new AppHomeRoot(app.client, userID, resolve, reject)
  const container = createContainer(root)

  render(element, container)
  await promise

  return root.handle
}
