import { nanoid } from 'nanoid'
import Reconciler from 'react-reconciler'
import { DefaultEventPriority } from 'react-reconciler/constants'
import type * as Slack from '@slack/bolt'
import type { ReactNode } from 'react'

type handler = (
  event: Slack.BlockAction,
  client: Slack.webApi.WebClient
) => void
export abstract class Root {
  children?: Rendered
  getChildren(): Rendered {
    if (!this.children) {
      throw new Error('No children')
    }
    function removeHidden(children: Rendered): Rendered {
      return children.flatMap((child): Rendered => {
        if (child.hidden) {
          return []
        }
        if (child.type === 'instance') {
          return [
            {
              ...child,
              children: removeHidden(child.children),
            },
          ]
        }
        return [child]
      })
    }
    return removeHidden(this.children)
  }

  abstract publish(): void
  rendering = true

  timeoutID?: ReturnType<typeof setTimeout>
  lastPublishTime = 0
  objectTreeModified() {
    if (!this.rendering) {
      return
    }
    if (this.timeoutID) {
      clearTimeout(this.timeoutID)
    }
    const now = Date.now()
    const delay = Math.max(50, 1000 - (now - this.lastPublishTime))
    this.timeoutID = setTimeout(() => {
      this.findEventHandlers()
      this.publish()
      this.lastPublishTime = now
    }, delay)
  }

  eventHandlers = new Map<string, handler>()
  findEventHandlers() {
    this.eventHandlers.clear()
    const traverseFindHandlers = (children: Rendered) => {
      for (const child of children) {
        if (child.type === 'instance') {
          if (child.props.onEvent) {
            const handler = child.props.onEvent as handler
            this.eventHandlers.set(child.id, handler)
          }
          traverseFindHandlers(child.children)
        }
      }
    }
    traverseFindHandlers(this.getChildren())
  }

  stopRendering() {
    this.rendering = false
    if (this.timeoutID) {
      clearTimeout(this.timeoutID)
    }
  }
}

export type Rendered = (Instance | TextInstance)[]

type Props = Record<string, unknown>
export type Instance = {
  type: 'instance'
  id: string
  hidden: boolean
  element: string
  children: Rendered
  text: string | null
  props: Props
}
export type TextInstance = {
  type: 'text'
  id: string
  hidden: boolean
  text: string
}

/** no-op to help with type inference, probably a better way to do this but ¯\_(ツ)_/¯ */
function hostConfigTypeHelper<a, b, c, d, e, f, g, h, i, j, k, l, m>(
  config: Reconciler.HostConfig<a, b, c, d, e, f, g, h, i, j, k, l, m>
) {
  return config
}

