var socket = io.connect('https://node.surecommand.com/', {
    query: {
        user: JSON.stringify({
            userID: '12121212',
            cid: '2222',
        })
    },
    // withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelayMax: 3000,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

socket.on('connect', () => {
    console.log("socket initialized successfully ✅")
})

let info = {
    "userID": "1138",
    "cID": "3622",
    "content": 'tri test',
    "type": "text"
}
socket.emit("push2talk_send_msg", JSON.stringify(info));

socket.emit('push2talk_load_msg', { start: 10000 }, (err, res) => {
    console.log('res', res)
})