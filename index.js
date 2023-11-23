let { Server } = require("socket.io");
const io = new Server();


const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

// const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
const REDIS_URL = process.env.REDIS_URL || "redis://eduployment-prod.i5fb0j.ng.0001.mes1.cache.amazonaws.com:6379"
const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();


Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    pubClient.GET('name').then(val=>console.log('pubClient:: ',val))
    subClient.GET('name').then(val=>console.log('subClient:: ',val))
  });

io.adapter(createAdapter(pubClient, subClient));

io.use(function (socket, next) {
    const socketId = socket.handshake.query.user_id;
    console.log('middelware: ', socketId)
    socket.id = socketId
    next()
});

io.on("connection", (socket) => {
    console.log(`A client with socket id ${socket.id} connected!`);

    socket.on("disconnect", () => {
        console.log("Socket disconnected!", socket.id);
    });

    socket.on("server:message", (data) => {
        console.log('Recieve message : ', JSON.stringify(data),  ' ',socket.id)
        let targetClientId = data.toId
        console.log('targetClientId: ',targetClientId)
        console.log('Socket id is not conencted here : ', !!io.sockets.sockets.get(targetClientId))
        // if (!!io.sockets.sockets.get(targetClientId)) {
        // }
        io.to(targetClientId).emit("client:message", "Message is sent by: " + socket.id);
    });
});

io.listen(3000);

console.log('IO connected success')
