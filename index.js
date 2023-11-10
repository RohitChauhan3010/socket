const express = require("express");
const cors = require("cors")
require("dotenv").config()
const socketio = require("socket.io");
const http = require("http");
const { userJoin, getRoomUsers, getCurrentUser, userLeave } = require("./utils/users");
const formateMessage = require("./utils/messages");

const app = express();
app.use(express.json());
app.use(cors());

const server = http.createServer(app);
const io = socketio(server);

io.on("connection", (socket) => {
    console.log("One user has joined");

    socket.on("joinRoom", ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Welcome message
        socket.emit("message", formateMessage("Web Socket", "Welcome to Web Socket"));

        // Broadcasting to other users
        socket.broadcast.to(user.room).emit("message", formateMessage("Web Socket", `${username} has joined the chat`));

        // Getting room users
        io.to(room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    socket.on("chatMessage", (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit("message", formateMessage(user.username, msg));
    });

    //   socket.on("disconnect", () => {
    //     const user = userLeave(socket.id);
    //     console.log("One user has left");

    //     io.to(user.room).emit("message", formateMessage("Web Socket", `${user.username} has left the chat`));

    //     // Getting room users
    //     io.to(user.room).emit("roomUsers", {
    //       room: user.room,
    //       users: getRoomUsers(user.room)
    //     });
    //   });
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            console.log("One user has left");

            io.to(user.room).emit("message", formateMessage("Web Socket", `${user.username} has left the chat`));

            // Getting room users
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });


});


server.listen(process.env.port, async () => {
    console.log(`Server is running on port ${process.env.port}`);
});