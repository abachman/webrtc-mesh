/* eslint-disable @typescript-eslint/no-var-requires */
const http = require('http')
const faye = require('faye')

// setup.js
module.exports = async () => {
  const server = http.createServer()
  const bayeux = new faye.NodeAdapter({
    mount: '/webrtc-mesh-test',
    timeout: 45,
  })

  bayeux.attach(server)

  const waiter = new Promise((resolve) => {
    server.listen(8999, () => {
      resolve()
    })
  })

  // ...
  // Set reference to mongod in order to close the server during teardown.
  global.__FAYE__ = {
    close: () => {
      return new Promise((resolve) => {
        server.close(resolve)
      })
    },
  }

  return waiter
}
