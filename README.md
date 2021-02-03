# webrtc-mesh

WebRTC meshing playground.

This is basically a line-for-line rewrite of https://github.com/mafintosh/webrtc-swarm but in Typescript and using a basic Faye client instead of signalhub. It's also slightly less streamy.

Building a P2P web requires a signaling server, this library relies on a [Faye](https://faye.jcoglan.com/) PubSub server. You can run one in development with: 

```console
npm run signal-server
```

Client code looks like:

```html
<script src="../dist/webrtc-mesh.js"></script>
<script>
  const mesh = new WebRTCMesh.Mesh({
    signalsUrl: 'http://localhost:8080/signal',
    appName: 'myweb',
  })

  mesh.on('peer', (peer, id) => {
    console.log('<<<< got peer', id, peer)
  })

  mesh.on('disconnect', (peer, id) => {
    console.log('>>>> lost peer', id, peer)
  })
</script>
```

`peer` is an instance of a SimplePeer client.
