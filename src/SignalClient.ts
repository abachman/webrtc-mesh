import cuid from 'cuid'
import { EventEmitter } from 'events'
import { Client, Message, Subscription } from 'faye'

export class SignalClient extends EventEmitter {
  app: string
  faye: Client
  me: string
  _messages: Message[] = []
  subscriptions: Subscription[] = []

  constructor(url: string, app: string) {
    super()

    this.app = app
    this.faye = new Client(url)

    this.me = cuid()
  }

  subscribe(channel: string): void {
    this.subscriptions.push(
      this.faye.subscribe(channel, (message: Message) => {
        this.emit('data', channel, message)
        this._messages.push(message)
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
