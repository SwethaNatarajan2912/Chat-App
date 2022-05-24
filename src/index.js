const path = require(`path`)
const express = require(`express`)
const app = express()
const socketio = require(`socket.io`)
const Filter = require(`bad-words`)
const { generateMessage, generateLocationMessage } = require(`./utils/messages`)
const { addUser, removeUser, getUser, getUsersInRoom } = require(`./utils/users.js`)

const http = require(`http`)
//create httpServer and add the express app into there
const server = http.createServer(app)
//
const io = socketio(server)
// let count = 0
let msg = "Welcome"
//server(send) ->client(received) countUpdated
//client(send) ->server(received) increment 
io.on(`connection`, (socket) => {
    console.log(`New WebSocket connection`)
    // socket.emit(`countUpdated`,count)
    // socket.on(`increment`,()=>{
    //     count++
    //     //socket.emit(`countUpdated`,count)
    //     io.emit(`countUpdated`,count)

    socket.on(`join`, (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }


        socket.join(user.room)
        socket.emit('message', generateMessage(`Admin`, `Welcome!`))
        socket.broadcast.to(user.room).emit('message', generateMessage(`Admin`, `${user.username} has joined`))
        io.to(user.room).emit(`roomData`, {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on(`sendMessage`, (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback(`Profanity is not allowed!`)
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on(`sendLocation`, (coords, callback) => {
        const user = getUser(socket.id)
        // io.emit('message', `Location:${coords.latitude},${coords.longitude}`)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit(`message`, generateMessage(`Admin`, `${user.username} has left`))
            io.to(user.room).emit(`roomData`, {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })
})
// app.use(express.json())
const publicDirectoryPath = path.join(__dirname, `../public`)
app.use(express.static(publicDirectoryPath))
// app.get(`/`,(req,res)=>{
//     res.render(`index`)
// })
const port = process.env.PORT || 8082

server.listen(port, (req, res) => {
    console.log(`Server is running...`)
})