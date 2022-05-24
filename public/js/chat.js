const socket = io()

const $messageForm = document.querySelector(`#message-form`)
const $messageFormInput = $messageForm.querySelector(`input`)
const $messageFormButton = $messageForm.querySelector(`button`)
const $sendLocationButton = document.querySelector(`#send-location`)
const $messages = document.querySelector(`#messages`)


//Templates
const messageTemplate = document.querySelector(`#message-template`).innerHTML
const locationMessageTemplate = document.querySelector(`#location-message-template`).innerHTML
const sidebarTemplate = document.querySelector(`#sidebar-template`).innerHTML
// socket.on(`countUpdated`,(count)=>{
//     console.log(`The count has been updated!`,count)
// })

// document.querySelector(`#increment`).addEventListener(`click`,()=>{
//     console.log(`Clicked`)
//     socket.emit(`increment`)
// })

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    //New Message element
    const $newMessage = $messages.lastElementChild

    //Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //VisibleHeight
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}



socket.on(`message`, (msg) => {
    console.log(msg)
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        msg: msg.text,
        createdAt: moment(msg.createdAt).format(`h:mm a`)
    })
    $messages.insertAdjacentHTML(`beforeend`, html)
    autoscroll()
})

socket.on(`locationMessage`, (msg) => {
    console.log(msg)
    const html = Mustache.render(locationMessageTemplate, {
        username: msg.username,
        url: msg.url,
        createdAt: moment(msg.createdAt).format(`h:mm a`)
    })
    $messages.insertAdjacentHTML(`beforeend`, html)
    autoscroll()
})

socket.on(`roomData`, ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector(`#sidebar`).innerHTML = html

})
// document.querySelector('#message-form').addEventListener('submit', (e) => {
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disabled
    $messageFormButton.setAttribute(`disabled`, `disabled`)
    const message = e.target.elements.message.value
    // const message = document.querySelector('input').value
    socket.emit('sendMessage', message, (error) => {
        //enable
        $messageFormButton.removeAttribute(`disabled`)
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log(`The message was delivered`)
    })
})

$sendLocationButton.addEventListener(`click`, () => {
    if (!navigator.geolocation) {
        return alert(`GeoLocation is not supported by your browser`)
    }

    $sendLocationButton.setAttribute(`disabled`, `disabled`)
    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)
        socket.emit(`sendLocation`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            $sendLocationButton.removeAttribute(`disabled`)
            console.log(`Location Shared!`)
        })
    })
})

socket.emit(`join`, { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = `/`
    }
})