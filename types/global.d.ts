import { MineMap } from './minemap'

declare global {
  interface Window {
    minemap: OmitPartial<MineMap, 'Map'>
  }
}