import { SignalClient } from './../src/SignalClient'

describe('SignalClient', () => {
  const clients: SignalClient[] = []

  afterEach(() => {
    clients.forEach((client) => client.close())
  })

  it('can pass messages through faye', async () => {
    const client = new SignalClient(
      'http://localhost:8999/webrtc-mesh-test',
      'test',
    )
    clients.push(client)
    client.subscribe('/all')

    const client2 = new SignalClient(
      'http://localhost:8999/webrtc-mesh-test',
      'test',
    )
    clients.push(client2)
    await client2.publish('/all', { type: 'test' })

    expect(client).not.toBeUndefined()
    expect(client._messages.length).toBeGreaterThan(0)
    expect(client._messages[0]).toEqual({ type: 'test' })
  })

  it('emits data after subscribing', async () => {
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
