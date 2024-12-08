import { createContainer, render, Root } from './renderer.ts'
import { jsxToBlocks } from './blocks.ts'
import { DistributiveOmit } from './helpers.ts'
import { activeModals, activeRoots } from './events.ts'
import './types.d.ts'

import type React from 'react'
import type Slack from '@slack/bolt'
import {
  type types as SlackTypes,
  type webApi as SlackWebAPI,
} from '@slack/bolt'

abstract class Handle {
  abstract get rendering(): boolean
  abstract stop(): Promise<void>
}

export class AppHomeRoot extends Root {
  constructor(
    public client: SlackWebAPI.WebClient,
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
class AppHomeHandle extends Handle {
  constructor(private root: AppHomeRoot) {
    super()
  }

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
  client: SlackWebAPI.WebClient,
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

// this one has to send the message the first time, then update it subsequently
class MessageRoot extends Root {
  ts?: Promise<string>
  existingTS?: string
  constructor(
    public client: SlackWebAPI.WebClient,
    public args: DistributiveOmit<
      SlackWebAPI.ChatPostMessageArguments,
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
class MessageHandle extends Handle {
  constructor(private root: MessageRoot) {
    super()
  }

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
  client: SlackWebAPI.WebClient,
  argsOrID:
    | string
    | DistributiveOmit<SlackWebAPI.ChatPostMessageArguments, 'blocks' | 'text'>,
  element: React.ReactNode
) {
  let resolve: ((ts: string) => void) | undefined = undefined
  let reject: ((error: Error) => void) | undefined = undefined
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  const args = typeof argsOrID === 'string' ? { channel: argsOrID } : argsOrID
  const root = new MessageRoot(client, args, resolve, reject)
  const container = createContainer(root)

  render(element, container)
  const ts = await promise

  return root.handle
}

// modal, views.open the first time then update it subsequently
export class ModalRoot extends Root {
  viewID?: Promise<string>
  existingViewID?: string
  get isOpen() {
    return !!this.viewID
  }
  constructor(
    public client: SlackWebAPI.WebClient,
    public args: DistributiveOmit<SlackWebAPI.ViewsOpenArguments, 'view'>,
    public modalArgs: DistributiveOmit<
      SlackTypes.ModalView,
      'type' | 'blocks' | 'notify_on_close' | 'callback_id'
    >,
    private onSubmit?: (event: Slack.ViewSubmitAction) => void,
    private onClose?: (event: Slack.ViewClosedAction) => void,
    private resolve?: (viewID: string) => void,
    private reject?: (error: Error) => void
  ) {
    super()
  }
  async publish() {
    try {
      activeRoots.add(this)
      const children = this.getChildren()
      const view: SlackTypes.ModalView = {
        ...this.modalArgs,
        type: 'modal',
        blocks: jsxToBlocks(children)[0],
        notify_on_close: true,
        callback_id: 'reblock',
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
          this.existingViewID = result.view.id
          activeModals.set(result.view.id, this)
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
      console.error(error)
    }
  }

  async submit(event: Slack.ViewSubmitAction) {
    this.stopRendering()
    activeRoots.delete(this)
    if (this.existingViewID) activeModals.delete(this.existingViewID)
    if (this.onSubmit) this.onSubmit(event)
  }
  async close(event: Slack.ViewClosedAction) {
    this.stopRendering()
    activeRoots.delete(this)
    if (this.existingViewID) activeModals.delete(this.existingViewID)
    if (this.onClose) this.onClose(event)
  }

  handle = new ModalHandle(this)
}
class ModalHandle extends Handle {
  constructor(private root: ModalRoot) {
    super()
  }

  get viewID() {
    return this.root.existingViewID
  }
  get isOpen() {
    return this.root.isOpen
  }
  get rendering() {
    return this.root.rendering
  }
  async stop(behavior: 'keep' | 'clear' | React.ReactNode = 'clear') {
    this.root.stopRendering()
    activeRoots.delete(this.root)
    const viewID = await this.root.viewID
    if (viewID) activeModals.delete(viewID)

    if (!viewID) return
    if (behavior === 'keep') return
    if (behavior === 'clear') {
      await this.root.client.views.update({
        view_id: viewID,
        view: {
          ...this.root.modalArgs,
          type: 'modal',
          blocks: [],
        },
      })
      return
    }
    const finalBlocks = behavior === 'clear' ? [] : blocks(behavior)
    await this.root.client.views.update({
      view_id: viewID,
      view: {
        ...this.root.modalArgs,
        type: 'modal',
        blocks: finalBlocks,
      },
    })
  }
}
export async function modal(
  client: SlackWebAPI.WebClient,
  argsOrId: string | DistributiveOmit<SlackWebAPI.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<
        SlackTypes.ModalView,
        'type' | 'blocks' | 'notify_on_close' | 'callback_id'
      >,
  element: React.ReactNode,
  onEvent?: (event: Slack.SlackViewAction) => void
): Promise<ModalHandle>
export async function modal(
  client: SlackWebAPI.WebClient,
  argsOrId: string | DistributiveOmit<SlackWebAPI.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<
        SlackTypes.ModalView,
        'type' | 'blocks' | 'notify_on_close' | 'callback_id'
      >,
  element: React.ReactNode,
  onSubmit: (event: Slack.ViewSubmitAction) => void,
  onClose: (event: Slack.ViewClosedAction) => void
): Promise<ModalHandle>
export async function modal(
  client: SlackWebAPI.WebClient,
  argsOrId: string | DistributiveOmit<SlackWebAPI.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<
        SlackTypes.ModalView,
        'type' | 'blocks' | 'notify_on_close' | 'callback_id'
      >,
  element: React.ReactNode,
  onSubmit?: (event: any) => void,
  onClose?: (event: Slack.ViewClosedAction) => void
) {
  let resolve: ((viewID: string) => void) | undefined = undefined
  let reject: ((error: Error) => void) | undefined = undefined
  const promise = new Promise<string>((res, rej) => {
    resolve = res
    reject = rej
  })

  const args =
    typeof argsOrId === 'string' ? { trigger_id: argsOrId } : argsOrId
  const modalArgs =
    typeof titleOrModalArgs === 'string'
      ? { title: { type: 'plain_text' as const, text: titleOrModalArgs } }
      : titleOrModalArgs
  const root = new ModalRoot(
    client,
    args,
    modalArgs,
    onSubmit,
    onClose ?? onSubmit,
    resolve,
    reject
  )
  const container = createContainer(root)

  render(element, container)
  await promise

  return root.handle
}

class OneTimeRoot extends Root {
  publish() {}
}
export function blocks(element: React.ReactNode): SlackTypes.KnownBlock[] {
  const root = new OneTimeRoot()
  const container = createContainer(root)
  render(element, container)
  const children = root.getChildren()
  const [blocks] = jsxToBlocks(children)
  render(null, container)
  return blocks
}
