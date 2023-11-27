import { randomAvatarURL, randomName } from './randomName.js'
import getListFriends from './listFriend.js'

// console.log = function () { }

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
//đếm tin nhắn chưa đọc
const senderids = JSON.parse(localStorage.getItem('arrayFriendID'))
const infoCount = {
    senderids: senderids,
    receiverid: Number(dataUser.userID)
}
socket.emit('get_unread_count', infoCount, (err, data) => {
    data.forEach((elm) => {
        if (senderids.includes(elm.senderid)) {
            const friendImgDiv = $(`#friend-img-${elm.senderid}`)
            const noteMessDiv = $('<div>').addClass(`note-mess-${elm.senderid}`)
            const noteMess = $('<p>').text(elm.unread)

            friendImgDiv.append(noteMessDiv.append(noteMess))

            //đánh dấu đã đọc tin nhắn
            // //
            const cardFriend = document.getElementById(`friend-${elm.senderid}`)
            cardFriend.addEventListener('click', () => {
                const infoRead = {
                    senderid: Number(dataUser.userID),
                    receiverid: elm.senderid
                }
                socket.emit('mark_as_read', infoRead, (err, data) => {
                    console.log(data)
                    noteMessDiv.remove()
                })
            })

        }
    })
})
// get list friends
// lưu biến golbal cho các data friend và div của nó
let currentFriend = null
let currentNewChatDiv = null
//send mess 1-1
function sendMessagePrivate(friendID, friend, newChatDiv) {
    const messageContent = messageInput.value.trim()
    // console.log('check friendID :', friendID)
    // console.log('friend :', friend)

    if (messageContent) {
        const info = {
            "senderid": dataUser.userID,
            "receiverid": friendID,
            "cid": dataUser.cid,
            "message": messageContent,
        }

        socket.emit("chat_send_message", JSON.stringify(info), (err, data) => {
            console.log(data)
            if (Number(data.msg.receiverid) === Number(friendID)) {
                addMessPrivate(data.msg, newChatDiv, friend, true, false)

                //show lastmess card-friend
                const timeString = data.msg.send_timestamp
                const time = data.msg ?
                    moment(timeString).format("HH:mm MMM DD, YYYY") : ''
                document.getElementById(`card-time-${friendID}`).innerHTML = time

                if (Number(data.msg.senderid) === Number(dataUser.userID)) {
                    $(`#card-text-${friendID}`).text('you: ' + data.msg.message)
                } else {
                    $(`#card-text-${friendID}`).text(friend.f_name + ': ' + data.msg.message)
                }
            }

            //remove notemess after send
            const receiverid = Number(data.msg.receiverid)
            if (senderids.includes(Number(receiverid))) {
                const noteMessDiv = $(`.note-mess-${receiverid}`)

                if (noteMessDiv) {
                    const infoRead = {
                        senderid: Number(dataUser.userID),
                        receiverid: receiverid
                    }
                    socket.emit('mark_as_read', infoRead, (err, data) => {
                        noteMessDiv.remove()
                    })
                }
            }
        })

        // Reset the input field
        messageInput.value = ''

        emoji.style.display = 'none'
    }
}

