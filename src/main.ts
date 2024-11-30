import { createContainer, render, Root } from './renderer.ts'
import { jsxToBlocks } from './blocks.ts'
import type React from 'react'
import type { types as Slack, webApi as SlackWebAPI } from '@slack/bolt'
import './types.d.ts'
import { DistributiveOmit } from './helpers.ts'

class AppHomeRoot extends Root {
  constructor(
    private client: SlackWebAPI.WebClient,
    private userID: string,
    private resolve?: () => void,
    private reject?: (error: Error) => void
  ) {
    super()
  }
  async finalize() {
    try {
      if (!this.children) {
        throw new Error('No children')
      }
      const blocks = jsxToBlocks(this.children)
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
      throw error
    }
  }
}
export async function appHome(
  client: SlackWebAPI.WebClient,
  userID: string,
  element: React.ReactNode
) {
  await new Promise<void>((resolve, reject) => {
    const container = createContainer(
      new AppHomeRoot(client, userID, resolve, reject)
    )
    render(element, container)
  })
}

// this one has to send the message the first time, then update it subsequently
class MessageRoot extends Root {
  private ts?: Promise<string>
  constructor(
    private client: SlackWebAPI.WebClient,
    private args: DistributiveOmit<
      SlackWebAPI.ChatPostMessageArguments,
      'blocks'
    >,
    private resolve?: (ts: string) => void,
    private reject?: (error: Error) => void
  ) {
    super()
  }
  async finalize() {
    try {
      if (!this.children) {
        throw new Error('No children')
      }
      const blocks = jsxToBlocks(this.children)
      if (!this.ts) {
        this.ts = (async () => {
          const result = await this.client.chat.postMessage({
            ...this.args,
            blocks,
          })
          if (!result.ok || !result.ts) {
            const error = new Error('Failed to send message')
            if (this.reject) {
              this.reject(error)
            }
            throw error
          }
          if (this.resolve) {
            this.resolve(result.ts)
          }
          return result.ts
        })()
        return
      }
      const ts = await this.ts
      await this.client.chat.update({
        ...this.args,
        ts,
        blocks,
      })
    } catch (error) {
      if (this.reject) {
        this.reject(error)
      }
      throw error
    }
  }
}
export async function message(
  client: SlackWebAPI.WebClient,
  args: DistributiveOmit<SlackWebAPI.ChatPostMessageArguments, 'blocks'>,
  element: React.ReactNode
) {
  return await new Promise<string>((resolve, reject) => {
    const root = new MessageRoot(client, args, resolve, reject)
    const container = createContainer(root)
    render(element, container)
  })
}

// modal, views.open the first time then update it subsequently
class ModalRoot extends Root {
  private viewID?: Promise<string>
  constructor(
    private client: SlackWebAPI.WebClient,
    private args: DistributiveOmit<SlackWebAPI.ViewsOpenArguments, 'view'>,
    private modalArgs: DistributiveOmit<Slack.ModalView, 'type' | 'blocks'>,
    private resolve?: (viewID: string) => void,
    private reject?: (error: Error) => void
  ) {
    super()
  }
  async finalize() {
    try {
      if (!this.children) {
        throw new Error('No children')
      }
      const view: Slack.ModalView = {
        type: 'modal',
        blocks: jsxToBlocks(this.children),
        ...this.modalArgs,
      }
      if (!this.viewID) {
        this.viewID = (async () => {
          const result = await this.client.views.open({
            ...this.args,
            view,
          })
          if (!result.ok || !result.view?.id) {
            const error = new Error('Failed to open modal')
            if (this.reject) {
              this.reject(error)
            }
            throw error
          }
          if (this.resolve) {
            this.resolve(result.view.id)
          }
          return result.view.id
        })()
        return
      }
      const viewID = await this.viewID
      await this.client.views.update({
        view_id: viewID,
        view,
      })
    } catch (error) {
      if (this.reject) {
        this.reject(error)
      }
      throw error
    }
  }
}
export async function modal(
  client: SlackWebAPI.WebClient,
  args: DistributiveOmit<SlackWebAPI.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<Slack.ModalView, 'type' | 'blocks'>,
  element: React.ReactNode
) {
  const modalArgs =
    typeof titleOrModalArgs === 'string'
      ? { title: { type: 'plain_text' as const, text: titleOrModalArgs } }
      : titleOrModalArgs
  return await new Promise<string>((resolve, reject) => {
    const root = new ModalRoot(client, args, modalArgs, resolve, reject)
    const container = createContainer(root)
    render(element, container)
  })
}

class OneTimeRoot extends Root {
  finalize() {}
}
export function blocks(element: React.ReactNode): Slack.KnownBlock[] {
  const root = new OneTimeRoot()
  const container = createContainer(root)
  render(element, container)
  if (!root.children) {
    throw new Error('No children')
  }
  const blocks = jsxToBlocks(root.children)
  render(null, container)
  return blocks
}
