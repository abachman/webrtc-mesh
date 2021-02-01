import { SignalClient } from './SignalClient'
import EventEmitter from 'events'

type MeshOptions = {
  signalsUrl: string
  appName: string
}

export class Mesh extends EventEmitter {
  signals: SignalClient

  constructor({ signalsUrl, appName }: MeshOptions) {
    super()
    this.signals = new SignalClient(signalsUrl, appName)
  }
}
