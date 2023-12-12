function getListFriends(token, dataUser, baseUrl, callback) {
    const bodyLeft = document.querySelector('#body-left')

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
            const listFriends = [...response.data.members]
            localStorage.setItem('dataFriends', JSON.stringify(listFriends))
            const usedIndexes = []
            listFriends.map((friend) => {
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

                $(document).on("click", `#friend-${friend.id}`, function () {
                    alert("I've been clicked")
                })
            })
            callback(listFriends)
        })
        .catch(error => {
            console.log(error)
        })
}

export default getListFriends