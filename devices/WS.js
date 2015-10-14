/* Copyright (c) 2015 Sameh Hady. See the file LICENSE for copying permission.

Simple WebSocket protocol wrapper for Espruino sockets.

KEYWORDS: Module,websocket,ws,socket

Websocket implementation on Espruino, it let you control your Espruino from the cloud without the need to know it's IP. You will need to use it with a websocket server.

Limitations: The module only accept messages less than 127 character.

How to use the ws module:

```
  ESP8266WiFi.connect("Sameh Hady", "Password", function(response) {
    console.log("Connected to wifi");
    ESP8266WiFi.init();
    
    var socket = require("ws").connect("Host", Port);

    socket.on('connected', function() {
        console.log("Connected to server");
    });

    socket.on('handshake', function() {
        console.log("Handshake Success");
    });
    
    socket.on('data', function(msg) {
        console.log("MSG: " + msg);
    });

    socket.on('close', function() {
        console.log("Connection closed");
    });
  
    socket.on('pong', function() {
        console.log("Pong received");
    });
});
```
*/

function websocket(host, port) {
    var ws = this;
    var client = "";
    client = require("net").connect({
        host: host,
        port: port
    }, function(socket) {
        ws.emit('connected');
        handshake(socket);
        socket.on('data', function(data) {
            parseData(data, ws);
        });
        socket.on('close', function(data) {
            ws.emit('close');
        });
        ws.socket = socket;
    });
}

var parseData = function(data, ws) {
    if (data.indexOf("HSmrc0sMlYUkAGmm5OPpG2HaGWk=") > -1) {
        ws.emit('handshake');
        var ping = setInterval(function(socket){
          ws.send("ping", 0x89);
        },60000);
    }

    if (data.indexOf(strChr(0x8A)) > -1) {
        ws.emit('pong');
    }

    if (data.indexOf(strChr(0x0a)) > -1) {
        data = data.substring(1);
    }

    if (data.indexOf(strChr(0x81)) > -1) {
        var dataLen = data.charCodeAt(1);
        var opCode = data.charCodeAt(0);
        var pm = "";
            data = data.substring(2);
            for (var index2 = 0; index2 < dataLen; index2++) {
                pm += data[index2];
            }
            ws.emit('data', pm);
    }
};

/** Parse the received data */
websocket.prototype.send = function(msg, opcode) {
    opcode = typeof opcode !== 'undefined' ? opcode : 0x81;
    this.socket.write(strChr(opcode));
    this.socket.write(strChr(msg.length));
    this.socket.write(msg);
};

/** Handshake with the server */
var handshake = function(socket) {
    var socketHeader = [
        "GET / HTTP/1.1",
        "Upgrade: websocket",
        "Connection: Upgrade",
        "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==",
        "Sec-WebSocket-Version: 13",
        "Origin: Espruino",
        ""
    ];

    for (var index = 0; index < socketHeader.length; index++) {
        socket.write(socketHeader[index] + "\r\n");
    }
};

function strChr(chr){
  return String.fromCharCode(chr);
}

exports.connect = function(host, port) {
    return new websocket(host, port);
};
