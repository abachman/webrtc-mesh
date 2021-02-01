import { Mesh } from './Mesh'

export default function start(signalhub: string): Mesh {
  return new Mesh({ signalsUrl: signalhub, appName: 'webrtc-mesh' })
}
