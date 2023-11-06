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
            listFriends.map((friend) => {
                const newCard = document.createElement('div')
                newCard.className = 'card'
                newCard.style.maxWidth = '540px'

                const friendData = friend
                newCard.id = `friend-${friend.id}`

                newCard.innerHTML = `
                    <div class="row row-card-avatar g-0">
                        <div class="col-3 col-md-3 custom-img">
                            <img src="./asset/image/avatar5.jpeg" class="img-fluid avatar-group" alt="...">
                        </div>
                        <div class="col-9 col-md-9 d-flex align-items-center">
                            <div class="card-body">
                                <h5 class="card-title">${friend.f_name}</h5>
                                <p class="card-text"><small class="text-body-secondary">last message</small></p>
                            </div>
                        </div>
                    </div>
                `

                newCard.addEventListener('click', (event) => {
                    callback(friendData)
                })
                bodyLeft.appendChild(newCard)
            })
        })
        .catch(error => {
            console.log(error)
        })
}

export default getListFriends