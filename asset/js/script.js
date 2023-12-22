import { randomAvatarURL, randomName } from './randomName.js'
// console.log = function () { }

// baseUrl
const baseUrl = 'https://node.surecommand.com/'
const baseURLAndroidPHP = 'https://www.surecommand.com/mobileapp/android.php'
const baseURLAvatarPHP = 'https://www.surecommand.com/profile_image_android.php?'

const chatWrapper = document.querySelector('.wrapper-chat')
const groupSurecommand = document.getElementById('card-surecommand')
const groupSurecommandMobile = document.getElementById('card-surecommand-mobile')

const sendMessageButton = document.getElementById('send-button')
const messageInput = document.getElementById('message-input')
const buttonLogout = document.getElementsByClassName('button-logout')
const emoji = document.getElementById('emoji')
let currentFriend = {
}
//token and userInfo from app
const token = JSON.parse(sessionStorage.getItem('token'))
const dataUser = JSON.parse(sessionStorage.getItem('dataUser'))
const avatarPath = dataUser && dataUser.image2

//state avatar
let avatarURL

//list employees
let employees = []

//fake userID
const randomUser = Number(localStorage.getItem('userID') ? localStorage.getItem('userID') : Math.floor(Math.random() * 9000 + 1000))
localStorage.setItem('userID', randomUser)

//flag attack file
let isAttack = false

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

//1-1 upload
let isUploaded = false
let isUploadWaitImage = false

//group upload
let isUploadedGroup = false
let isUploadWaitGroup = false

//
let currentNewChatDiv = null

//count mess unseen
let arrayFriendID = []

function createAvatarUrl(baseUrlMedia, avatarPath, userID, token) {
    return avatarURL = baseUrlMedia + 'img=' + avatarPath + '&gallery=2&'
        + 'sid=' + Number(userID) + '&token=' + token.slice(1, -1)
}

