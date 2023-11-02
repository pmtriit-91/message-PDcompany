const chatWrapper = document.querySelector('.wrapper-chat')
const sendMessageButton = document.getElementById('send-button')
const messageInput = document.getElementById('message-input')

//fake userID
const randomUser = Number(localStorage.getItem('userID') ? localStorage.getItem('userID') : Math.floor(Math.random() * 9000 + 1000))
localStorage.setItem('userID', randomUser)

console.log(randomUser)

//state lastID và trạng thái event scrollTop
let lastMessageId = null
let isScrolling = false

// tin nhắn cuối cùng của 1 user bất kì
let lastSender = null

//upload image
const imageUploadInput = document.getElementById("image-upload")
const openImageUploadButton = document.getElementById("open-image-upload")

//cid
const cID = '3322'

//body script
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

console.log('socket', socket)

socket.on('connect', () => {
    console.log("socket initialized successfully ✅")
})

// check new- mess & render
socket.on('new_mess', (data) => {
    data && getLastMessage()
})

//upload image
// openImageUploadButton.addEventListener("click", () => {
//     imageUploadInput.click()
// })

// imageUploadInput.addEventListener("change", (event) => {
//     const selectedImage = event.target.files[0]
//     console.log(selectedImage)

//     if (selectedImage) {
//         axios.post('http://node.surecommand.com/test_send_image', { selectedImage }, {
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             withCredentials: true,
//         })
//             .then(response => {
//                 console.log(response)
//             })
//             .catch(error => {
//                 console.log(console.error())
//             })
//     }
// })

//get last mess
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
    socket.emit('push2talk_load_msg', { start: ++id, numView: 20 }, (err, res) => {
        if (err) {
            console.log(err)
        } else {
            console.log('history mess: ', res.Messages)
            const newHistoryArr = res.Messages
            console.log('newHistoryArr', newHistoryArr)

            //add history in DOM
            const arrReverse = res.Messages.reverse()

            // const resultFilterDuplicateUserIDmax = []
            // // Dùng một đối tượng để theo dõi id lớn nhất của từng userID
            // const maxIdMap = {}

            // arrReverse.forEach((item) => {
            //     const userID = item.userID
            //     const id = item.id

            //     // Nếu userID chưa được thêm vào maxIdMap hoặc id lớn hơn id hiện tại
            //     if (!maxIdMap[userID] || id > maxIdMap[userID]) {
            //         maxIdMap[userID] = id
            //     }
            // })

            // // Lặp qua mảng và thêm các phần tử có userID trùng và id là lớn nhất vào kết quả
            // arrReverse.forEach((item) => {
            //     const userID = item.userID
            //     const id = item.id

            //     if (id === maxIdMap[userID]) {
            //         resultFilterDuplicateUserIDmax.push(item)
            //     }
            // })

            arrReverse.forEach(message => {
                //check userID === userID thì sử dụng isCurrentUser(true/false) để xác định người dùng
                var isCurrentUser = message.userID === randomUser
                if (isScrolling) {
                    // Nếu đang cuộn lên trên, chèn tin nhắn vào đầu
                    addMessageToChat(message.content, isCurrentUser, true, message)
                } else {
                    // Nếu không cuộn, thêm tin nhắn vào dưới cùng
                    addMessageToChat(message.content, isCurrentUser, false, message)
                }

                // if (message.userID === randomID) {
                //     addMessageToChat(message.content, true, true, message, resultFilterDuplicateUserIDmax)
                // } else {
                //     addMessageToChat(message.content, false, false, message, resultFilterDuplicateUserIDmax)
                // }
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
    avatarImg.src = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp'
    avatarImg.alt = 'Avatar'
    avatarImg.classList.add('avatar-chat')

    //check render avatar
    // if (duplicateUserIDAndIDmax && Array.isArray(duplicateUserIDAndIDmax) && duplicateUserIDAndIDmax.length > 0) {
    //     const duplicate = duplicateUserIDAndIDmax.find((item) => {
    //         return item.userID === messageData.userID && item.id === messageData.id
    //     })

    //     if (duplicate && duplicate.id) {
    //         avatarImg.src = 'https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp'
    //         avatarImg.alt = 'Avatar'
    //         avatarImg.classList.add('avatar-chat')
    //     } else {
    //         avatarImg.style = 'visibility: hidden'
    //     }
    // } else {
    //     avatarImg.style = 'visibility: hidden'
    // }

    // create text content
    const messageTextDiv = document.createElement('div')
    messageTextDiv.innerHTML = '<p id="tooltip-time" class=" small p-2 ' + (isCurrentUser ? null : 'ms-2') + ' mb-1 ' + (isCurrentUser ? 'bg-primary text-white rounded-3' : 'bg-light rounded-3') + '">' + content + '</p>'

    // create text time
    const timestampP = document.createElement('p')
    timestampP.classList.add('d-none', 'small', 'ms-3', 'mb-3', 'rounded-3', 'text-muted')
    const tooltipTime = timestampP.textContent = messageData && messageData.createdAt ?
        `${moment(messageData.createdAt).format('HH:mm')} ${moment(messageData.createdAt).format('MMM DD, YYYY')}` : ''

    //tippy time
    tippy('#tooltip-time', {
        content: tooltipTime,
        theme: 'material',
        animation: 'scale',
        trigger: 'click'
    })
    messageDiv.appendChild(nameUser)

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
            "displayName": 'tri'
        }

        socket.emit("push2talk_send_msg", JSON.stringify(info), (err, res) => {
            res && addMessageToChat(messageContent, true)
        })

        // Reset the input field
        messageInput.value = ''

        // addMessageToChat(messageContent, true)
    }
}

sendMessageButton.addEventListener('click', sendMessage)

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
})