import { SignalClient } from './../src/SignalClient'

describe('SignalClient', () => {
  const clients: SignalClient[] = []

  afterEach(() => {
    clients.forEach((client) => client.close())
  })

  it('can pass data through subscriptions and publishing', async () => {
    const cb = jest.fn()
    const client = new SignalClient(
      'http://localhost:8999/webrtc-mesh-test',
      'test',
    )
    clients.push(client)
    client.subscribe('/all')
    client.on('data', cb)

    const client2 = new SignalClient(
      'http://localhost:8999/webrtc-mesh-test',
      'test',
    )
    clients.push(client2)
    await client2.publish('/all', { type: 'test' })

    expect(cb).toHaveBeenCalledWith('/all', { type: 'test' })
  })
})
