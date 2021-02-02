import EventEmitter from 'events'
import cuid from 'cuid'
import { SignalClient } from './SignalClient'
import SimplePeer from 'simple-peer'
import Debug from 'debug'

const debug = Debug('webrtc-mesh')

type MeshOptions = {
  signalsUrl: string
  appName: string
}

type ConnectMessage = {
  type: 'connect'
  from: string
}

export declare interface Mesh {
  on(event: 'close', listener: () => void): this
  on(
    event: 'peer',
    listener: (peer: SimplePeer.Instance, id: string) => void,
  ): this
  on(
    event: 'connect',
    listener: (peer: SimplePeer.Instance, id: string) => void,
  ): this
}

export class Mesh extends EventEmitter {
  signals: SignalClient
  me: string
  channels: { all: string; me: string }
  closed = false
  maxPeers = 15

  peers: unknown[] = []
  remotes: Record<string, unknown> = {}

  constructor({ signalsUrl, appName }: MeshOptions) {
    super()

    this.me = cuid()

    this.channels = {
      all: '/all',
      me: `/${this.me}`,
    }

    debug('subscribing to channels:', this.channels)
    this.signals = new SignalClient(signalsUrl, appName)
    this.signals.subscribe(this.channels.all)
    this.signals.subscribe(this.channels.me)

    debug('listening')
    this.listen()
    this.join()
  }

  join(): void {}

  listen(): void {
    this.signals.on('data', (channel, message) => {
      if (channel === this.channels.all) {
        const data = message as ConnectMessage
        debug('/all', data)

        if (data.from === this.me) {
          debug('skipping self')
          return
        }

        if (this.peers.length > this.maxPeers) {
          debug('skipping because too many peers')
          return
        }

        if (this.remotes[data.from]) {
          debug('skipping existing remote')
          return
        }

        debug('connecting to new peer (as initiator)')
        const peer = new SimplePeer({
          initiator: true,
        })

        this.setup(peer, data.from)
        this.remotes[data.from] = peer
      }

      if (channel === this.channels.me) {
        debug('someone telling me things')
      }
    })
  }

  setup(peer: SimplePeer.Instance, id: string): void {
    peer.on('connect', () => {
      debug('connected to peer', id)
      this.peers.push(peer)
      this.emit('peer', peer, id)
      this.emit('connect', peer, id)
    })
  }

  async close(): Promise<void> {
    if (this.closed) return Promise.resolve()
    this.closed = true

    this.emit('close')

    return Promise.resolve()
  }
}
