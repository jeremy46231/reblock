import './types.d.ts'

import { appHome } from './events.ts'
import { userAppHome } from './surfaces/appHome.ts'
import { message } from './surfaces/message.ts'
import { modal } from './surfaces/modal.ts'
import { blocks } from './surfaces/blocks.ts'

const Reblock = {
  appHome,
  userAppHome,
  message,
  modal,
  blocks,
}
namespace Reblock {
  export type AppHomeHandle = import('./surfaces/appHome.ts').AppHomeHandle
  export type MessageHandle = import('./surfaces/message.ts').MessageHandle
  export type ModalHandle = import('./surfaces/modal.ts').ModalHandle
}

export default Reblock
export { Reblock }

export { appHome, userAppHome, message, modal, blocks }
export type { AppHomeHandle } from './surfaces/appHome.ts'
export type { MessageHandle } from './surfaces/message.ts'
export type { ModalHandle } from './surfaces/modal.ts'
