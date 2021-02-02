const http = require('http')
const faye = require('faye')

const server = http.createServer()
const bayeux = new faye.NodeAdapter({ mount: '/signal', timeout: 45 })

bayeux.on('handshake', function (clientId) {
  console.log('[handshake]', clientId)
})

bayeux.on('publish', function (clientId, channel, data) {
  console.log('[publish]', clientId, channel, JSON.stringify(data))
})

bayeux.on('disconnect', function (clientId) {
  console.log('[disconnect]', clientId)
})

bayeux.attach(server)
server.listen(8080)
