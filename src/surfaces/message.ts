import { createContainer, render, Root } from '../renderer.ts'
import { jsxToBlocks } from '../jsx/blocks.ts'
import { activeRoots, ensureEventRegistered } from '../events.ts'
import { blocks } from './blocks.ts'

import type React from 'react'
import type Slack from '@slack/bolt'
import { DistributiveOmit } from '../helpers.ts'

export class MessageRoot extends Root {
  ts?: Promise<string>
  existingTS?: string
  constructor(
    public client: Slack.webApi.WebClient,
    public args: DistributiveOmit<
      Slack.webApi.ChatPostMessageArguments,
      'blocks' | 'text'
    >,
    private resolve?: (ts: string) => void,
    private reject?: (error: Error) => void
  ) {
    super()
  }
  async publish() {
    try {
      activeRoots.add(this)
      const children = this.getChildren()
      const [blocks, text] = jsxToBlocks(children)
      if (!this.ts) {
        this.ts = (async () => {
          const result = await this.client.chat.postMessage({
            ...this.args,
            blocks,
            ...(text ? { text } : {}),
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
          this.existingTS = result.ts
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
      console.error(error)
    }
  }

  handle = new MessageHandle(this)
}
export class MessageHandle {
  constructor(private root: MessageRoot) {}

  get ts() {
    return this.root.existingTS!
  }
  get channel() {
    return this.root.args.channel
  }
  get rendering() {
    return this.root.rendering
  }
  async stop(behavior: 'keep' | 'delete' | React.ReactNode = 'clear') {
    this.root.stopRendering()
    activeRoots.delete(this.root)
    if (!this.root.ts) return
    if (behavior === 'keep') return
    if (behavior === 'delete') {
      await this.root.client.chat.delete({
        ts: await this.root.ts,
        channel: this.root.args.channel,
      })
      return
    }
    const finalBlocks = behavior === 'clear' ? [] : blocks(behavior)
    await this.root.client.chat.update({
      ...this.root.args,
      ts: await this.root.ts,
      blocks: finalBlocks,
    })
  }
}
export async function message(
  app: Slack.App,
  argsOrID:
    | string
    | DistributiveOmit<
        Slack.webApi.ChatPostMessageArguments,
        'blocks' | 'text'
      >,
  element: React.ReactNode
) {
  ensureEventRegistered(app)

  let resolve: ((ts: string) => void) | undefined = undefined
  let reject: ((error: Error) => void) | undefined = undefined
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  const args = typeof argsOrID === 'string' ? { channel: argsOrID } : argsOrID
  const root = new MessageRoot(app.client, args, resolve, reject)
  const container = createContainer(root)

  render(element, container)
  const ts = await promise

  return root.handle
}
