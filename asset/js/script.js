import { randomAvatarURL, randomName } from './randomName.js'
import getListFriends from './listFriend.js'

const chatWrapper = document.querySelector('.wrapper-chat')
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
let isScrolling = false

// scrollTop chat 1-1
let isPrivateScrolling = false

//array id group 
const loadedMessageIDs = []

//array id 1-1
const loadedMessagePrivateIDs = []

//state active group
let isGroup = true

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

    //get full user
    axios.post(baseUrl, {
        "head": {
            "code": 126,
            "cID": 3322,
            "token": token,
            "tokenFcm": '',
            "userID": dataUser.userID,
            "version": 2
        }
    }, {
        headers: {
            "Content-Type": "application/json",
            // Authorization: 'Bearer ' + token,
        },
        withCredentials: true,
    })
        .then(response => {
            localStorage.setItem('userInfo', JSON.stringify(response.data))
        })
        .catch(error => console.log(error))
})

//event socket
var socket = io.connect('https://node.surecommand.com/', {
    query: {
        user: JSON.stringify({
            userID: Number(dataUser.userID),
            cid: dataUser.cid,
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
//send mess 1-1
function sendMessagePrivate(friendID, friend, newChatDiv) {
    const messageContent = messageInput.value.trim()
    // console.log('check friendID :', friendID)

    if (messageContent) {
        const info = {
            "senderid": dataUser.userID,
            "receiverid": friendID,
            "cid": dataUser.cid,
            "message": messageContent,
        }

        socket.emit("chat_send_message", JSON.stringify(info), (err, data) => {
            data && addMessPrivate(data.msg, newChatDiv, friend, true)
        })

        // Reset the input field
        messageInput.value = ''

        emoji.style.display = 'none'
    }
}

const handleRenderCardFriend = (friendData) => {
    const arrayPrivate = []
    friendData.forEach((friend) => {
        //create wrapper-private-chat
        const cardFriend = document.getElementById(`friend-${friend.id}`)
        const newChatDiv = $("<div>")
            .addClass(`wrapper-private-chat`)
            .css({
                'flex': '1',
                'padding-left': '20px',
                'padding-right': '20px',
                'overflow-y': 'scroll',
                'background-color': '#ECF2FF',
            })

        //get lastInfo chat 1-1
        getLastMessPrivate(friend, newChatDiv)

        // // tra thong tin socket bên phía user nhận
        socket.on("socket_result", (data) => {
            const result = data.data
            console.log("data result mess", result)
            if (result) {
                // isGroup === false ? isGroup = false : isGroup = true
                getHistoryPrivate(friend, newChatDiv)
            }
        })

        //create head-img
        const headCardImg = $('.custom-img-head')

        cardFriend.addEventListener('click', () => {
            isGroup = false
            // console.log('isGroup: ', false)

            //send mess 1-1
            // add click and keypress event outside the loop
            sendMessageButton.addEventListener('click', () => {
                if (!isGroup) {
                    const activeCard = document.querySelector('.card-friend.active')
                    if (activeCard) {
                        const friendID = activeCard.id.split('-')[1]
                        sendMessagePrivate(friendID, friend, newChatDiv)
                    }
                }
            })

            messageInput.addEventListener('keypress', (event) => {
                if (!isGroup && event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    const activeCard = document.querySelector('.card-friend.active')
                    if (activeCard) {
                        const friendID = activeCard.id.split('-')[1]
                        sendMessagePrivate(friendID, friend, newChatDiv)
                    }
                }
            })

            //action switch headCardImg
            headCardImg.html(`
            <img src="./asset/image/avatar4.jpeg" class=" img-fluid avatar-group" alt="...">
            <div class="card-head-custom">
                <h5 class="card-title" style="text-align: left;">${friend.f_name}</h5>
            </div>
            `)

            //action hide/show wrapper-private-chat
            arrayPrivate.forEach(nodeElm => {
                nodeElm != newChatDiv ? nodeElm.hide() : nodeElm.show()
            })

            $("#wrapper-chat").after(newChatDiv)
            arrayPrivate.push(newChatDiv)

            //xóa active va hide group
            groupSurecommand.classList.remove('active')
            $("#wrapper-chat").hide()

            // Loại bỏ class "active" từ tất cả các card friend trước đó
            activeCardFriends.forEach(activeCard => {
                activeCard.classList.remove('active')
            })

            // active
            cardFriend.classList.add('active')

            getHistoryPrivate(friend, newChatDiv)
        })
        activeCardFriends.push(cardFriend)
    })
}
getListFriends(token, dataUser, baseUrl, handleRenderCardFriend)

//get last mess private
const getLastMessPrivate = (friend, newChatDiv) => {
    //get lastInfo chat 1-1
    socket.emit('load_last_mess', {
        senderid: friend.id, // friend.id
        receiverid: Number(dataUser.userID) //userId
    }, (err, data) => {
        if (err) {
            console.log(err)
        } else {
            console.log('lastMessPrivate', data)

            //add info sidebar left
            //time
            const time = data && data[0] ?
                `${moment(data[0].timestamp).format('HH:mm')} ${moment(data[0].timestamp).format('MMM DD, YYYY')}` : ''
            document.getElementById(`card-time-${friend.id}`).innerHTML = time

            //last mess
            if (data && data[0]) {
                if (data[0].senderid === Number(dataUser.userID)) {
                    $(`#card-text-${friend.id}`).text('you: ' + data[0].message)
                } else {
                    $(`#card-text-${friend.id}`).text(friend.f_name + ': ' + data[0].message)
                }

                //scrollTop event
                let lastMessageId = data[0].id
                newChatDiv.on('scroll', () => {
                    if (newChatDiv.scrollTop() === 0) {
                        isPrivateScrolling = true
                        lastMessageId = Math.max(0, lastMessageId - 20)
                        getHistoryPrivate(friend, newChatDiv, lastMessageId, isPrivateScrolling)
                    }
                })

            } else {
                $(`#card-text-${friend.id}`).text('')
            }
        }
    })
}

//get history mess private
const getHistoryPrivate = (friend, newChatDiv, id, isPrivateScrolling) => {
    // console.log(id)
    // console.log(friend.id)
    //event history chat 1-1
    socket.emit('chat_history', {
        senderid: friend.id, // friend.id
        receiverid: dataUser.userID, //userId
        start: ++id,
        numView: 20
    }, (err, dataPrivate) => {
        if (err) {
            console.log(err)
        } else {
            console.log('dataPrivate ', dataPrivate)
            //add history in DOM
            const arrPrivateReverse = dataPrivate.Messages.reverse()
            const newPrivateMessages = arrPrivateReverse.filter(message => !loadedMessagePrivateIDs.includes(message.id))

            newPrivateMessages.forEach(message => {
                loadedMessagePrivateIDs.push(message.id)
                var isCurrentUser = message.senderid === Number(dataUser.userID)

                if (isPrivateScrolling) {
                    // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                    addMessPrivate(message, newChatDiv, friend, isCurrentUser, true)
                } else {
                    // Nếu không cuộn, thêm tin nhắn vào dưới cùng
                    addMessPrivate(message, newChatDiv, friend, isCurrentUser, false)
                }
            })
        }
    })
}

// add mess private UI
const addMessPrivate = (data, newChatDiv, friend, isCurrentUser, isPrivateScrolling) => {
    //xoá wrapper-chat, tạo ra wrapper-private-chat và đổ dữ liệu
    $(document).ready(function () {
        $("#wrapper-chat").hide()

        // Tạo thẻ <div> messageDiv và cấu trúc bên trong
        var messageDiv = $("<div>").addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
        var nameUser = $("<p>").addClass("user-name").text(isCurrentUser ? "you" : friend.f_name)

        var messageTextDiv = $("<div>").html(`
          <p id="tooltip-time" class="small p-2 ${isCurrentUser ? null : 'ms-2'} mb-1 ${isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3'}">${data.message}</p>
        `)
        var avatarImg = $("<img>").attr("src", randomAvatarURL).addClass("avatar-chat")

        // create text time
        const timestampP = document.createElement('p')
        timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')

        const tooltipTime = timestampP.innerHTML = data && data.createdAt ?
            `${moment(data.createdAt).format('HH:mm')} ${moment(data.createdAt).format('MMM DD, YYYY')}` : ''
        messageTextDiv[0].firstElementChild.setAttribute('data-template', `${tooltipTime}`)

        //tippy time
        tippy('#tooltip-time', {
            content(reference) {
                return reference.getAttribute('data-template')
            },
            theme: 'material',
            animation: 'scale',
            trigger: 'click'
        })

        // Thêm các thành phần vào messageDiv
        messageDiv.append(nameUser, !isCurrentUser && avatarImg, messageTextDiv)

        // Thêm messageDiv vào đầu wrapper-private-chat
        // newChatDiv.append(messageDiv)

        if (isPrivateScrolling) {
            newChatDiv.prepend(messageDiv)
        } else {
            newChatDiv.append(messageDiv)
            newChatDiv[0].scrollTop = newChatDiv[0].scrollHeight
        }
    })
}

// ----------------------------------------------------------------------------------------------- //

//CHAT GROUP

getHistoryMessagesGroup()

// check new-mess
const displayedMessages = []
socket.on('new_mess', (data) => {
    if (!displayedMessages.includes(data.id)) {
        var isCurrentUser = Number(data.userID) === Number(dataUser.userID)
        addMessageToChat(data.content, isCurrentUser, false, data)
        displayedMessages.push(data.id)
    } else {
        getLastMessageGroup()
    }
})

// get last mess
function getLastMessageGroup() {
    socket.emit('push2talk_last_msg', {}, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            let lastMessageId = res.Messages.id
            // if (!loadedMessageIDs.includes(++lastMessageId)) {
            //     loadedMessageIDs.push(lastMessageId)
            //     // getHistoryMessagesGroup(lastMessageId)
            // }
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

// getLastMessageGroup() + event click
groupSurecommand.addEventListener('click', () => {
    isGroup = true
    console.log(isGroup)

    // create head-img
    $('.custom-img-head').html(`
        <div class="col-10 col-md-8 col-lg-6 custom-img custom-img-head">
            <img src="./asset/image/groupAvatar3.jpeg" class=" img-fluid avatar-group"
                alt="...">
            <div class="card-head-custom">
                <h5 class="card-title" style="text-align: left;">Group Surecommand</h5>
            </div>
        </div>`)

    //show lại wrapper-chat và ẩn đi wrapper-chat-group
    $(document).ready(function () {
        $("#wrapper-chat").show()
        $("[class^='wrapper-private-chat']").hide()
    })

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
                var isCurrentUser = message.userID === Number(dataUser.userID)

                if (isScrolling) {
                    // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                    addMessageToChat(message.content, isCurrentUser, true, message)
                    if (loadedMessageIDs.includes(message.id)) {

                    }
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
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))

    if (messageContent) {
        const info = {
            "userID": Number(dataUser.userID),
            "cID": dataUser.cid,
            "content": messageContent,
            "type": "text",
            "displayName": userInfo.profile.name_first,
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

sendMessageButton.addEventListener('click', () => {
    if (isGroup === true) {
        sendMessage()
    }
})

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()

        if (isGroup === true) {
            sendMessage()
        }
    }
})