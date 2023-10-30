//socket
// const userID = '001';
// const cid = '2222';
// const socket = new WebSocket(`http://192.168.1.19:4066/?userID=${userID}&cid=${cid}`);
// const WS_URL = 'ws://192.168.1.19:4066'
// const socket = new WebSocket(WS_URL)

// socket.addEventListener('open', (event) => {
//     console.log('Event ', event)
//     socket.send('Hello, server!')
// })

// socket.addEventListener('message', (event) => {
//     console.log('Mess Server', event.data)
// })

// socket.addEventListener('close', (event) => {
//     if (event.wasClean) {
//         console.log('err')
//     } else {
//         console.error('err')
//     }
// })

// socket.addEventListener('error', (error) => {
//     console.log('error', error)
// })

const exampleSocket = new WebSocket(
    "wss://www.example.com/socketserver",
    "protocolOne",
)
exampleSocket.onopen = (event) => {
    exampleSocket.send("Here's some text that the server is urgently awaiting!");
}