//get list employees
console.log('dataUser', dataUser);
axios.post(baseURLAndroidPHP, {
    "head": {
        "code": 50,
        "cID": Number(dataUser.cid),
        "token": token,
        "tokenFcm": '',
        "userID": Number(dataUser.userID),
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
        employees = [...response.data.employees]
        console.log('employees', employees);
    })
    .catch(error => console.log(error))

//loaded DOM
document.addEventListener("DOMContentLoaded", () => {
    if (!token) {
        window.location = '/login.html'
    }
    buttonLogout[0].addEventListener('click', () => {
        sessionStorage.removeItem('token')
        window.location = '/login.html'
    })

    //join room
    socket.emit('new_join', { cID: Number(dataUser.cid) }, (err, data) => {
        if (err) {
            console.log('join room error')
        } else {
            console.log('Join the room successfully ✅')
        }
    })

    //get Info-user
    axios.post(baseURLAndroidPHP, {
        "head": {
            "code": 126,
            "cID": Number(dataUser.cid),
            "token": token,
            "tokenFcm": '',
            "userID": dataUser.userID,
            "version": 2
        }
    }, {
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    })
        .then(response => {
            localStorage.setItem('userInfo', JSON.stringify(response.data))
            console.log('userInfo', response.data);
        })
        .catch(error => console.log(error))

    //avatar chat
    const imgAvatarDOM = document.getElementById('avatar')
    createAvatarUrl(baseURLAvatarPHP, avatarPath, dataUser.userID, token)
    imgAvatarDOM.style.backgroundImage = `url(${avatarURL})`
})

//event socket
var socket = io.connect(baseUrl, {
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

//get list friend
let listFriends = []
const arrayPrivate = []
const bodyLeft = document.querySelector('#body-left')
const bodyLeftMobile = document.querySelector('#body-left-mobile')
axios.post(baseURLAndroidPHP, {
    "head": {
        "code": 145, //code 145: list friend
        "userID": dataUser.userID,
        "token": token,
        "cID": dataUser.cid,
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
        console.log(listFriends);
        const usedIndexes = []
        listFriends.forEach((friend) => {
            const array = [4, 5, 6]
            let randomIndex
            do {
                randomIndex = Math.floor(Math.random() * array.length)
            } while (usedIndexes.includes(randomIndex))

            usedIndexes.push(randomIndex)

            const newCard = document.createElement('div')
            newCard.className = 'card card-friend'
            newCard.style.maxWidth = '540px'

            newCard.id = `friend-${friend.id}`

            createAvatarUrl(baseURLAvatarPHP, friend.image2, friend.id, token)
            newCard.innerHTML = `
                    <div class="row row-card-avatar g-0">
                        <div id="friend-img-${friend.id}" class="col-3 col-md-3 custom-img">
                            <img src="${avatarURL}" class="img-fluid avatar-group" alt="...">
                        </div>
                        <div class="col-9 col-md-9 d-flex align-items-center">
                            <div class="card-body" id="card-body-${friend.id}">
                                <h5 class="card-title">${friend.f_name}</h5>
                                <p class="card-text card-text-sub text-start"><small id="card-text-${friend.id}" class="text-body-secondary">last message</small></p>
                                <p class="card-text card-text-sub text-start"><small id="card-time-${friend.id}" class="text-body-secondary text-time">time</small></p>
                                <div class="chat-bubble">
                                    <div class="typing">
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `
            if (window.innerWidth <= 767) {
                bodyLeft.remove()
                bodyLeftMobile.appendChild(newCard)
            } else {
                bodyLeftMobile.remove()
                bodyLeft.appendChild(newCard)
            }

            //render last mess
            arrayFriendID.push(friend.id)
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

            //click card
            $(document).on("click", `#friend-${friend.id}`, function () {
                createAvatarUrl(baseURLAvatarPHP, friend.image2, friend.id, token)
                if (isGroup) {
                    isGroup = false
                    // socket.emit('leave_room', { cID: Number(dataUser.cid) }, (err, data) => {
                    //     console.log('Leaving room...', data)
                    // })
                    messageInput.style.visibility = 'unset'
                    $('#wrap-emoji').show()
                }

                currentFriend = { ...friend }

                currentNewChatDiv = newChatDiv

                console.log('isGroup: ', isGroup)
                //call func save mess unsend
                saveMessWhenSwitchToFriend(friend.id)

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
                //debounce typing
                const debounceTypingEvent = debounce((event) => {
                    const inputValue = event.target.value
                    const info = { receiverid: friend.id, senderid: Number(dataUser.userID) }
                    if (inputValue.length > 0) {
                        socket.emit('chat_typing', info)
                    } else {
                        socket.emit('chat_clear_typing', info)
                    }
                }, 1200)

                // func typing
                const handleTyping = (event) => {
                    clearTimeout(typingTimer)

                    typingTimer = setTimeout(() => {
                        const info = { receiverid: friend.id, senderid: Number(dataUser.userID) }
                        socket.emit('chat_clear_typing', info)
                    }, 10000)

                    debounceTypingEvent(event)
                }

                messageInput.addEventListener('input', (event) => {
                    handleTyping(event)
                })

                //action switch headCardImg
                headCardImg.html(`
                    <img src=${avatarURL} class=" img-fluid avatar-group" alt="...">
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
                // const clientHeight = currentNewChatDiv[0].clientHeight
                currentNewChatDiv[0].scrollTop = scrollHeight

                //xóa active va hide group
                groupSurecommand.classList.remove('active')
                groupSurecommandMobile.classList.remove('active')
                $("#wrapper-chat").hide()

                activeCardFriends.forEach(activeCard => {
                    activeCard.classList.remove('active')
                })

                // active
                newCard.classList.add('active')
            })
            activeCardFriends.push(newCard)
        })
    })
    .catch(error => {
        console.log(error)
    })

//socket on
socket.on('connect', () => {
    console.log("socket initialized successfully ✅")

    // tra thong tin socket bên phía user nhận chat 1-1
    socket.on("socket_result", (data) => {
        console.log('data event socket_result', data)
        if (data.key === "chat_new_message") {
            const id = Number(data.data.senderid)

            let friend = listFriends.find(f => f.id == id)
            console.log('ccccc', friend.divChat)
            addMessPrivate(data.data, friend.divChat, currentFriend, false, false)

            //show lastmess card-friend
            socket.emit('load_last_mess', {
                senderid: id, // friend.id
                receiverid: Number(dataUser.userID) //userId
            }, (err, data) => {
                console.log(data);
                const timeString = data[0].send_timestamp
                const time = data[0] && data[0].send_timestamp ?
                    moment(timeString).format("HH:mm MMM DD, YYYY") : ''
                document.getElementById(`card-time-${id}`).innerHTML = time

                if (Number(data[0].senderid) === Number(dataUser.userID)) {
                    $(`#card-text-${id}`).text('you: ' + data[0].message)
                } else {
                    $(`#card-text-${id}`).text(friend.f_name + ': ' + data[0].message)
                }
            })

            //đếm tin nhắn chưa đọc
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
})

//up media 1-1
let pathMedia
let isMediaSend = false

//xu ly xoa anh
function addImageDeleteEvent() {
    $(document).off('click', '.container-image .btn-del-image')
    $(document).on('click', '.container-image .btn-del-image', deleteImageHandler)
}

function deleteImageHandler(event) {
    const deleteButton = event.target
    const image = deleteButton.closest('.container-image')
    image.remove()
}

function sendImageMessage(friend, currentNewChatDiv, mediaID, pathMedia, dataMediaPrivate, type) {
    if (!isGroup && !isMediaSend) {
        const activeCard = document.querySelector('.card-friend.active')
        if (activeCard) {
            sendMessagePrivate(friend.id, friend, currentNewChatDiv, mediaID, pathMedia, dataMediaPrivate, type)
            isMediaSend = true
            isAttack = false
        } else {
            console.log('loi up anh')
        }
    }
}
function uploadFile(file, friend) {
    const data = new FormData()
    data.append('mediaSendInfo', JSON.stringify({
        userID: dataUser.userID,
        cid: dataUser.cid,
        receiverId: friend.id
    }))
    data.append('images', file)

    const xhr = new XMLHttpRequest()
    let dataMediaPrivate
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(JSON.parse(xhr.responseText))
            dataMediaPrivate = JSON.parse(xhr.responseText)
            if (xhr.status === 200) {
                // console.log('Upload thành công!')
                console.log('dataMediaPrivate', dataMediaPrivate)
                pathMedia = dataMediaPrivate.data.content.replace('public/', '')
                const type = dataMediaPrivate.data.type
                const mediaID = dataMediaPrivate.data.id
                isUploadWaitImage = true
                isUploaded = false
                addMessPrivate(pathMedia, currentNewChatDiv, friend, true, false, isUploadWaitImage, isUploaded, type)
                sendMessageButton.focus()
                isAttack = true

                //del image
                $(document).on('click', '.btn-del-image', function () {
                    addImageDeleteEvent()
                    if (!isGroup) {
                        // const imageWrapper = $('.container-image')
                        // imageWrapper.remove()
                        sendMessageButton.removeEventListener('click', sendImage)
                    }
                    // const imageWrapper = $(this).closest('.container-image')
                    // imageWrapper.remove()
                    // messageInput.disabled = false
                    // remove event click btn-del
                    $(document).off('click', '.btn-del-image')
                    isMediaSend = false
                })

                // messageInput.disabled = true
                sendMessageButton.addEventListener('click', sendImage)

                // func send image
                function sendImage() {
                    if (!isMediaSend) {
                        sendImageMessage(friend, currentNewChatDiv, mediaID, pathMedia, dataMediaPrivate, type)
                        // messageInput.disabled = false
                    }
                }
                isMediaSend = false
            } else {
                console.error('Upload thất bại.')
            }
        }
    }

    xhr.open('POST', 'https://node.surecommand.com/media')
    xhr.send(data)
}

//upload media group
let isMediaSendGroup = false
let dataMedia

function uploadFileGroup(file) {
    const data = new FormData()
    data.append('mediaSendInfo', JSON.stringify({
        userID: dataUser.userID,
        cid: dataUser.cid,
        receiverId: 0
    }))
    data.append('images', file)

    const xhr = new XMLHttpRequest()

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            dataMedia = JSON.parse(xhr.responseText)
            if (xhr.status === 200) {
                console.log('Upload thành công!')
                console.log(dataMedia)
                pathMedia = JSON.stringify(dataMedia.data.content.replace('public/', ''))
                const type = dataMedia.data.type
                isAttack = true
                sendMessageButton.focus()
                isUploadWaitGroup = true
                isUploadedGroup = false
                // messageInput.disabled = true

                const processMedia = () => {
                    addImageDeleteEvent()
                    $(document).on('click', '.btn-del-image', function () {
                        // const mediaWrapper = $(this).closest('.container-image')
                        // mediaWrapper.remove()
                        isGroup && sendMessageButton.removeEventListener('click', sendMsg)
                        // messageInput.disabled = false

                        // remove event click btn-del
                        $(document).off('click', '.btn-del-image')
                        isMediaSendGroup = false
                    })

                    addMessageToChat(pathMedia, true, false, dataMedia, isUploadWaitGroup, isUploadedGroup, type)
                    sendMessageButton.addEventListener('click', sendMsg)

                    // func send image
                    function sendMsg() {
                        if (isGroup && !isMediaSendGroup) {
                            sendMessage(dataMedia)
                            isMediaSendGroup = true
                            // messageInput.disabled = false
                            isAttack = false
                        }
                    }
                    isMediaSendGroup = false
                }

                processMedia()
            } else {
                console.error('Upload thất bại.')
            }
        }
    }

    xhr.open('POST', 'https://node.surecommand.com/media')
    xhr.send(data)
}

//click button upload image (all) 
let fileUploader = document.getElementById('file-uploader')
let isChangeEventAdded = false

$('#open-image-upload').click(function () {
    if (!isChangeEventAdded) {
        fileUploader.addEventListener('change', handleFileChange)
        isChangeEventAdded = true
    }
    fileUploader.click()
})

let x = []
function handleFileChange() {
    x.push(Array(fileUploader.files))
    console.log(x)
    const file = fileUploader.files[0]
    if (file) {

        if (!isGroup) {
            const messageDiv = $("<div>")
            //UX create container image wait
            let divChatCurrent = currentFriend.divChat
            messageDiv.css("overflow-wrap", "anywhere")
            messageDiv.addClass("d-flex flex-row justify-content-start wrap-user container-image container-wait")
            messageDiv.html(`
                <svg class="loading_svg" version="1.1" id="L9" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                    viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
                    <rect x="20" y="40" width="4" height="10" fill="#fff">
                        <animateTransform attributeType="xml"
                        attributeName="transform" type="translate"
                        values="0 0; 0 20; 0 0"
                        begin="0" dur="1.6s" repeatCount="indefinite" />
                    </rect>
                    <rect x="30" y="40" width="4" height="10" fill="#fff">
                        <animateTransform attributeType="xml"
                        attributeName="transform" type="translate"
                        values="0 0; 0 20; 0 0"
                        begin="0.2s" dur="1.6s" repeatCount="indefinite" />
                    </rect>
                    <rect x="40" y="40" width="4" height="10" fill="#fff">
                        <animateTransform attributeType="xml"
                        attributeName="transform" type="translate"
                        values="0 0; 0 20; 0 0"
                        begin="0.4s" dur="1.6s" repeatCount="indefinite" />
                    </rect>
                </svg>
            `)
            divChatCurrent.append(messageDiv)
            divChatCurrent[0].scrollTop = divChatCurrent[0].scrollHeight
        }

        if (isGroup) {
            // chatWrapper
            const messageDiv = document.createElement('div')
            messageDiv.style.overflowWrap = 'anywhere'
            messageDiv.classList.add('text-start', 'justify-content-start', 'wrap-user', 'container-image', 'container-wait-group')
            messageDiv.innerHTML = (`<svg class="loading_svg" version="1.1" id="L9" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
                <rect x="20" y="40" width="4" height="10" fill="#fff">
                    <animateTransform attributeType="xml"
                    attributeName="transform" type="translate"
                    values="0 0; 0 20; 0 0"
                    begin="0" dur="1.6s" repeatCount="indefinite" />
                </rect>
                <rect x="30" y="40" width="4" height="10" fill="#fff">
                    <animateTransform attributeType="xml"
                    attributeName="transform" type="translate"
                    values="0 0; 0 20; 0 0"
                    begin="0.2s" dur="1.6s" repeatCount="indefinite" />
                </rect>
                <rect x="40" y="40" width="4" height="10" fill="#fff">
                    <animateTransform attributeType="xml"
                    attributeName="transform" type="translate"
                    values="0 0; 0 20; 0 0"
                    begin="0.4s" dur="1.6s" repeatCount="indefinite" />
                </rect>
            </svg>`)

            chatWrapper.append(messageDiv)
            chatWrapper.scrollTop = chatWrapper.scrollHeight
        }

        //logic upload
        isGroup ? uploadFileGroup(file) : uploadFile(file, currentFriend)
    }
    // clean file value
    fileUploader.value = null

    fileUploader.removeEventListener('change', handleFileChange)
    isChangeEventAdded = false
}

// ***** CHAT 1-1 *****
const unsentMessages = {}
let currentFriendID = null

function saveMessWhenSwitchToFriend(friendID) {
    unsentMessages[currentFriendID] = messageInput.value
    console.log('unsend :', unsentMessages)

    messageInput.value = unsentMessages[friendID] || ''

    currentFriendID = friendID
}

//count mess unseen 
const senderids = arrayFriendID
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
//send mess 1-1
function sendMessagePrivate(friendID, friend, newChatDiv, mediaID, pathMedia, dataMediaPrivate, type) {
    const messageContent = messageInput.value.trim()

    if (messageContent) {
        const info = {
            "senderid": dataUser.userID,
            "receiverid": friendID,
            "cid": dataUser.cid,
            "message": messageContent,
            "type": "text"
        }

        socket.emit("chat_send_message", JSON.stringify(info), (err, data) => {
            // console.log(data)
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

    if (type === 'image') {
        const info = {
            "senderid": dataUser.userID,
            "receiverid": friendID,
            "cid": dataUser.cid,
            "message": pathMedia,
            mediaID,
            type
        }
        socket.emit("chat_send_message", JSON.stringify(info), (err, data) => {
            // console.log('path', pathMedia);
            isUploaded = data.success
            isUploadWaitImage = false
            const imageWrapper = $('.btn-del-image').closest('.container-image')
            imageWrapper.remove()
            addMessPrivate(pathMedia, newChatDiv, friend, true, false, isUploadWaitImage, isUploaded, type)
        })
    }

    const emditMediaPrivate = () => {
        const message = JSON.stringify({
            _id: dataMediaPrivate.data.id,
            displayName: dataMediaPrivate.data.displayName,
            duration: 0,
            path: pathMedia
        })
        const info = {
            "senderid": dataUser.userID,
            "receiverid": friendID,
            "cid": dataUser.cid,
            "message": message,
            mediaID,
            type
        }
        socket.emit("chat_send_message", JSON.stringify(info), (err, data) => {
            const dataMedia = JSON.parse(data.msg.message)
            const path = dataMedia.path
            isUploaded = true
            isUploadWaitImage = false
            const imageWrapper = $('.btn-del-image').closest('.container-image')
            imageWrapper.remove()
            addMessPrivate(path, newChatDiv, friend, true, false, isUploadWaitImage, isUploaded, type)
        })
    }

    if (type === 'audio') {
        console.log('audio1-1', dataMediaPrivate)
        emditMediaPrivate()
    }

    if (type === 'video') {
        console.log('audio1-1', dataMediaPrivate)
        emditMediaPrivate()
    }
}

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
        console.log('aaa');
        event.preventDefault()
        const activeCard = document.querySelector('.card-friend.active')
        if (activeCard) {
            const friendID = activeCard.id.split('-')[1]
            sendMessagePrivate(friendID, currentFriend, currentNewChatDiv)
        }
    }
})

const getLastMessPrivate = (friend, newChatDiv) => {
    //get lastInfo chat 1-1
    socket.emit('load_last_mess', {
        senderid: friend.id, // friend.id
        receiverid: Number(dataUser.userID) //userId
    }, (err, data) => {
        if (err) {
            console.log(err)
        } else {
            // console.log('lastMessPrivate', data)
            const time = data && data[0] ?
                `${moment(data[0].send_timestamp).format('HH:mm')} ${moment(data[0].send_timestamp).format('MMM DD, YYYY')}` : ''
            document.getElementById(`card-time-${friend.id}`).innerHTML = time

            //last mess
            if (data && data[0]) {
                const type = data[0].type
                if (data[0].senderid === Number(dataUser.userID)) {
                    type !== "text" ? $(`#card-text-${friend.id}`).text('you: ' + type) : $(`#card-text-${friend.id}`).text('you: ' + data[0].message)
                } else {
                    type !== 'text' ? $(`#card-text-${friend.id}`).text(friend.f_name + ': ' + type) : $(`#card-text-${friend.id}`).text(friend.f_name + ': ' + data[0].message)
                }

                //scrollTop event
                let lastMessageId = data[0].id
                friend.divChat = newChatDiv
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
            // console.log('dataPrivate ', dataPrivate)

            const tempMessages = []
            dataPrivate.Messages.forEach(message => {
                if (!loadedMessagePrivateIDs.includes(message.id)) {
                    loadedMessagePrivateIDs.push(message.id)
                    tempMessages.push(message)
                }
            })

            if (isPrivateScrolling) {
                tempMessages.forEach(message => {
                    var isCurrentUser = Number(message.senderid) === Number(dataUser.userID)
                    addMessPrivate(message, newChatDiv, friend, isCurrentUser, true)
                })
            } else {
                tempMessages.reverse().forEach(message => {
                    var isCurrentUser = Number(message.senderid) === Number(dataUser.userID)
                    addMessPrivate(message, newChatDiv, friend, isCurrentUser, false)
                })
            }
        }
    })
}

// open/close Modal show fullsize image
function createModal(img, url) {
    const modal = document.createElement('div')
    modal.classList.add('modal')
    modal.innerHTML = `
        <span id="close-image" class="close">&times;</span>
        <img class="modal-content" id="img01"></img>
    `
    document.body.appendChild(modal)
    $(document).on('click', img, () => {
        console.log(url);
        openModal(url)
    })
    $(document).on('click', '#close-image', () => {
        closeModal()
    })

    $(document).on('click', '.modal', (event) => {
        if (event.target === modal) {
            closeModal()
        }
    })
}

function openModal(url) {
    const modal = document.querySelector('.modal')
    const modalImg = document.getElementById('img01')
    modal.style.display = 'flex'
    modalImg.src = url
}
function closeModal() {
    const modal = document.querySelector('.modal')
    modal.style.display = 'none'
}
// add mess private UI
const addMessPrivate = (data, newChatDiv, friend, isCurrentUser, isPrivateScrolling, isUploadWaitImage, isUploaded, type) => {
    $(document).ready(function () {
        // console.log('dataall', data);
        var messageDiv = $("<div>")
        messageDiv.css("overflow-wrap", "anywhere")
        var nameUser = $("<p>")
        var messageTextDiv = $("<div>")

        if (!isUploadWaitImage && !isUploaded) {
            messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
            nameUser.addClass("user-name").text(isCurrentUser ? "you" : friend.f_name)
            messageTextDiv.html(`<p class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'} mb-1 
                ${isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3'}">${data.message}</p>`)
        }

        if (isUploadWaitImage) {
            let url = baseUrl + data
            $(".container-wait").remove()

            messageDiv.addClass("d-flex flex-row justify-content-start wrap-user container-image")

            switch (type) {
                case "image":
                    const img = '.image-fullsize'

                    messageTextDiv.html(`<div class="wrap-image-wait">
                        <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                        <img src="${url}" class="image-fullsize image-wait text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                        ${isCurrentUser ? 'text-white rounded-3' : 'bg-light rounded-3'}">
                        </img>
                    </div>`)
                    // modal show fullsize image
                    createModal(img, url)
                    break
                case "audio":
                    messageTextDiv.html(`
                        <div class="wrap-image-wait">
                            <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                            <audio controls class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                                ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                                <source src="${url}" type="audio/mpeg">
                            </audio>
                        </div>`)
                    break
                case "video":
                    messageTextDiv.html(`
                        <div class="wrap-image-wait">
                            <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                            <video controls class="video text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                                ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                                <source src="${url}" type="video/mp4">
                            </video>
                        </div>`)
                    break
                default:
                    break;
            }
        }

        if (isUploaded) {
            let pathMedia = data.replace('public/', '')
            let url = baseUrl + pathMedia
            messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")

            switch (type) {
                case "image":
                    const img = '.image-fullsize'

                    messageTextDiv.html(`
                        <img src=${url} class="image-fullsize image-sended text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                        ${isCurrentUser ? 'text-white rounded-3' : 'bg-light rounded-3'}">
                        </img>`)

                    // modal show fullsize image
                    createModal(img, url)
                    break
                case "audio":
                    messageTextDiv.html(`
                        <audio controls class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                            ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                            <source src="${url}" type="audio/mpeg">
                        </audio>`)
                    break
                case "video":
                    messageTextDiv.html(`
                        <video controls class="video text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                            ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                            <source src="${url}" type="video/mp4">
                        </video>`)
                    break
                default:
                    break;
            }
        }

        switch (data.type) {
            case "image":
                const pathMedia = data.message
                const urlImage = baseUrl + pathMedia
                const img = `#image-${friend.id}-${data.id}`

                messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
                messageTextDiv.html(`
                    <img id="image-${friend.id}-${data.id}" src=${urlImage} class="image-sended text-start small p-2 ${isCurrentUser ? null : 'ms-2'}">
                    </img>`)

                // modal show fullsize image
                createModal(img, urlImage)
                break
            case "audio":
                const dataAudio = JSON.parse(data.message)
                const urlaudio = baseUrl + dataAudio.path

                messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
                messageTextDiv.html(`
                    <audio controls class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                        ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                        <source src="${urlaudio}" type="audio/mpeg">
                    </audio>`)
                break
            case "video":
                const dataVideo = JSON.parse(data.message)
                const urlvideo = baseUrl + dataVideo.path

                messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
                messageTextDiv.html(`
                    <video controls class="video text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                        ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                        <source src="${urlvideo}" type="video/mp4">
                    </video>`)
            default:
                break
        }

        createAvatarUrl(baseURLAvatarPHP, friend.image2, friend.id, token)
        var avatarImg = $("<img>").attr("src", avatarURL).addClass("avatar-chat")

        // create text time
        const timestampP = document.createElement('p')
        timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')

        const tooltipTime = timestampP.innerHTML = data && data.send_timestamp ?
            `${moment(data.send_timestamp).format('HH:mm')} ${moment(data.send_timestamp).format('MMM DD, YYYY')}` : ''
        messageTextDiv.find('p').attr('data-tooltip-time-private', tooltipTime)

        // Thêm các thành phần vào messageDiv
        messageDiv.append(nameUser, !isCurrentUser && avatarImg, messageTextDiv)

        //tippy
        const tippyInstance = tippy(messageTextDiv[0], {
            content: tooltipTime,
            theme: 'material',
            animation: 'scale',
            // allowHTML: false,
            // trigger: 'click'
            sticky: true,
            followCursor: false,
            allowHTML: true,
            interactive: true,
            placement: 'top-start'
        })

        if (isUploadWaitImage || isUploaded) {
            //disble tippy
            tippyInstance.destroy()
        }

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

//join/leave group
// getLastMessageGroup() + event click
groupSurecommand.addEventListener('click', () => {
    isGroup = true
    console.log(isGroup)

    // socket.emit('new_join', { cID: Number(dataUser.cid) }, (err, data) => {
    //     if (err) {
    //         console.log('join room error')
    //     } else {
    //         console.log('Join the room successfully ✅')
    //     }
    // })
    // messageInput.style.visibility = 'hidden'
    // $('#wrap-emoji').hide()

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

    //
    chatWrapper.scrollIntoView({ behavior: 'smooth' })
    chatWrapper.scrollTop = chatWrapper.scrollHeight

    //get lastmess
    getLastMessageGroup()
})

//
groupSurecommandMobile.addEventListener('click', () => {
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
        $("[class^='wrapper-private-chat-']").hide()
    })

    //active
    groupSurecommandMobile.classList.add('active')
    //remove active 
    activeCardFriends.forEach(activeCard => {
        activeCard.classList.remove('active')
    })

    //
    chatWrapper.scrollIntoView({ behavior: 'smooth' })
    chatWrapper.scrollTop = chatWrapper.scrollHeight

    //get lastmess
    getLastMessageGroup()
})
//

if (isGroup) {
    getHistoryMessagesGroup()
    getLastMessageGroup()
}

// check new-mess
const displayedMessages = []
socket.on('new_company_mess', (data) => {
    console.log('new data', data)
    isUploadedGroup = true
    isUploadWaitGroup = false
    if (!displayedMessages.includes(data.id)) {
        var isCurrentUser = Number(data.userID) === Number(dataUser.userID)
        addMessageToChat(data.message, isCurrentUser, false, data, isUploadWaitGroup, isUploadedGroup)
        displayedMessages.push(data.id)
    } else {
        getLastMessageGroup()
    }
})

// get last mess
function getLastMessageGroup() {
    socket.emit('load_last_company_chat', { cID: Number(dataUser.cid) }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            if (res.length > 0) {
                let lastMessageId = res[0].id

                chatWrapper.addEventListener('scroll', () => {
                    if (chatWrapper.scrollTop === 0) {
                        isScrolling = true
                        lastMessageId = Math.max(0, lastMessageId - 20)
                        getHistoryMessagesGroup(lastMessageId, isScrolling)
                    }
                })
            }
        }
    })
}

function getHistoryMessagesGroup(id, isScrolling) {
    socket.emit('load_company_chat', { start: ++id, numView: 20, cID: dataUser.cid }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            if (res) {
                const newMessages = res.filter(message => !loadedMessageIDs.includes(message.id))

                newMessages.sort((a, b) => {
                    if (isScrolling) {
                        return new Date(b.createdAt) - new Date(a.createdAt)
                    } else {
                        return new Date(a.createdAt) - new Date(b.createdAt)
                    }
                })

                newMessages.forEach(message => {
                    loadedMessageIDs.push(message.id)
                    const isCurrentUser = message.userID === Number(dataUser.userID)
                    addMessageToChat(message.message, isCurrentUser, isScrolling, message)
                })
            }
        }
    })
}


