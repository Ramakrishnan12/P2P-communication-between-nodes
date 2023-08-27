import process from 'node:process'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { multiaddr } from 'multiaddr'
import { stdinToStream, streamToConsole, streamToConsoleAddToBlockchain } from './stream.js'
let chain = []
const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0']
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()]
})
await node.start()
console.log('libp2p has started')
console.log('listening on addresses:')
node.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
})
if (process.argv.length >= 3){
    const ma = multiaddr(process.argv[2])
    console.log(`pinging remote peer at ${process.argv[2]}`)
    const latency = await node.ping(ma)
    console.log(`pinged ${process.argv[2]} in ${latency}ms`)
    const listenerMa = multiaddr(process.argv[2])
    const stream = await node.dialProtocol(listenerMa, '/chat/1.0.0')
    console.log("Enter the data to enter to the chain")
    
    stdinToStream(stream)
    streamToConsole(stream)
}else{
    console.log('Waiting for peers to connect')
    node.connectionManager.addEventListener('peer:connect', (evt)=>{
        const connection = evt.detail
        console.log('connected to: ', connection.remotePeer.toString())
    })
    node.connectionManager.addEventListener('peer:disconnect', (evt)=>{
        const connection = evt.detail
        console.log('disconnected to: ', connection.remotePeer.toString())
    })
    await node.handle('/chat/1.0.0', async ({ stream }) => {
        stdinToStream(stream)
        streamToConsoleAddToBlockchain(stream, chain)
    })
}