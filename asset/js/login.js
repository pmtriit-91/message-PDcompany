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

    if (emailValue === "tdinhphuoc@gmail.com" && passwordValue === "12345678") {
        axios.post(baseUrl, {
            "head": {
                "code": 1, // Code 1: login
                "cID": 3322,
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
                console.log("Đăng nhập thành công")
                console.log(response)
                localStorage.setItem('token', JSON.stringify(response.data.chatToken))
                localStorage.setItem('dataUser', JSON.stringify(response.data.userInfo))

                window.location = '/'
            })
            .catch(error => {
                console.error("Đăng nhập thất bại")
                console.error(error)
            })
    } else {
        alert("Sai email hoặc mật khẩu")
    }
})

