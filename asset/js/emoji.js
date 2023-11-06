// /emoji
const wrapEmoji = document.getElementById('wrap-emoji')
const iconEmoji = document.getElementsByClassName('icon-emoji')
const emoji = document.getElementById('emoji')
const messageInput = document.getElementById('message-input')

let isEmoji = false

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