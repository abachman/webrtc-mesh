/* eslint-disable */
import SimplePeer, { WEBRTC_SUPPORT } from 'simple-peer'
import { EventEmitter } from 'events'
import { obj } from 'through2'
import cuid from 'cuid'
import once from 'once'
import Debug from 'debug'

const debug = Debug('webrtc-swarm')

export default WebRTCSwarm

class WebRTCSwarm extends EventEmitter {
  constructor(hub, opts) {
    super()

    if (!hub) throw new Error('SignalHub instance required')
    if (!opts) opts = {}

    // allow any number of .on() listeners on events
    this.setMaxListeners(0)

    this.hub = hub
    this.wrtc = opts.wrtc

    this.channelConfig = opts.channelConfig
    this.config = opts.config
    this.stream = opts.stream
    this.wrap =
      opts.wrap ||
      function (data) {
        return data
      }
    this.unwrap =
      opts.unwrap ||
      function (data) {
        return data
      }
    this.offerConstraints = opts.offerConstraints || {}
    this.maxPeers = opts.maxPeers || Infinity
    this.me = opts.uuid || cuid()

    debug('my uuid:', this.me)

    this.remotes = {}
    this.peers = []
    this.closed = false

    subscribe(this, hub)
  }

  close(cb) {
    if (this.closed) return
    this.closed = true

    if (cb) this.once('close', cb)

    var self = this
    this.hub.close(function () {
      var len = self.peers.length
      if (len > 0) {
        var closed = 0
        self.peers.forEach(function (peer) {
          peer.once('close', function () {
            if (++closed === len) {
              self.emit('close')
            }
          })
          process.nextTick(function () {
            peer.destroy()
          })
        })
      } else {
        self.emit('close')
      }
    })
  }
}

WebRTCSwarm.WEBRTC_SUPPORT = WEBRTC_SUPPORT

function setup(swarm, peer, id) {
  peer.on('connect', function () {
    debug('connected to peer', id)
    swarm.peers.push(peer)
    swarm.emit('peer', peer, id)
    swarm.emit('connect', peer, id)
  })

  var onclose = once(function (err) {
    debug('disconnected from peer', id, err)
    if (swarm.remotes[id] === peer) delete swarm.remotes[id]
    var i = swarm.peers.indexOf(peer)
    if (i > -1) swarm.peers.splice(i, 1)
    swarm.emit('disconnect', peer, id)
  })

  var signals = []
  var sending = false

  function kick() {
    if (swarm.closed || sending || !signals.length) return
    sending = true
    var data = { from: swarm.me, signal: signals.shift() }
    data = swarm.wrap(data, id)
    swarm.hub.broadcast(id, data, function () {
      sending = false
      kick()
    })
  }

  peer.on('signal', function (sig) {
    signals.push(sig)
    kick()
  })

  peer.on('error', onclose)
  peer.once('close', onclose)
}

function subscribe(swarm, hub) {
  hub.subscribe('all').pipe(
    obj(function (data, enc, cb) {
      data = swarm.unwrap(data, 'all')
      if (swarm.closed || !data) return cb()

      debug('/all', data)
      if (data.from === swarm.me) {
        debug('skipping self', data.from)
        return cb()
      }

      if (data.type === 'connect') {
        if (swarm.peers.length >= swarm.maxPeers) {
          debug('skipping because maxPeers is met', data.from)
          return cb()
        }
        if (swarm.remotes[data.from]) {
          debug('skipping existing remote', data.from)
          return cb()
        }

        debug('connecting to new peer (as initiator)', data.from)
        var peer = new SimplePeer({
          wrtc: swarm.wrtc,
          initiator: true,
          channelConfig: swarm.channelConfig,
          config: swarm.config,
          stream: swarm.stream,
          offerConstraints: swarm.offerConstraints,
        })

        setup(swarm, peer, data.from)
        swarm.remotes[data.from] = peer
      }

      cb()
    }),
  )

  hub
    .subscribe(swarm.me)
    .once('open', connect.bind(null, swarm, hub))
    .pipe(
      obj(function (data, enc, cb) {
        data = swarm.unwrap(data, swarm.me)
        if (swarm.closed || !data) return cb()

        var peer = swarm.remotes[data.from]
        if (!peer) {
          if (!data.signal || data.signal.type !== 'offer') {
            debug('skipping non-offer', data)
            return cb()
          }

          debug('connecting to new peer (as not initiator)', data.from)
          peer = swarm.remotes[data.from] = new SimplePeer({
            wrtc: swarm.wrtc,
            channelConfig: swarm.channelConfig,
            config: swarm.config,
            stream: swarm.stream,
            offerConstraints: swarm.offerConstraints,
          })

          setup(swarm, peer, data.from)
        }

        debug('signalling', data.from, data.signal)
        peer.signal(data.signal)
        cb()
      }),
    )
}

function connect(swarm, hub) {
  if (swarm.closed || swarm.peers.length >= swarm.maxPeers) return
  var data = { type: 'connect', from: swarm.me }
  data = swarm.wrap(data, 'all')
  hub.broadcast('all', data, function () {
    setTimeout(
      connect.bind(null, swarm, hub),
      Math.floor(Math.random() * 2000) + (swarm.peers.length ? 13000 : 3000),
    )
  })
}