const handleRenderCardFriend = (friendData) => {
    const arrayPrivate = []
    const arrayFriendID = []

    friendData.forEach((friend) => {
        // mảng lưu friendID
        arrayFriendID.push(friend.id)
        localStorage.setItem('arrayFriendID', JSON.stringify(arrayFriendID))

        //create wrapper-private-chat
        const cardFriend = document.getElementById(`friend-${friend.id}`)
        const newChatDiv = $("<div>")
            .addClass(`wrapper-private-chat-${friend.id}`)
            .css({
                'flex': '1',
                'padding-left': '20px',
                'padding-right': '20px',
                'overflow-y': 'scroll',
            })

        //get lastInfo chat 1-1
        getLastMessPrivate(friend, newChatDiv)

        //create head-img
        const headCardImg = $('.custom-img-head')

        cardFriend.addEventListener('click', () => {
            isGroup = false
            currentFriend = friend
            currentNewChatDiv = newChatDiv
            // console.log('isGroup: ', false)

            //debounce input
            function debounce(func, delay) {
                let timer
                return function (...args) {
                    const context = this
                    clearTimeout(timer)
                    timer = setTimeout(() => {
                        func.apply(context, args)
                    }, delay)
                }
            }

            let typingTimer
            // Sử dụng debounce function
            const debounceTypingEvent = debounce((event) => {
                const inputValue = event.target.value
                console.log(inputValue)
                const info = { receiverid: friend.id, senderid: Number(dataUser.userID) }
                if (inputValue.length > 0) {
                    socket.emit('chat_typing', info)
                } else {
                    socket.emit('chat_clear_typing', info)
                }
            }, 1200)

            // Hàm để xử lý khi người dùng gõ tin nhắn
            const handleTyping = (event) => {
                clearTimeout(typingTimer) // Xóa hẹn giờ trước đó (nếu có)

                typingTimer = setTimeout(() => {
                    const info = { receiverid: friend.id, senderid: Number(dataUser.userID) }
                    socket.emit('chat_clear_typing', info)
                }, 10000)

                debounceTypingEvent(event)
            }

            //sự kiện input xảy ra trên messageInput
            messageInput.addEventListener('input', (event) => {
                handleTyping(event)
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
                nodeElm != currentNewChatDiv ? nodeElm.hide() : nodeElm.show()
            })

            $("#wrapper-chat").after(currentNewChatDiv)
            arrayPrivate.push(currentNewChatDiv)
            // Scroll về cuối cùng của newChatDiv
            const scrollHeight = currentNewChatDiv[0].scrollHeight
            const clientHeight = currentNewChatDiv[0].clientHeight
            currentNewChatDiv[0].scrollTop = scrollHeight

            //xóa active va hide group
            groupSurecommand.classList.remove('active')
            $("#wrapper-chat").hide()

            // Loại bỏ class "active" từ tất cả các card friend trước đó
            activeCardFriends.forEach(activeCard => {
                activeCard.classList.remove('active')
            })

            // active
            cardFriend.classList.add('active')

            //send mess 1-1
            // add click and keypress event outside the loop
            sendMessageButton.addEventListener('click', () => {
                if (!isGroup) {
                    const activeCard = document.querySelector('.card-friend.active')
                    if (activeCard) {
                        const friendID = activeCard.id.split('-')[1]
                        sendMessagePrivate(friendID, currentFriend, currentNewChatDiv)
                    }
                }
            })
            messageInput.addEventListener('keypress', (event) => {
                if (!isGroup && event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    const activeCard = document.querySelector('.card-friend.active')
                    if (activeCard) {
                        const friendID = activeCard.id.split('-')[1]
                        sendMessagePrivate(friendID, currentFriend, currentNewChatDiv)
                    }
                }
            })
            // getHistoryPrivate(friend, newChatDiv)
        })
        // // tra thong tin socket bên phía user nhận
        socket.on("socket_result", (data) => {
            console.log('data event socket_result', data)
            if (data.key === "chat_new_message" && Number(data.data.senderid) === Number(friend.id)) {
                // getLastMessPrivate(friend, newChatDiv)
                addMessPrivate(data.data, newChatDiv, friend, false, false)

                //show lastmess card-friend
                socket.emit('load_last_mess', {
                    senderid: friend.id, // friend.id
                    receiverid: Number(dataUser.userID) //userId
                }, (err, data) => {
                    const timeString = data[0].send_timestamp
                    const time = data[0] && data[0].send_timestamp ?
                        moment(timeString).format("HH:mm MMM DD, YYYY") : ''
                    document.getElementById(`card-time-${friend.id}`).innerHTML = time

                    if (Number(data[0].senderid) === Number(dataUser.userID)) {
                        $(`#card-text-${friend.id}`).text('you: ' + data[0].message)
                    } else {
                        $(`#card-text-${friend.id}`).text(friend.f_name + ': ' + data[0].message)
                    }
                })

                //đếm tin nhắn chưa đọc
                const senderids = JSON.parse(localStorage.getItem('arrayFriendID'))
                const infoCount = {
                    senderids: senderids,
                    receiverid: Number(dataUser.userID)
                }
                socket.emit('get_unread_count', infoCount, (err, data) => {
                    data.forEach((elm) => {
                        if (senderids.includes(elm.senderid)) {
                            const friendImgDiv = $(`#friend-img-${elm.senderid}`)
                            const noteMessDiv = $('<div>').addClass(`note-mess-${elm.senderid}`)
                            const noteMess = $('<p>').text(elm.unread)

                            friendImgDiv.append(noteMessDiv.append(noteMess))

                            //đánh dấu đã đọc tin nhắn
                            // //
                            const cardFriend = document.getElementById(`friend-${elm.senderid}`)
                            cardFriend.addEventListener('click', () => {
                                const infoRead = {
                                    senderid: Number(dataUser.userID),
                                    receiverid: elm.senderid
                                }
                                socket.emit('mark_as_read', infoRead, (err, data) => {
                                    noteMessDiv.remove()
                                })
                            })

                        }
                    })
                })
                localStorage.setItem('arrayCurrentLastIdAndFriendId', JSON.stringify([data.data.id, Number(data.data.receiverid)]))
            }

            //typing
            const cardBody = $(`#card-body-${data.data.senderid}`)
            const chatBubble = cardBody.find('.chat-bubble')
            if (data.key === "chat_typing") {
                // ẩn tất cả các phần tử <p> có trong card-body
                cardBody.find('p').hide()
                chatBubble.show()
            } else {
                cardBody.find('p').show()
                chatBubble.hide()
            }
        })
        activeCardFriends.push(cardFriend)
    })
}
getListFriends(token, dataUser, baseUrl, handleRenderCardFriend)

