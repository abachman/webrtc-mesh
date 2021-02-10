import EventEmitter from 'events'
import cuid from 'cuid'
import { SignalClient } from './SignalClient'
import SimplePeer from 'simple-peer'
import once from 'once'
import Debug from 'debug'

const debug = Debug('webrtc-mesh')

type MeshOptions = {
  signalsUrl: string
  appName: string
  simplePeer?: SimplePeer.Options
}

type ConnectMessage = {
  type: 'connect'
  from: string
}

type PeerMessage = {
  from: string
  signal: SimplePeer.SignalData
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

  simplePeerOptions?: SimplePeer.Options
  peers: SimplePeer.Instance[] = []
  remotes: Record<string, SimplePeer.Instance> = {}

  constructor({ signalsUrl, appName, simplePeer }: MeshOptions) {
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
    this.simplePeerOptions = simplePeer || {}
    this.listen()
    this.join()
  }

  toChannel(id: string): string {
    return `/${id}`
  }

  join(): void {
    debug('joining')
    if (this.closed || this.peers.length >= this.maxPeers) return
    const data = { type: 'connect', from: this.me }

    this.signals.publish(this.channels.all, data).then(() => {
      debug('publicize my existence to all')
      setTimeout(
        this.join.bind(this),
        Math.floor(Math.random() * 2000) + (this.peers.length ? 13000 : 3000),
      )
    })
  }

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
          ...this.simplePeerOptions,
          initiator: true,
        })

        // initiating connection with peer
        this.setup(peer, data.from)
        this.remotes[data.from] = peer
      }

      if (channel === this.channels.me) {
        debug('someone telling me things')
        const data = message as PeerMessage

        if (this.closed || !data) return

        let peer = this.remotes[data.from]

        if (!peer) {
          if (!data.signal || data.signal.type !== 'offer') {
            debug('skipping non-offer', data)
            return
          }

          debug('connecting to new peer (as not initiator)', data.from)
          peer = this.remotes[data.from] = new SimplePeer(
            this.simplePeerOptions,
          )

          // joining connection with peer who is initiating
          this.setup(this.remotes[data.from], data.from)
        }

        debug('signalling', data.from, data.signal)
        peer.signal(data.signal)
        return
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

    const onclose = once((err: Error) => {
      debug('disconnected from peer', id, err)
      if (this.remotes[id] === peer) delete this.remotes[id]
      const i = this.peers.indexOf(peer)
      if (i > -1) this.peers.splice(i, 1)
      this.emit('disconnect', peer, id)
    })

    const signals: unknown[] = []
    let sending = false

    const kick = async () => {
      if (this.closed || sending || !signals.length) return
      sending = true
      const data = { from: this.me, signal: signals.shift() }
      await this.signals.publish(this.toChannel(id), data)
      sending = false
      kick()
    }

    peer.on('signal', (sig) => {
      signals.push(sig)
      kick()
    })

    peer.on('error', onclose)
    peer.once('close', onclose)
  }

  async close(): Promise<void> {
    if (this.closed) return Promise.resolve()
    this.closed = true

    // if (cb) this.once('close', cb)

    this.signals.close()

    const len = this.peers.length
    if (len > 0) {
      let closed = 0
      this.peers.forEach((peer) => {
        peer.once('close', () => {
          if (++closed === len) {
            this.emit('close')
          }
        })

        process.nextTick(function () {
          peer.destroy()
        })
      })
    } else {
      this.emit('close')
    }

    return Promise.resolve()
  }
}