//add mess UI
function addMessageToChat(message, isCurrentUser, isScrolling, messageData, isUploadWaitGroup, isUploadedGroup, type) {
    // console.log('messageData', messageData)
    // div wrapper
    const messageDiv = document.createElement('div')
    messageDiv.classList.add('d-flex', 'flex-row', 'justify-content-' + (isCurrentUser ? 'end' : 'start'), 'wrap-user')
    messageDiv.style.overflowWrap = 'anywhere'

    //name user
    const nameUser = document.createElement('p')
    nameUser.classList.add('user-name')

    if (isCurrentUser) {
        nameUser.textContent = 'you'
    } else {
        nameUser.textContent = messageData && messageData.userName ? messageData.userName : ''
    }

    // create div avatar
    const avatarImg = document.createElement('div')
    employees.length > 0 && employees.forEach((elm) => {
        if (elm.id === messageData.userID) {
            createAvatarUrl(baseURLAvatarPHP, elm.image2, elm.id, token)
            avatarImg.style.backgroundImage = `url(${avatarURL})`
        }
    })
    avatarImg.classList.add('avatar-chat')
    // employer && createAvatarUrl(baseURLAvatarPHP, employer.image2, employer.id, token)
    // const avatarImg = document.createElement('img')
    // avatarImg.src = avatarURL
    // avatarImg.alt = 'avatar'
    // avatarImg.classList.add('avatar-chat')

    // create text content
    const messageTextDiv = document.createElement('div')

    switch (messageData.type) {
        case 'image':
            {
                const url = baseUrl + message
                const img = `.image-fullsize-${messageData.id}`

                messageTextDiv.innerHTML = (`
                <img src="${url}" class="image-fullsize-${messageData.id} image-sended text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                    ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}"></img>
                `)

                // modal show fullsize image
                createModal(img, url)
            }
            break
        case 'audio':
            {
                const dataAudio = JSON.parse(message)
                const url = baseUrl + dataAudio.path

                messageTextDiv.innerHTML = (`
                <audio controls class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                    ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                    <source src="${url}" type="audio/mpeg">
                </audio>
                `)
            }
            break
        case 'video':
            {
                const dataAudio = JSON.parse(message)
                const url = baseUrl + dataAudio.path
                // console.log(url)

                messageTextDiv.innerHTML = (`
                <video controls class="video text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                    ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                    <source src="${url}" type="video/mp4">
                </video>
                `)
            }
            break
        case 'text':
            {
                // console.log(messageData);
                messageTextDiv.innerHTML = (`
                <p class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'} mb-1 
                ${isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3'}">${messageData.message}</p>
                `)
            }
            break
        default:
            break
    }

    if (isUploadWaitGroup) {
        let url
        messageDiv.classList.remove('justify-content-end')
        messageDiv.classList.add('justify-content-start', 'wrap-user', 'container-image')
        $('.container-wait-group').remove()
        chatWrapper.scrollTop = chatWrapper.scrollHeight

        switch (type) {
            case "image":
                // console.log('waitGroup', isUploadWaitImage)
                url = baseUrl + message.slice(1, -1)
                const img = `.image-fullsize-${messageData.id}`

                messageTextDiv.innerHTML = (`
                <div class="wrap-image-wait">
                    <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                    <img src="${url}" class="image-fullsize-${messageData.id} image-wait text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                    ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}"></img>
                </div>
                `)

                // modal show fullsize image
                createModal(img, url)
                break
            case "audio":
                url = baseUrl + message.slice(1, -1)

                messageTextDiv.innerHTML = (`
                    <div class="wrap-image-wait">
                        <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                        <audio controls class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                            ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                            <source src="${url}" type="audio/mpeg">
                        </audio>
                    </div>
                `)
                break
            case "video":
                url = baseUrl + message.slice(1, -1)

                messageTextDiv.innerHTML = (`
                <div class="wrap-image-wait">
                    <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                    <video controls class="video text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                        ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                        <source src="${url}" type="video/mp4">
                    </video>
                </div>
                `)
                break
            default:
                break
        }
    }

    if (isUploadedGroup) {
        chatWrapper.scrollTop = chatWrapper.scrollHeight
        switch (type) {
            case "image":
                // console.log('sendedGroup', isUploadedGroup)
                console.log(messageData)
                url = baseUrl + message
                const img = `.image-fullsize-${messageData.id}`

                messageTextDiv.innerHTML = (`
                    <img src="${url}" class="image-fullsize-${messageData.id} image-sended text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                    ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}"></img>
                `)

                // modal show fullsize image
                createModal(img, url)
                break
            case "audio":
                url = baseUrl + message

                messageTextDiv.innerHTML = (`
                        <audio controls class="text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                            ${isCurrentUser ? 'text-white rounded-3' : 'rounded-3'}">
                            <source src="${url}" type="audio/mpeg">
                        </audio>
                `)
                break
            case "video":
                break
            default:
                break
        }
        $('.container-image').remove()
    }

    // create text time
    const timestampP = document.createElement('p')
    timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')


    const tooltipTime = timestampP.innerHTML = messageData && messageData.createdAt ?
        `${moment(messageData.createdAt).format('HH:mm')} ${moment(messageData.createdAt).format('MMM DD, YYYY')}` : ''

    //tippy time
    tippy(messageTextDiv, {
        content: tooltipTime,
        theme: 'material',
        animation: 'scale',
        // trigger: 'click',
        sticky: true,
        followCursor: false,
        allowHTML: true,
        interactive: true,
        placement: 'top-start'
    })

    //add DOM
    messageDiv.appendChild(nameUser)
    messageTextDiv.appendChild(timestampP)
    !isCurrentUser && messageDiv.appendChild(avatarImg)
    messageDiv.appendChild(messageTextDiv)

    if (isScrolling) {
        // chatWrapper.insertBefore(messageDiv, chatWrapper.firstElementChild)
        chatWrapper.prepend(messageDiv)
        chatWrapper.scrollTop = chatWrapper.clientHeight
    } else {
        chatWrapper.appendChild(messageDiv)
        chatWrapper.scrollTop = chatWrapper.scrollHeight
    }
}

