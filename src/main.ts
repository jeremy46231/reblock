import { appHome as _appHome } from './events'
import {
  userAppHome as _userAppHome,
  type AppHomeHandle as _AppHomeHandle,
} from './surfaces/appHome'
import {
  message as _message,
  type MessageHandle as _MessageHandle,
} from './surfaces/message'
import {
  modal as _modal,
  type ModalHandle as _ModalHandle,
} from './surfaces/modal'
import { blocks as _blocks } from './surfaces/blocks'

namespace Reblock {
  export const appHome = _appHome
  export const userAppHome = _userAppHome
  export const message = _message
  export const modal = _modal
  export const blocks = _blocks

  export type AppHomeHandle = _AppHomeHandle
  export type MessageHandle = _MessageHandle
  export type ModalHandle = _ModalHandle
}

export default Reblock
export { Reblock }

export {
  _appHome as appHome,
  _userAppHome as userAppHome,
  _message as message,
  _modal as modal,
  _blocks as blocks,
  type _AppHomeHandle as AppHomeHandle,
  type _MessageHandle as MessageHandle,
  type _ModalHandle as ModalHandle,
}
