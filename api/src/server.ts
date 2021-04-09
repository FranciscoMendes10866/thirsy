import { Server } from 'socket.io'
import { createAdapter } from 'socket.io-redis'
import Redis from 'ioredis'

const io = new Server(5000, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const pubClient = new Redis()
const subClient = pubClient.duplicate()

io.adapter(createAdapter({ pubClient, subClient }))

io.on('connection', (socket) => {
  socket.emit('me', socket.id)

  socket.on('disconnect', () => {
    socket.broadcast.emit('callEnded')
  })

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      name: data.name
    })
  })

  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal)
  })
})
