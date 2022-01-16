const http = require('http');
const express = require('express')
const app = express();
const socketIo = require('socket.io');
const fs = require('fs')
var $ = jQuery = require('jquery');
require('jquery-csv');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session'); 
const e = require('express');
// const { info } = require('console');

app.engine('html', ejs.renderFile);

app.use(express.static('/index'));
app.use(express.static('/test'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

var PORT = 8080;
const server = http.Server(app).listen(PORT, function(){
    console.log('Server running...');
});

var urlencodedparser = bodyParser.urlencoded({extended:false});
io = socketIo(server, {cors: {origin: "*"}});

app.get('/', function(req, res){
    res.sendFile(__dirname + '/home.html')
});

var gameData = {};
var info;
app.get('/start', function(req, res){
    
        // console.log(data.leader);

    var file = './data.csv';

    res.render(__dirname + '/index.html')

    fs.readFile(file, 'UTF-8', function(err, csv) {
        var datas = $.csv.toArrays(csv);
        var rand = Math.floor(Math.random() * 4600);
        info = datas[rand][1]
        
        gameData = {
            price: info,
            list: datas[rand],
            labels: datas[0],
            playerCount: num,
            players: roomPlayers
        }
    });
});


var rooms = {}
var id;
var data = {};
var data2 = {};
var num;
var leader;
var roomPlayers;
var yourRoom;
var ids = new Set();
var sent = false;
var count = 0;
var nodes;
var playerScores = {};

io.sockets.on('connection', function(socket){

    console.log('Connection Established: ' + socket.id);

    socket.on('create', function(room){
        // console.log(room);

        socket.join(room);
        yourRoom = room;
        socket.leave(socket.id);
        socket.room = room;

        id = socket.id;
        num = io.sockets.adapter.rooms.get(room).size;
        roomPlayers = Array.from(io.sockets.adapter.rooms.get(room));
    });

    socket.on('roles', function(room){
        if (io.sockets.adapter.rooms.get(room).size <= 1){
            socket.leader = true;
        } else {
            socket.leader = false;
        }

        leader = socket.leader;
    });

    socket.on('disconnect', function(){
        console.log('disconnection sadness');
        // console.log(rooms[socket.room]);
    }); 

    socket.on('initiate', function(message){
        socket.emit('test', data);
        socket.to(data.room).emit('update', num);
        socket.emit('update', num);
    });

    socket.on('startGame', function(){
        socket.to(data.room).emit('start');
        // socket.emit('start');
    });

    socket.on('receive', function(dataSend){
        data.id = dataSend.id;
        data.room = dataSend.room;
        data.leader = socket.id;

        // console.log(data.id + " " + 'yola');

        ids.add(socket.id);
        
        nodes = Array.from(ids);

        console.log(nodes);

        // data2 = {
        //     id : dataSend.id,
        //     room : dataSend.room,
        //     leader : false
        // }

        
    });

    socket.on('initiate2', function(){
        
        socket.emit('update2', data, ids);

        // socket.to(data.room).emit('dataRec', gameData);
        socket.emit('dataRec', gameData);

        if (!sent){
            io.to(socket.id).emit('sent', nodes[nodes.length - 1]);
            sent = true;
        } else {
            io.to(socket.id).emit('sent', nodes[count]);
            count++;
        }
    });

    socket.on('guess', function(guess){
        var diff = Math.abs(guess - info);
        var diffPercent = Math.round((diff/info)*100);

        var score = 100 - diffPercent;

        // console.log(socket.id);

        if (playerScores[socket.id] == undefined){
            playerScores[socket.id] = 0; 
        }
        
        playerScores[socket.id] += score;

        if (socket.id == nodes[0]){
            io.emit('score', playerScores);
            console.log(playerScores);

            // for (var i = 0; i < nodes.length; i++){
            //     console.log(nodes[i]);
            //     io.to(nodes[i]).emit('score', playerScores);
            // }
        }
    });

    socket.on('check', function(checkId){
        socket.id = checkId;
        // console.log(checkId + " " + socket.id);

    });

    
});

app.post('/redirect', urlencodedparser, function(req, res){
    req.session.room = req.body.name;
    req.session.id = id;
    req.session.leader = leader;
    data = {room: req.session.room,
            id: req.session.id,
            leader: req.session.leader
        }
    res.render(__dirname + '/waiting.html', {roomName: data.room});
});
