import { randomAvatarURL, randomName } from './randomName.js'

const chatWrapper = document.querySelector('.wrapper-chat')
const sendMessageButton = document.getElementById('send-button')
const messageInput = document.getElementById('message-input')

//fake userID
const randomUser = Number(localStorage.getItem('userID') ? localStorage.getItem('userID') : Math.floor(Math.random() * 9000 + 1000))
localStorage.setItem('userID', randomUser)

//state lastID và trạng thái event scrollTop
let lastMessageId = null
let isScrolling = false

// tin nhắn cuối cùng của 1 user bất kì
let lastSender = null

//cid
const cID = '3322'

//id
const loadedMessageIDs = []

//status emoji
let isEmoji = false

// baseUrl
const baseUrl = 'https://www.surecommand.com/mobileapp/android.php'

//data list friends
let listFriends = []
const bodyLeft = document.querySelector('#body-left')

//body script
//login
const login = () => {
    return new Promise((resolve, reject) => {
        axios.post(baseUrl, {
            "head": {
                "code": 1, //code 1: login
                "cID": 3322,
                "version": 2
            },
            "body": {
                "email": "tdinhphuoc@gmail.com",
                "pass": "12345678"
            }
        }, {
            headers: {
                "Content-Type": "application/json",
            },
            withCredentials: true,
        })
            .then(response => {
                localStorage.setItem('token', JSON.stringify(response.data.chatToken))
                localStorage.setItem('dataUser', JSON.stringify(response.data.userInfo))
                resolve(response)
            })
            .catch(error => {
                console.log(error)
                reject(error)
            })
    })
}

// get list friends
const getListFriends = () => {
    Promise.all([login()])
        .then(() => {
            const dataUser = JSON.parse(localStorage.getItem('dataUser'))
            const token = JSON.parse(localStorage.getItem('token'))

            axios.post(baseUrl, {
                "head": {
                    "code": 145, //code 145: list friend
                    "userID": dataUser.userID,
                    "token": token,
                    "cID": dataUser.cID,
                    "version": 2
                },
                "body": {}
            }, {
                headers: {
                    "Content-Type": "application/json",
                }
            })
                .then(response => {
                    listFriends = [...response.data.members]
                    console.log(listFriends)
                    listFriends.map((friend) => {

                    })
                })
                .catch(error => {
                    console.log(error)
                })
        })
        .catch(error => {
            console.log(error)
        })
}
getListFriends()

//render friend UI
const friendsUI = (id, name) => {
}

//event socket
var socket = io.connect('https://node.surecommand.com/', {
    query: {
        user: JSON.stringify({
            userID: randomUser,
            cid: cID,
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

// check new-mess
const displayedMessages = []
socket.on('new_mess', (data) => {
    if (!displayedMessages.includes(data.id)) {
        var isCurrentUser = data.userID === randomUser
        addMessageToChat(data.content, isCurrentUser, false, data)
        displayedMessages.push(data.id)
    } else {
        getHistoryMessages()
    }
})

// get last mess
function getLastMessage() {
    socket.emit('push2talk_last_msg', {}, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            lastMessageId = res.Messages.id
            getHistoryMessages(res.Messages.id, false)
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
    socket.emit('push2talk_load_msg', { start: ++id, numView: 40 }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log('history mess: ', res.Messages)

            //add history in DOM
            const arrReverse = res.Messages.reverse()
            const newMessages = arrReverse.filter(message => !loadedMessageIDs.includes(message.id))

            newMessages.forEach(message => {
                loadedMessageIDs.push(message.id)
                var isCurrentUser = message.userID === randomUser
                if (isScrolling) {
                    // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                    addMessageToChat(message.content, isCurrentUser, true, message)
                } else {
                    // Nếu không cuộn, thêm tin nhắn vào dưới cùng
                    addMessageToChat(message.content, isCurrentUser, false, message)
                }
            })
        }
    })
}

//add mess lên UI
function addMessageToChat(content, isCurrentUser, isScrolling, messageData) {
    // div wrapper
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('d-flex', 'flex-row', 'justify-content-' + (isCurrentUser ? 'end' : 'start'), 'wrap-user')

    //name user
    const nameUser = document.createElement('p')
    nameUser.classList.add('user-name')

    if (isCurrentUser) {
        nameUser.textContent = 'you'
    } else {
        nameUser.textContent = messageData && messageData.displayName ? messageData.displayName : ''
    }

    // create div avatar
    const avatarImg = document.createElement('img')
    avatarImg.src = randomAvatarURL
    avatarImg.alt = 'avatar'
    avatarImg.classList.add('avatar-chat')

    // create text content
    const messageTextDiv = document.createElement('div')
    messageTextDiv.innerHTML = '<p id="tooltip-time" class=" small p-2 ' + (isCurrentUser ? null : 'ms-2') + ' mb-1 ' + (isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3') + '">' + content + '</p>'

    // create text time
    const timestampP = document.createElement('p')
    timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')


    const tooltipTime = timestampP.innerHTML = messageData && messageData.createdAt ?
        `${moment(messageData.createdAt).format('HH:mm')} ${moment(messageData.createdAt).format('MMM DD, YYYY')}` : ''

    messageTextDiv.firstElementChild.setAttribute('data-template', `${tooltipTime}`)

    //tippy time
    tippy('#tooltip-time', {
        content(reference) {
            return reference.getAttribute('data-template')
        },
        theme: 'material',
        animation: 'scale',
        trigger: 'click'
    })

    //add DOM
    messageDiv.appendChild(nameUser)
    messageTextDiv.appendChild(timestampP)
    !isCurrentUser && messageDiv.appendChild(avatarImg)
    messageDiv.appendChild(messageTextDiv)

    if (isScrolling) {
        chatWrapper.insertBefore(messageDiv, chatWrapper.firstElementChild)
        chatWrapper.scrollTop = chatWrapper.clientHeight
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
            "userID": randomUser,
            "cID": "36222",
            "content": messageContent,
            "type": "text",
            "displayName": randomName,
        }
        socket.emit("push2talk_send_msg", JSON.stringify(info), (err, res) => {
            if (err) {
                console.log(err)
            } else {
                displayedMessages.push(res.id)
            }
        })

        // Reset the input field
        messageInput.value = ''

        emoji.style.display = 'none'
    }
}

sendMessageButton.addEventListener('click', sendMessage)

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
})


// /emoji
const wrapEmoji = document.getElementById('wrap-emoji')
const iconEmoji = document.getElementsByClassName('icon-emoji')
const emoji = document.getElementById('emoji')

wrapEmoji.addEventListener('click', () => {
    if (!isEmoji) {
        emoji.style.display = 'block'
        isEmoji = true
    } else {
        emoji.style.display = 'none'
        isEmoji = false
    }
})

emoji.addEventListener('emoji-click', event => {
    console.log(event.detail)
    const emojiUnicode = event.detail.emoji.unicode
    messageInput.value += emojiUnicode
})

// event outside emoji picker
document.addEventListener('click', event => {
    const isClickInsideEmoji = emoji.contains(event.target)
    const isClickInsideWrapEmoji = wrapEmoji.contains(event.target)

    if (!isClickInsideEmoji && !isClickInsideWrapEmoji) {
        emoji.style.display = 'none'
        isEmoji = false
    }
})


let vh = window.innerHeight * 0.01;
console.log(vh)