const makeHostConfig = (root: Root) =>
  hostConfigTypeHelper({
    supportsPersistence: true,
    supportsMutation: true,
    supportsHydration: false,
    getRootHostContext: () => undefined,
    getChildHostContext: () => undefined,
    createInstance(type: string, props: Props): Instance {
      return {
        type: 'instance',
        id: nanoid(),
        hidden: false,
        element: type,
        children: [],
        text: null,
        props: props,
      }
    },
    appendInitialChild(parent: Instance, child: Instance | TextInstance) {
      parent.children.push(child)
      root.objectTreeModified()
    },
    createTextInstance(text): TextInstance {
      return {
        type: 'text',
        id: nanoid(),
        hidden: false,
        text,
      }
    },
    finalizeInitialChildren() {
      root.objectTreeModified()
      return false
    },
    shouldSetTextContent: () => false,
    getPublicInstance: (instance) => instance,
    prepareForCommit: () => null,
    resetAfterCommit: () => {},
    preparePortalMount: () => null,
    scheduleTimeout: setTimeout,
    cancelTimeout: clearTimeout,
    noTimeout: -1 as const,
    isPrimaryRenderer: true,
    getCurrentEventPriority() {
      return DefaultEventPriority
    },

    ...{
      // FOR FUTURE ME: woah, bizarre errors????
      // bc I updated react-reconciler, remember the types are very out of date
      // and you need to manually add the new methods
      // to see examples, I think https://github.com/facebook/react/blob/main/packages/react-reconciler/src/__tests__/ReactFiberHostContext-test.internal.js#L41
      // has them, maybe the good test was somewhere else tho
      // good luck
      trackSchedulerEvent: () => {},
      resolveEventType: () => null,
      resolveEventTimeStamp: () => -1.1,
      shouldAttemptEagerTransition: () => false,
      now: Date.now,
      logRecoverableError: console.error,

      resolveUpdatePriority() {
        return DefaultEventPriority
      },
      getCurrentUpdatePriority() {
        return DefaultEventPriority
      },
      setCurrentUpdatePriority() {},
      maySuspendCommit() {
        return false
      },
      mayResourceSuspendCommit() {
        throw new Error('Unsupported')
      },
      waitForCommitToBeReady: () => null,
    },
    cloneInstance: (
      instance,
      updatePayload,
      type,
      oldProps,
      newProps,
      internalInstanceHandle,
      keepChildren
    ) => {
      return {
        type: 'instance',
        id: nanoid(),
        hidden: instance.hidden,
        element: type,
        children: keepChildren ? instance.children : [],
        text: null,
        props: newProps,
      } satisfies Instance
    },
    getInstanceFromNode: () => {
      throw new Error('Unsupported')
    },
    beforeActiveInstanceBlur: () => {},
    afterActiveInstanceBlur: () => {},
    prepareScopeUpdate: () => {},
    getInstanceFromScope: () => {
      throw new Error('Unsupported')
    },
    detachDeletedInstance: () => {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createContainerChildSet: (_container: Root) => {
      return [] as (Instance | TextInstance)[]
    },
    appendChildToContainerChildSet: (childSet, child) => {
      childSet.push(child)
      root.objectTreeModified()
    },
    finalizeContainerChildren: (container, newChildren) => {
      container.children = newChildren
      root.objectTreeModified()
    },
    replaceContainerChildren: (container, newChildren) => {
      container.children = newChildren
      root.objectTreeModified()
    },

    appendChild(parentInstance, child) {
      parentInstance.children.push(child)
      root.objectTreeModified()
    },
    appendChildToContainer(container, child) {
      if (!container.children) {
        container.children = []
      }
      container.children.push(child)
      root.objectTreeModified()
    },
    insertBefore(parentInstance, child, beforeChild: Instance | TextInstance) {
      const index = parentInstance.children.indexOf(beforeChild)
      parentInstance.children.splice(index, 0, child)
      root.objectTreeModified()
    },
    insertInContainerBefore(
      container,
      child,
      beforeChild: Instance | TextInstance
    ) {
      if (!container.children) {
        container.children = []
      }
      const index = container.children.indexOf(beforeChild)
      container.children.splice(index, 0, child)
      root.objectTreeModified()
    },
    removeChild(parentInstance, child) {
      const index = parentInstance.children.indexOf(child)
      parentInstance.children.splice(index, 1)
      root.objectTreeModified()
    },
    removeChildFromContainer(container, child) {
      if (!container.children) {
        container.children = []
      }
      const index = container.children.indexOf(child)
      container.children.splice(index, 1)
      root.objectTreeModified()
    },
    resetTextContent(instance) {
      instance.text = ''
      root.objectTreeModified()
    },
    commitTextUpdate(textInstance, prevText, nextText) {
      textInstance.text = nextText
      root.objectTreeModified()
    },
    commitMount() {},
    prepareUpdate: () => {
      return {}
    },
    commitUpdate(instance, updatePayload, type, prevProps, nextProps) {
      instance.props = nextProps
      root.objectTreeModified()
    },
    hideInstance(instance) {
      instance.hidden = true
      root.objectTreeModified()
    },
    hideTextInstance(textInstance) {
      textInstance.hidden = true
      root.objectTreeModified()
    },
    unhideInstance(instance) {
      instance.hidden = false
      root.objectTreeModified()
    },
    unhideTextInstance(textInstance) {
      textInstance.hidden = false
      root.objectTreeModified()
    },
    clearContainer(container) {
      container.children = []
      root.objectTreeModified()
    },
  })

type reconciler = Reconciler.Reconciler<
  Root,
  Instance,
  TextInstance,
  Instance | TextInstance,
  Instance | TextInstance
>

export function createContainer(root: Root) {
  const hostConfig = makeHostConfig(root)
  const reconciler = Reconciler(hostConfig) satisfies reconciler
  const container: unknown = reconciler.createContainer(
    root,
    0,
    null,
    true,
    false,
    '',
    console.warn,
    null
  )
  return { container, reconciler }
}
export function render(
  element: ReactNode,
  reactInstance: { container: unknown; reconciler: reconciler }
) {
  reactInstance.reconciler.updateContainer(
    element,
    reactInstance.container,
    null
  )
}
