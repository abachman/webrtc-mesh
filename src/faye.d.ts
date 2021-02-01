declare module 'faye' {
  type Message = Record<string, unknown>
  type FayeClientOptions = {
    interval: unknown
    timeout: unknown
    endpoints: unknown
    proxy: unknown
    retry: unknown
    scheduler: unknown
    websocketExtensions: unknown
    tls: unknown
    ca: unknown
  }

  class Subscription {
    cancel(): void
    unsubscribe(): void
    withChannel(callback: (channel: string, message: Message) => void): this
    then(callback: () => void): void
  }

  class Client {
    constructor(endpoint: string, options?: FayeClientOptions)

    subscribe(
      channel: string | string[],
      callback: (message: Message, context?: Record<string, unknown>) => void,
      context?: Record<string, unknown>,
    ): Subscription

    publish(channel: string, message: Message): Promise<void>

    disconnect(): void
  }

  class NodeAdapter {
    constructor(options: Record<string, unknown>)
    attach(server: unknown): void
  }
}
