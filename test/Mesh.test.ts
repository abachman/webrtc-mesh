import { SignalClient } from '../src/SignalClient'
import { Mesh } from '../src/Mesh'

describe('Mesh', () => {
  it('instantiates', () => {
    const mesh = new Mesh({
      signalsUrl: 'ws://localhost:8081',
      appName: 'somewhere',
    })
    expect(mesh).toBeTruthy()
    expect(mesh.signals).toBeInstanceOf(SignalClient)
  })
})
