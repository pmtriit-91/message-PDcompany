import { randomAvatarURL, randomName } from './randomName.js'
import getListFriends from './listFriend.js'

const bodyLeft = document.querySelector('#body-left')
const chatWrapper = document.querySelector('.wrapper-chat')
const divWrapper = document.getElementById('wrapper-chat')
const groupSurecommand = document.getElementById('card-surecommand')

const sendMessageButton = document.getElementById('send-button')
const messageInput = document.getElementById('message-input')
const buttonLogout = document.getElementsByClassName('button-logout')
const emoji = document.getElementById('emoji')

//token
const token = JSON.parse(localStorage.getItem('token'))
const dataUser = JSON.parse(localStorage.getItem('dataUser'))

//fake userID
const randomUser = Number(localStorage.getItem('userID') ? localStorage.getItem('userID') : Math.floor(Math.random() * 9000 + 1000))
localStorage.setItem('userID', randomUser)

//state lastID và trạng thái event scrollTop
let lastMessageId = null
let isScrolling = false

//cid
const cID = '3322'

//id
const loadedMessageIDs = []

//state active group
let isGroup = false

//lưu mảng các cardFriend
const activeCardFriends = []

// baseUrl
const baseUrl = 'https://www.surecommand.com/mobileapp/android.php'
document.addEventListener("DOMContentLoaded", () => {
    if (!token) {
        window.location = '/login.html'
    }
    buttonLogout[0].addEventListener('click', () => {
        localStorage.removeItem('token')
        window.location = '/login.html'
    })
})

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

// CHAT 1-1
// get list friends
const handleRenderCardFriend = (friendData) => {
    friendData.map((friend) => {
        //get lastInfo chat 1-1
        socket.emit('load_last_mess', {
            senderid: friend.id, // friend.id
            receiverid: dataUser.userID //userId
        }, (err, data) => {
            console.log('lastMessPrivate', data)

            //time
            const time = data && data[0] ?
                `${moment(data[0].timestamp).format('HH:mm')} ${moment(data[0].timestamp).format('MMM DD, YYYY')}` : ''
            document.getElementById(`card-time-${friend.id}`).innerHTML = time

            //mess
            if (data && data[0]) {
                if (data.senderid === dataUser.userID) {
                    document.getElementById(`card-text-${friend.id}`).innerHTML = 'you send ' + data[0].message
                } else {
                    document.getElementById(`card-text-${friend.id}`).innerHTML = friend.f_name + ' : ' + data[0].message
                }
            } else {
                document.getElementById(`card-text-${friend.id}`).innerHTML = ''
            }
        })

        //get history 1-1
        const cardFriend = document.getElementById(`friend-${friend.id}`)
        cardFriend.addEventListener('click', () => {
            isGroup = false

            //xóa active group
            groupSurecommand.classList.remove('active')

            // Loại bỏ class "active" từ tất cả các card friend trước đó
            activeCardFriends.forEach(activeCard => {
                activeCard.classList.remove('active')
            })

            // active
            cardFriend.classList.add('active')

            //clean content inside wrapperChat

            //event history chat 1-1
            socket.emit('chat_history', {
                senderid: friend.id, // friend.id
                receiverid: dataUser.userID //userId
            }, (err, dataPrivate) => {
                console.log(dataPrivate)
                var isCurrentUser = dataPrivate.senderid === randomUser
                // tạm dùng randomUser để fake
                // id đúng là dataUser.userID
            })
        })
        activeCardFriends.push(cardFriend)
    })
}
getListFriends(token, dataUser, baseUrl, handleRenderCardFriend)

//CHAT GROUP
// check new-mess
const displayedMessages = []
socket.on('new_mess', (data) => {
    if (!displayedMessages.includes(data.id)) {
        var isCurrentUser = data.userID === randomUser
        addMessageToChat(data.content, isCurrentUser, false, data)
        displayedMessages.push(data.id)
    } else {
        getHistoryMessagesGroup()
    }
})

// get last mess
function getLastMessageGroup() {
    socket.emit('push2talk_last_msg', {}, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            lastMessageId = res.Messages.id
            getHistoryMessagesGroup(res.Messages.id, false)
            chatWrapper.addEventListener('scroll', () => {
                if (chatWrapper.scrollTop === 0) {
                    isScrolling = true
                    lastMessageId = Math.max(0, lastMessageId - 10)
                    getHistoryMessagesGroup(lastMessageId, isScrolling)
                }
            })
        }
    })
}
// getLastMessageGroup()
groupSurecommand.addEventListener('click', () => {
    isGroup = true

    //active
    groupSurecommand.classList.add('active')
    //remove active 
    activeCardFriends.forEach(activeCard => {
        activeCard.classList.remove('active')
    })

    //get lastmess
    getLastMessageGroup()
})

//get history mess
function getHistoryMessagesGroup(id, isScrolling) {
    socket.emit('push2talk_load_msg', { start: ++id, numView: 20 }, (err, res) => {
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

//add mess UI
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

//send mess 1-1
function sendMessagePrivate() {
    const messageContent = messageInput.value.trim()

    if (messageContent) {
        const info = {
            "userID": randomUser,
            "cID": "36222",
            "content": messageContent,
            "type": "text",
            "displayName": randomName,
        }
        // Reset the input field
        messageInput.value = ''

        emoji.style.display = 'none'
    }
}

sendMessageButton.addEventListener('click', () => {
    if (isGroup === true) {
        sendMessage()
    } else {
        sendMessagePrivate()
    }
})

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (isGroup === true) {
            sendMessage()
        } else {
            sendMessagePrivate()
        }
    }
})