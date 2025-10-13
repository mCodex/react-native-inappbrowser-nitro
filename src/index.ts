import { NitroModules } from 'react-native-nitro-modules'
import type { InappbrowserNitro as InappbrowserNitroSpec } from './specs/inappbrowser-nitro.nitro'

export const InappbrowserNitro =
  NitroModules.createHybridObject<InappbrowserNitroSpec>('InappbrowserNitro')