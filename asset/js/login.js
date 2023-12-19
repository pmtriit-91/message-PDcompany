const form = document.getElementById("loginForm")
const emailInput = document.getElementById("exampleInputEmail")
const passwordInput = document.getElementById("exampleInputPassword")
const baseUrl = 'https://www.surecommand.com/mobileapp/android.php'

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem('token')

    if (token) {
        window.location = '/'
    }
})

form.addEventListener("submit", function (event) {
    event.preventDefault()

    // get values
    const emailValue = emailInput.value
    const passwordValue = passwordInput.value

    axios.post(baseUrl, {
        "head": {
            "code": 1, // Code 1: login
            "version": 2
        },
        "body": {
            "email": emailValue,
            "pass": passwordValue
        }
    }, {
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    })
        .then(response => {
            console.log(response)
            if (response.data.code === 1) {
                localStorage.setItem('token', JSON.stringify(response.data.chatToken))
                localStorage.setItem('dataUser', JSON.stringify(response.data.userInfo))
                window.location = '/'
            } else if (response.data.code === 0) {
                console.error('login failed :', response.data.msg)
            }

        })
        .catch(error => {
            console.error("Đăng nhập thất bại")
            console.error(error)
        })
})


// token = response.data.chatToken
// const cid = response.data.userInfo.cid
// console.log(cid);
// const userId = response.data.userInfo.userID
// console.log(token);

// axios.post(baseUrl, {
//     "head": {
//         "code": 126,
//         "token": token,
//         "version": 2,
//         "cID": Number(cid),
//         "tokenFcm": '',
//         "userID": Number(userId)
//     },
//     "body": {
//     }
// }, {
//     headers: {
//         "Content-Type": "application/json",
//     },
//     withCredentials: true,
// })
//     .then(response => {
//         console.log(response)

//         // window.location = '/'
//     })
//     .catch(error => {
//         console.error(error)
//     })
