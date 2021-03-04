const express = require("express");
const socket = require("socket.io");
const app = express();

var options = {
    key: fs.readFileSync('certificates/key.pem', 'utf8'),
    cert: fs.readFileSync('certificates/cert.pem', 'utf8'),
    requestCert: false,
    rejectUnauthorized: false
};
var server = app.listen(4000,function() {
    console.log("Server is running");
});

app.use(express.static("public"));


//var io = socket(server);
const io = require('socket.io')(server, {
    //resolve Missing Cors 
    cors: { 
      origin: '*',
    }
  });
io.on("connection",function(socket) {
    console.log("User Connected : " + socket.id);

    socket.on("join",function(roomName) {
        console.log("Room Name : "+roomName);
        var rooms = io.sockets.adapter.rooms;
        var room = rooms.get(roomName);
        if (room == undefined) {
            socket.join(roomName);
            socket.emit("created")
            //console.log("Room Created");
        } else if(room.size==1){
            socket.join(roomName);
            socket.emit("joined");
            //console.log("Room Joined");
        }else{
            socket.emit("full");
            //console.log("Room Full for now");
        }
        console.log(rooms);
    });

    socket.on('ready', function(roomName) {
        console.log("ready");
        socket.broadcast.to(roomName).emit("ready");
    });

    socket.on('candidate', function(candidate,roomName) {
        console.log("candidate");
        console.log(candidate);
        socket.broadcast.to(roomName).emit("candidate",candidate);
    });


    socket.on('offer', function(offer,roomName) {

        console.log("offer");
        console.log(offer);
        socket.broadcast.to(roomName).emit("offer",offer);
    });

    socket.on('answer', function(answer,roomName) {
        console.log("answer");
        socket.broadcast.to(roomName).emit("answer",answer);
    });
});


