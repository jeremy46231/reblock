import Slack from '@slack/bolt'
import type { Root } from './renderer.ts'
import type { ModalRoot } from './surfaces/modal.ts'

export const activeRoots = new Set<Root>()
/** key: view ID */
export const activeModals = new Map<string, ModalRoot>()

export function registerEvents(app: Slack.App) {
  app.action(/reblock_[A-Za-z0-9_-]+/, async ({ body, ack, action }) => {
    if (!('action_id' in action) || body.type !== 'block_actions') {
      throw new Error('Unexpected action type')
    }
    const actionID = action.action_id.slice('reblock_'.length)
    for (const root of activeRoots) {
      if (root.eventHandlers.has(actionID)) {
        const handler = root.eventHandlers.get(actionID)
        if (!handler) {
          throw new Error('No handler for action ID')
        }
        if (typeof handler !== 'function') {
          throw new Error('Handler is not a function')
        }
        ack()
        handler(body, app.client)
        return
      }
    }
    console.error('No handler found for action ID')
  })

  app.view(
    { callback_id: 'reblock', type: 'view_submission' },
    async ({ ack, body, view }) => {
      const root = activeModals.get(view.id)
      if (!root) return
      ack()
      await root.submit(body as Slack.ViewSubmitAction)
    }
  )
  app.view(
    { callback_id: 'reblock', type: 'view_closed' },
    async ({ ack, body, view }) => {
      const root = activeModals.get(view.id)
      if (!root) return
      ack()
      await root.close(body as Slack.ViewClosedAction)
    }
  )
}