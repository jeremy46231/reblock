import { createContainer, render, Root } from '../renderer'
import { jsxToBlocks } from '../jsx/blocks'
import { activeModals, activeRoots, ensureEventRegistered } from '../events'
import { blocks } from './blocks'

import type React from 'react'
import type Slack from '@slack/bolt'
import type { DistributiveOmit } from '../helpers'

export class ModalRoot extends Root {
  viewID?: Promise<string>
  existingViewID?: string
  get isOpen() {
    return !!this.viewID
  }
  constructor(
    public client: Slack.webApi.WebClient,
    public args: DistributiveOmit<Slack.webApi.ViewsOpenArguments, 'view'>,
    public modalArgs: DistributiveOmit<
      Slack.types.ModalView,
      'type' | 'blocks' | 'notify_on_close' | 'callback_id'
    >,
    private onSubmit?: (event: Slack.ViewSubmitAction) => void,
    private onClose?: (event: Slack.ViewClosedAction) => void,
    private resolve?: (viewID: string) => void,
    private reject?: (error: unknown) => void
  ) {
    super()
  }
  async publish() {
    try {
      activeRoots.add(this)
      const children = this.getChildren()
      const view: Slack.types.ModalView = {
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
export class ModalHandle {
  constructor(private root: ModalRoot) {}

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
  app: Slack.App,
  argsOrId: string | DistributiveOmit<Slack.webApi.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<
        Slack.types.ModalView,
        'type' | 'blocks' | 'notify_on_close' | 'callback_id'
      >,
  element: React.ReactNode,
  onEvent?: (event: Slack.SlackViewAction) => void
): Promise<ModalHandle>
export async function modal(
  app: Slack.App,
  argsOrId: string | DistributiveOmit<Slack.webApi.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<
        Slack.types.ModalView,
        'type' | 'blocks' | 'notify_on_close' | 'callback_id'
      >,
  element: React.ReactNode,
  onSubmit: (event: Slack.ViewSubmitAction) => void,
  onClose: (event: Slack.ViewClosedAction) => void
): Promise<ModalHandle>
export async function modal(
  app: Slack.App,
  argsOrId: string | DistributiveOmit<Slack.webApi.ViewsOpenArguments, 'view'>,
  titleOrModalArgs:
    | string
    | DistributiveOmit<
        Slack.types.ModalView,
        'type' | 'blocks' | 'notify_on_close' | 'callback_id'
      >,
  element: React.ReactNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit?: (event: any) => void,
  onClose?: (event: Slack.ViewClosedAction) => void
) {
  ensureEventRegistered(app)

  let resolve: ((viewID: string) => void) | undefined = undefined
  let reject: ((error: unknown) => void) | undefined = undefined
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
    app.client,
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
