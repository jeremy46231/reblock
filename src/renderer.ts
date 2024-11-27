import React from 'react'
import Reconciler from 'react-reconciler'
import { DefaultEventPriority } from 'react-reconciler/constants'

type Props = Record<string, unknown>
export type Root = {
  type: 'root'
  children: Array<Instance | TextInstance>
}
export type Instance = {
  type: 'instance'
  element: string
  children: Array<Instance | TextInstance>
  text: string | null
  props: Props
}
export type TextInstance = {
  type: 'text'
  text: string
}

const ObjectReconciler = Reconciler({
  supportsPersistence: true,
  supportsMutation: false,
  supportsHydration: false,
  getRootHostContext: () => null,
  getChildHostContext: () => null,
  createInstance: (type: string, props: Props): Instance => {
    return {
      type: 'instance',
      element: type,
      children: [],
      text: null,
      props: props,
    }
  },
  appendInitialChild: (parent: Instance, child: Instance | TextInstance) => {
    parent.children.push(child)
  },
  createTextInstance: (text): TextInstance => {
    return {
      type: 'text',
      text,
    }
  },
  finalizeInitialChildren: () => false,
  prepareUpdate: () => null,
  shouldSetTextContent: () => false,
  getPublicInstance: (instance) => instance,
  prepareForCommit: () => null,
  resetAfterCommit: () => null,
  preparePortalMount: () => null,
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1 as const,
  isPrimaryRenderer: true,
  getCurrentEventPriority() {
    return DefaultEventPriority
  },
  cloneInstance: (
    instance,
    updatePayload,
    type,
    oldProps,
    newProps,
    internalInstanceHandle,
    keepChildren,
    recyclableInstance
  ) => {
    console.log('!!! cloneInstance', {
      instance,
      updatePayload,
      type,
      oldProps,
      newProps,
      internalInstanceHandle,
      keepChildren,
      recyclableInstance,
    })
    return {
      type: 'instance',
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
  createContainerChildSet: (_container: Root) =>
    [] as (Instance | TextInstance)[],
  appendChildToContainerChildSet: (childSet, child) => {
    childSet.push(child)
  },
  finalizeContainerChildren: (container, newChildren) => {
    container.children = newChildren
  },
  replaceContainerChildren: (container, newChildren) => {
    container.children = newChildren
  },
})

export const ObjectRenderer = {
  render(element: React.ReactNode) {
    const root: Root = {
      type: 'root',
      children: [],
    }
    const container = ObjectReconciler.createContainer(
      root,
      0,
      null,
      true,
      false,
      '',
      console.warn,
      null
    )
    ObjectReconciler.updateContainer(element, container, null)
    return root
  },
}
