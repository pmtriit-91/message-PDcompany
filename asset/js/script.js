const chatWrapper = document.querySelector('.wrapper-chat')
const sendMessageButton = document.getElementById('send-button')
const messageInput = document.getElementById('message-input')
//khai bao ID nguoi dung
var currentUserID = 2073

let lastMessageId = null
let isScrolling = false

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

//check new-mess & render
socket.on('new_mess', (data) => {
    data && getLastMessage()
})

//get last mess
function getLastMessage() {
    socket.emit('push2talk_last_msg', {}, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            lastMessageId = res.Messages.id
            getHistoryMessages(res.Messages.id)
            chatWrapper.addEventListener('scroll', () => {
                if (chatWrapper.scrollTop === 0) {
                    isScrolling = true
                    lastMessageId = Math.max(0, lastMessageId - 10)
                    getHistoryMessages(lastMessageId, isScrolling)
                }
            })
        }
    })
}
getLastMessage()

//get history mess
function getHistoryMessages(id, isScrolling) {
    socket.emit('push2talk_load_msg', { start: ++id }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log('history mess: ', res)
            //add history in DOM
            const arrReverse = res.Messages.reverse()
            arrReverse.forEach(message => {
                //check userID === userID thì sử dụng isCurrentUser(true/false) để xác định người dùng
                var isCurrentUser = message.userID === currentUserID
                if (isScrolling) {
                    // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                    addMessageToChat(message.content, isCurrentUser, true)
                } else {
                    // Nếu không cuộn, thêm tin nhắn vào dưới cùng
                    addMessageToChat(message.content, isCurrentUser, false)
                }
            })
        }
    })
}

//add mess lên UI
function addMessageToChat(content, isCurrentUser, isScrolling) {
    // div wrapper
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('d-flex', 'flex-row', 'justify-content-' + (isCurrentUser ? 'end' : 'start'))

    // create div avatar
    const avatarImg = document.createElement('img')
    avatarImg.src = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp'
    avatarImg.alt = 'Avatar'
    avatarImg.classList.add('avatar-chat')

    // create text content
    const messageTextDiv = document.createElement('div')
    messageTextDiv.innerHTML = '<p class=" small p-2 ' + (isCurrentUser ? 'me-3' : 'ms-3') + ' mb-1 ' + (isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3') + '">' + content + '</p>'

    // create text time
    const timestampP = document.createElement('p')
    timestampP.classList.add('small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted', (isCurrentUser ? null : 'float-end'))
    timestampP.textContent = '12:00 PM | Aug 13'

    if (isCurrentUser) {
        messageDiv.appendChild(messageTextDiv)
        messageTextDiv.appendChild(timestampP)
    } else {
        messageDiv.appendChild(avatarImg)
        messageDiv.appendChild(messageTextDiv)
        messageTextDiv.appendChild(timestampP)
    }

    if (isScrolling) {
        chatWrapper.insertBefore(messageDiv, chatWrapper.firstElementChild)
    } else {
        chatWrapper.appendChild(messageDiv)
        chatWrapper.scrollTop = chatWrapper.scrollHeight
    }
}

//send mess
function sendMessage() {
    const messageContent = messageInput.value.trim()

    if (messageContent) {
        const info = {
            "userID": currentUserID,
            "cID": "3622",
            "content": messageContent,
            "type": "text",
        }

        socket.emit("push2talk_send_msg", JSON.stringify(info))

        // Reset the input field
        messageInput.value = ''

        addMessageToChat(messageContent, true)
    }
}

sendMessageButton.addEventListener('click', sendMessage)

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
})