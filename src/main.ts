import './types.d.ts'

import { appHome } from './surfaces/appHome.ts'
import { message } from './surfaces/message.ts'
import { modal } from './surfaces/modal.ts'
import { blocks } from './surfaces/blocks.ts'

const Reblock = {
  appHome,
  message,
  modal,
  blocks,
}
namespace Reblock {}

export default Reblock
export { appHome, message, modal, blocks }