// const idPairs = []
// function addToIdPairs(lastid, receiverid) {
//     const pair = [lastid, receiverid]
//     idPairs.push(pair)
//     // console.log(idPairs)
//     localStorage.setItem('arraylastIdAndFriendId', JSON.stringify(idPairs))
// }
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
                `${moment(data[0].send_timestamp).format('HH:mm')} ${moment(data[0].send_timestamp).format('MMM DD, YYYY')}` : ''
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
                // let receiverid = data[0].receiverid
                // addToIdPairs(lastMessageId, receiverid)
                getHistoryPrivate(friend, newChatDiv, lastMessageId, false)
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
    socket.emit('chat_history', {
        senderid: friend.id,
        receiverid: dataUser.userID,
        start: ++id,
        numView: 20
    }, (err, dataPrivate) => {
        if (err) {
            console.log(err)
        } else {
            console.log('dataPrivate ', dataPrivate)

            // Tạo một mảng tạm thời để giữ tin nhắn theo thứ tự
            const tempMessages = []

            // Lặp qua tin nhắn từ server và thêm vào mảng tạm thời
            dataPrivate.Messages.forEach(message => {
                if (!loadedMessagePrivateIDs.includes(message.id)) {
                    loadedMessagePrivateIDs.push(message.id)
                    tempMessages.push(message)
                }
            })

            // Sắp xếp mảng tạm thời theo thời gian
            // tempMessages.sort((a, b) => {a.timestamp - b.timestamp})

            if (isPrivateScrolling) {
                // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                tempMessages.forEach(message => {
                    var isCurrentUser = Number(message.senderid) === Number(dataUser.userID)
                    addMessPrivate(message, newChatDiv, friend, isCurrentUser, true)
                })
            } else {
                // Nếu không cuộn, thêm tin nhắn vào dưới cùng
                tempMessages.reverse().forEach(message => {
                    var isCurrentUser = Number(message.senderid) === Number(dataUser.userID)
                    addMessPrivate(message, newChatDiv, friend, isCurrentUser, false)
                })
            }
        }
    })
}

// add mess private UI
const addMessPrivate = (data, newChatDiv, friend, isCurrentUser, isPrivateScrolling) => {
    // console.log('data ', data)
    // console.log('friend ', friend)
    //xoá wrapper-chat, tạo ra wrapper-private-chat và đổ dữ liệu
    $(document).ready(function () {
        var messageDiv = $("<div>").addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
        var nameUser = $("<p>").addClass("user-name").text(isCurrentUser ? "you" : friend.f_name)

        var messageTextDiv = $("<div>")
            .html(`
                <p class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'} mb-1 
                ${isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3'}">${data.message}</p>
            `)
        var avatarImg = $("<img>").attr("src", randomAvatarURL).addClass("avatar-chat")

        // create text time
        const timestampP = document.createElement('p')
        timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')

        const tooltipTime = timestampP.innerHTML = data && data.send_timestamp ?
            `${moment(data.send_timestamp).format('HH:mm')} ${moment(data.send_timestamp).format('MMM DD, YYYY')}` : ''
        messageTextDiv.find('p').attr('data-tooltip-time-private', tooltipTime)

        // Thêm các thành phần vào messageDiv
        messageDiv.append(nameUser, !isCurrentUser && avatarImg, messageTextDiv)

        //tippy time
        tippy(messageTextDiv[0], {
            content: tooltipTime,
            theme: 'material',
            animation: 'scale',
            allowHTML: false,
            // trigger: 'click'
        })

        // Thêm messageDiv vào đầu wrapper-private-chat
        // console.log(newChatDiv)
        if (isPrivateScrolling) {
            newChatDiv.prepend(messageDiv)
            newChatDiv[0].scrollTop = newChatDiv[0].clientHeight
        } else {
            newChatDiv.append(messageDiv)
            newChatDiv[0].scrollTop = newChatDiv[0].scrollHeight
        }
    })
}

// ----------------------------------------------------------------------------------------------- //

//CHAT GROUP

getHistoryMessagesGroup()
getLastMessageGroup()

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
            if (res.length > 0) {
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
        }
    })
}

// getLastMessageGroup() + event click
groupSurecommand.addEventListener('click', () => {
    isGroup = true
    // console.log(isGroup)

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
        $("[class^='wrapper-private-chat-']").hide()
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
    messageTextDiv.innerHTML = '<p class=" small p-2 ' + (isCurrentUser ? null : 'ms-2') + ' mb-1 ' + (isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3') + '">' + content + '</p>'

    // create text time
    const timestampP = document.createElement('p')
    timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')


    const tooltipTime = timestampP.innerHTML = messageData && messageData.createdAt ?
        `${moment(messageData.createdAt).format('HH:mm')} ${moment(messageData.createdAt).format('MMM DD, YYYY')}` : ''
    // messageTextDiv.firstElementChild.setAttribute('data-tooltip-time-group', `${tooltipTime}`)

    //tippy time
    tippy(messageTextDiv, {
        content: tooltipTime,
        theme: 'material',
        animation: 'scale',
        // trigger: 'click'
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

//tippy Louout
tippy('.button-logout', {
    content: 'Logout',
    theme: 'material',
    animation: 'scale',
    // trigger: 'click'
})