//send mess
function sendMessage(data) {
    const messageContent = messageInput.value.trim()
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))

    let message
    if (data) {
        const path = data.data.content.replace('public/', "")
        const dataMsg = JSON.stringify({
            _id: data.data.id,
            displayName: data.data.displayName,
            duration: 0,
            path: path
        })
        const emitSendMsgGroup = (dataMedia) => {
            message = {
                "cID": Number(dataUser.cid),
                "displayName": data.data.displayName,
                'mediaID': data.data.id,
                "message": dataMedia,
                "type": data.data.type,
                "userID": Number(dataUser.userID),
                "userName": userInfo.profile.name_first
            }
            socket.emit("push2talk_send_chat", message, (err, res) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(res)
                    displayedMessages.push(res.id)
                }
            })
        }
        switch (data.data.type) {
            case "image":
                emitSendMsgGroup(path)
                break
            case "audio":
                emitSendMsgGroup(dataMsg)
                break
            case "video":
                emitSendMsgGroup(dataMsg)
            default:
                break
        }

        emoji.style.display = 'none'
    }

    if (messageContent) {
        message = {
            "cID": Number(dataUser.cid),
            "displayName": '',
            'mediaID': 0,
            "message": messageContent,
            "type": 'text',
            "userID": Number(dataUser.userID),
            "userName": userInfo.profile.name_first
        }
        socket.emit("push2talk_send_chat", message, (err, res) => {
            if (err) {
                console.log(err)
            } else {
                console.log(res)
                displayedMessages.push(res.id)

                messageInput.value = ''
            }
        })
    }
}

sendMessageButton.addEventListener('click', () => {
    if (isGroup === true && !isAttack) {
        sendMessage()
    }
})

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()

        if (isGroup === true && !isAttack) {
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




