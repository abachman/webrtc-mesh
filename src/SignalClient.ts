import { EventEmitter } from 'events'
import { Client, Message, Subscription } from 'faye'
import Debug from 'debug'

const debug = Debug('signal-client')

export declare interface SignalClient {
  on(event: 'ready', listener: () => void): this
  on(event: 'data', listener: (channel: string, message: Message) => void): this
}

export class SignalClient extends EventEmitter {
  app: string
  faye: Client
  _messages: Message[] = []
  subscriptions: Subscription[] = []

  constructor(url: string, app: string) {
    super()

    this.app = app
    this.faye = new Client(url)

    this.emit('ready')
  }

  subscribe(channel: string): void {
    debug('subscribe to ', channel)
    this.subscriptions.push(
      this.faye.subscribe(channel, (message: Message) => {
        this.emit('data', channel, message)
      }),
    )
  }

  publish(channel: string, message: Message): Promise<void> {
    return this.faye.publish(channel, message)
  }

  close(): void {
    this.subscriptions.forEach((sub) => {
      sub.cancel()
    })

    this.faye.disconnect()
  }
}
