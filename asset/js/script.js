import { randomAvatarURL, randomName } from './randomName.js'
// import getListFriends from './listFriend.js'

// console.log = function () { }

const chatWrapper = document.querySelector('.wrapper-chat')
const groupSurecommand = document.getElementById('card-surecommand')

const sendMessageButton = document.getElementById('send-button')
const messageInput = document.getElementById('message-input')
const buttonLogout = document.getElementsByClassName('button-logout')
const emoji = document.getElementById('emoji')
let currentFriend = {
}
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

//
let isUploaded = false
let isUploadWaitImage = false

//
let currentNewChatDiv = null

//count mess unseen
let arrayFriendID = []

// baseUrl
const baseUrl = 'https://node.surecommand.com/'
const urlFullInfo = 'https://www.surecommand.com/mobileapp/android.php'
document.addEventListener("DOMContentLoaded", () => {
    if (!token) {
        window.location = '/login.html'
    }
    buttonLogout[0].addEventListener('click', () => {
        localStorage.removeItem('token')
        window.location = '/login.html'
    })

    //get full user
    axios.post(urlFullInfo, {
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
axios.post(urlFullInfo, {
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
        // localStorage.setItem('dataFriends', JSON.stringify(listFriends))
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

            newCard.innerHTML = `
                    <div class="row row-card-avatar g-0">
                        <div id="friend-img-${friend.id}" class="col-3 col-md-3 custom-img">
                            <img src="./asset/image/avatar${array[randomIndex]}.jpeg" class="img-fluid avatar-group" alt="...">
                        </div>
                        <div class="col-9 col-md-9 d-flex align-items-center">
                            <div class="card-body" id="card-body-${friend.id}">
                                <h5 class="card-title">${friend.f_name}</h5>
                                <p class="card-text card-text-sub"><small id="card-text-${friend.id}" class="text-body-secondary">last message</small></p>
                                <p class="card-text card-text-sub"><small id="card-time-${friend.id}" class="text-body-secondary text-time">time</small></p>
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
            bodyLeft.appendChild(newCard)

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
                isGroup = false
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

//

socket.on('connect', () => {
    console.log("socket initialized successfully ✅")

    // tra thong tin socket bên phía user nhận
    socket.on("socket_result", (data) => {
        console.log('data event socket_result', data)
        // switch (data.key) {
        //     case 'chat_new_message':
        //         break;
        // }
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

//up image
let pathImage
let isImageSent = false
function sendImageMessage(friend, currentNewChatDiv, mediaID, pathImage, type) {
    if (!isGroup && !isImageSent) {
        const activeCard = document.querySelector('.card-friend.active')
        if (activeCard) {
            sendMessagePrivate(friend.id, friend, currentNewChatDiv, mediaID, pathImage, type)
            isImageSent = true
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

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(JSON.parse(xhr.responseText))
            const dataImage = JSON.parse(xhr.responseText)
            if (xhr.status === 200) {
                // console.log('Upload thành công!')
                // console.log('dataImage', dataImage)
                pathImage = dataImage.data.content.replace('public/', '')
                const type = dataImage.data.type
                const mediaID = dataImage.data.id
                isUploadWaitImage = true
                isUploaded = false
                addMessPrivate(pathImage, currentNewChatDiv, friend, true, false, isUploadWaitImage, isUploaded)
                sendMessageButton.focus()

                //del image
                $(document).on('click', '.btn-del-image', function () {
                    const imageWrapper = $(this).closest('.container-image')
                    imageWrapper.remove()
                    messageInput.disabled = false
                    // remove event click btn-del
                    $(document).off('click', '.btn-del-image')
                    sendMessageButton.removeEventListener('click', sendImage)
                    isImageSent = false
                })

                messageInput.disabled = true
                sendMessageButton.addEventListener('click', sendImage)

                // func send image
                function sendImage() {
                    if (!isImageSent) {
                        sendImageMessage(friend, currentNewChatDiv, mediaID, pathImage, type)
                        messageInput.disabled = false
                    }
                }
                isImageSent = false
            } else {
                console.error('Upload thất bại.')
            }
        }
    }

    xhr.open('POST', 'https://node.surecommand.com/media')
    xhr.send(data)
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
function sendMessagePrivate(friendID, friend, newChatDiv, mediaID, pathImage, type) {
    const messageContent = messageInput.value.trim()

    if (messageContent) {
        const info = {
            "senderid": dataUser.userID,
            "receiverid": friendID,
            "cid": dataUser.cid,
            "message": messageContent,
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
            "message": pathImage,
            mediaID,
            type
        }
        socket.emit("chat_send_message", JSON.stringify(info), (err, data) => {
            // console.log('path', pathImage);
            isUploaded = data.success
            isUploadWaitImage = false
            const imageWrapper = $('.btn-del-image').closest('.container-image')
            imageWrapper.remove()
            addMessPrivate(pathImage, newChatDiv, friend, true, false, isUploadWaitImage, isUploaded)
        })
    }
}

// const handleRenderCardFriend = (friendData) => {
//     return
//     const arrayPrivate = []
//     // const arrayFriendID = []

//     friendData.forEach((friend) => {
//         arrayFriendID.push(friend.id)

//         //create wrapper-private-chat
//         const cardFriend = $(`#friend-${friend.id}`)
//         // const cardFriend = document.getElementById(`friend-${friend.id}`)
//         const newChatDiv = $("<div>")
//             .addClass(`wrapper-private-chat-${friend.id}`)
//             .css({
//                 'flex': '1',
//                 'padding-left': '20px',
//                 'padding-right': '20px',
//                 'overflow-y': 'scroll',
//             })

//         //get lastInfo chat 1-1
//         getLastMessPrivate(friend, newChatDiv)

//         //create head-img
//         const headCardImg = $('.custom-img-head')

//         cardFriend.click(() => {
//             isGroup = false
//             currentFriend = { ...friend }

//             currentNewChatDiv = newChatDiv

//             console.log('isGroup: ', isGroup)
//             //call func save mess unsend
//             saveMessWhenSwitchToFriend(friend.id)

//             //debounce input
//             function debounce(func, delay) {
//                 let timer
//                 return function (...args) {
//                     const context = this
//                     clearTimeout(timer)
//                     timer = setTimeout(() => {
//                         func.apply(context, args)
//                     }, delay)
//                 }
//             }

//             let typingTimer
//             //debounce typing
//             const debounceTypingEvent = debounce((event) => {
//                 const inputValue = event.target.value
//                 const info = { receiverid: friend.id, senderid: Number(dataUser.userID) }
//                 if (inputValue.length > 0) {
//                     socket.emit('chat_typing', info)
//                 } else {
//                     socket.emit('chat_clear_typing', info)
//                 }
//             }, 1200)

//             // func typing
//             const handleTyping = (event) => {
//                 clearTimeout(typingTimer)

//                 typingTimer = setTimeout(() => {
//                     const info = { receiverid: friend.id, senderid: Number(dataUser.userID) }
//                     socket.emit('chat_clear_typing', info)
//                 }, 10000)

//                 debounceTypingEvent(event)
//             }

//             messageInput.addEventListener('input', (event) => {
//                 handleTyping(event)
//             })

//             //action switch headCardImg
//             headCardImg.html(`
//             <img src="./asset/image/avatar4.jpeg" class=" img-fluid avatar-group" alt="...">
//             <div class="card-head-custom">
//                 <h5 class="card-title" style="text-align: left;">${friend.f_name}</h5>
//             </div>
//             `)

//             //action hide/show wrapper-private-chat
//             arrayPrivate.forEach(nodeElm => {
//                 nodeElm != currentNewChatDiv ? nodeElm.hide() : nodeElm.show()
//             })

//             $("#wrapper-chat").after(currentNewChatDiv)
//             arrayPrivate.push(currentNewChatDiv)
//             // Scroll về cuối cùng của newChatDiv
//             const scrollHeight = currentNewChatDiv[0].scrollHeight
//             const clientHeight = currentNewChatDiv[0].clientHeight
//             currentNewChatDiv[0].scrollTop = scrollHeight

//             //xóa active va hide group
//             groupSurecommand.classList.remove('active')
//             $("#wrapper-chat").hide()

//             activeCardFriends.forEach(activeCard => {
//                 activeCard.removeClass('active')
//             })

//             // active
//             cardFriend.addClass('active')
//         })
//         // // // tra thong tin socket bên phía user nhận
//         // socket.on("socket_result", (data) => {
//         //     console.log('data event socket_result', data)
//         //     if (data.key === "chat_new_message" && Number(data.data.senderid) === Number(friend.id)) {
//         //         // getLastMessPrivate(friend, newChatDiv)
//         //         addMessPrivate(data.data, newChatDiv, friend, false, false)

//         //         //show lastmess card-friend
//         //         socket.emit('load_last_mess', {
//         //             senderid: friend.id, // friend.id
//         //             receiverid: Number(dataUser.userID) //userId
//         //         }, (err, data) => {
//         //             const timeString = data[0].send_timestamp
//         //             const time = data[0] && data[0].send_timestamp ?
//         //                 moment(timeString).format("HH:mm MMM DD, YYYY") : ''
//         //             document.getElementById(`card-time-${friend.id}`).innerHTML = time

//         //             if (Number(data[0].senderid) === Number(dataUser.userID)) {
//         //                 $(`#card-text-${friend.id}`).text('you: ' + data[0].message)
//         //             } else {
//         //                 $(`#card-text-${friend.id}`).text(friend.f_name + ': ' + data[0].message)
//         //             }
//         //         })

//         //         //đếm tin nhắn chưa đọc
//         //         const senderids = JSON.parse(localStorage.getItem('arrayFriendID'))
//         //         const infoCount = {
//         //             senderids: senderids,
//         //             receiverid: Number(dataUser.userID)
//         //         }
//         //         socket.emit('get_unread_count', infoCount, (err, data) => {
//         //             data.forEach((elm) => {
//         //                 if (senderids.includes(elm.senderid)) {
//         //                     const friendImgDiv = $(`#friend-img-${elm.senderid}`)
//         //                     const noteMessDiv = $('<div>').addClass(`note-mess-${elm.senderid}`)
//         //                     const noteMess = $('<p>').text(elm.unread)

//         //                     friendImgDiv.append(noteMessDiv.append(noteMess))

//         //                     //đánh dấu đã đọc tin nhắn
//         //                     // //
//         //                     const cardFriend = document.getElementById(`friend-${elm.senderid}`)
//         //                     cardFriend.addEventListener('click', () => {
//         //                         const infoRead = {
//         //                             senderid: Number(dataUser.userID),
//         //                             receiverid: elm.senderid
//         //                         }
//         //                         socket.emit('mark_as_read', infoRead, (err, data) => {
//         //                             noteMessDiv.remove()
//         //                         })
//         //                     })

//         //                 }
//         //             })
//         //         })
//         //         localStorage.setItem('arrayCurrentLastIdAndFriendId', JSON.stringify([data.data.id, Number(data.data.receiverid)]))
//         //     }

//         //     //typing
//         //     const cardBody = $(`#card-body-${data.data.senderid}`)
//         //     const chatBubble = cardBody.find('.chat-bubble')
//         //     if (data.key === "chat_typing") {
//         //         // ẩn tất cả các phần tử <p> có trong card-body
//         //         cardBody.find('p').hide()
//         //         chatBubble.show()
//         //     } else {
//         //         cardBody.find('p').show()
//         //         chatBubble.hide()
//         //     }
//         // })
//         activeCardFriends.push(cardFriend)
//     })
// }
// getListFriends(token, dataUser, urlFullInfo, handleRenderCardFriend)

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
$(document).on('click', '#open-image-upload', function () {
    const fileUploader = document.getElementById('file-uploader')
    if (fileUploader) {
        fileUploader.click()

        fileUploader.addEventListener('change', function handleFileChange() {
            console.log(fileUploader.files[0])
            const file = fileUploader.files[0]
            uploadFile(file, currentFriend)

            fileUploader.removeEventListener('change', handleFileChange)
        })
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
                if (data[0].senderid === Number(dataUser.userID)) {
                    $(`#card-text-${friend.id}`).text('you: ' + data[0].message)
                } else {
                    $(`#card-text-${friend.id}`).text(friend.f_name + ': ' + data[0].message)
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
        <img class="modal-content" id="img01">
    `
    document.body.appendChild(modal)
    $(document).on('click', img, () => {
        openModal(url)
    })
    $(document).on('click', '#close-image', () => {
        closeModal()
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
const addMessPrivate = (data, newChatDiv, friend, isCurrentUser, isPrivateScrolling, isUploadWaitImage, isUploaded) => {
    $(document).ready(function () {
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
            const pathImage = data
            const urlImage = baseUrl + pathImage
            const img = '.image-fullsize'
            // console.log(urlImage)

            messageDiv.addClass("d-flex flex-row justify-content-start wrap-user container-image")
            messageTextDiv.html(`<div class="wrap-image-wait">
                <i class="fa-solid fa-trash fa-xs btn-del-image"></i>
                <img src="${urlImage}" class="image-fullsize image-wait text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                ${isCurrentUser ? 'text-white rounded-3' : 'bg-light rounded-3'}">
                </img>
            </div>`)
            // modal show fullsize image
            createModal(img, urlImage)
        }

        if (isUploaded) {
            const pathImage = data.replace('public/', '')
            const urlImage = baseUrl + pathImage
            const img = '.image-fullsize'
            // console.log(urlImage);

            messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
            messageTextDiv.html(`
                <img src=${urlImage} class="image-fullsize image-sended text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                ${isCurrentUser ? 'text-white rounded-3' : 'bg-light rounded-3'}">
                </img>`)

            // modal show fullsize image
            createModal(img, urlImage)
        }

        if (data.type && data.type === 'image') {
            const pathImage = data.message
            const urlImage = baseUrl + pathImage
            const img = `#image-${friend.id}-${data.id}`

            messageDiv.addClass("d-flex flex-row justify-content-" + (isCurrentUser ? "end" : "start") + " wrap-user")
            messageTextDiv.html(`
                <img id="image-${friend.id}-${data.id}" src=${urlImage} class="image-sended text-start small p-2 ${isCurrentUser ? null : 'ms-2'}  
                ${isCurrentUser ? 'text-white rounded-3' : 'bg-light rounded-3'}">
                </img>`)

            // modal show fullsize image
            createModal(img, urlImage)
        }

        var avatarImg = $("<img>").attr("src", randomAvatarURL).addClass("avatar-chat")

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
            allowHTML: false,
            // trigger: 'click'
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
    socket.emit('load_company_chat', { start: ++id, numView: 20, cID: dataUser.cid }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            if (res) {
                const arrReverse = res.reverse()
                const newMessages = arrReverse.filter(message => !loadedMessageIDs.includes(message.id))

                newMessages.forEach(message => {
                    console.log(message);
                    loadedMessageIDs.push(message.id)
                    var isCurrentUser = message.userID === Number(dataUser.userID)

                    if (isScrolling) {
                        // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                        addMessageToChat(message.message, isCurrentUser, true, message)
                    } else {
                        // Nếu không cuộn, thêm tin nhắn vào dưới cùng
                        addMessageToChat(message.message, isCurrentUser, false, message)
                    }
                })
            }
        }
    })
}

//add mess UI
function addMessageToChat(message, isCurrentUser, isScrolling, messageData) {
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
    const avatarImg = document.createElement('img')
    avatarImg.src = randomAvatarURL
    avatarImg.alt = 'avatar'
    avatarImg.classList.add('avatar-chat')

    // create text content
    const messageTextDiv = document.createElement('div')
    messageTextDiv.innerHTML = '<p class=" small p-2 ' + (isCurrentUser ? null : 'ms-2') +
        ' mb-1 ' + (isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3') + '">' + message + '</p>'

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
        const message = {
            "userID": Number(dataUser.userID),
            "cID": dataUser.cid,
            "message": messageContent,
            "type": "text",
            // "displayName": userInfo.profile.name_first,
            "userName": userInfo.profile.name_first
        }
        socket.emit("push2talk_send_msg", JSON.stringify(message), (err, res) => {
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