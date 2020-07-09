'use strict';

const expres = require('express');
const http   = require('http');
const socket = require('socket.io');

const SocketServer = require("./socket"); // this is socket class

class Server {

    constructor() {
        this.port = 5000;
        // this.host = 'lowga-chat.devel';

        this.app = expres();
        this.http = http.createServer(this.app); // NodeJs server
        this.socket = socket(this.http); // Run a socket io module and make listen for socket
    }

    runServer()
    {
        new SocketServer(this.socket).socketConnection(); // SocketServer class

        this.http.listen(this.port , () => {
            console.log(`the server is running on port:${this.port}`);
        });
    }
}

const app = new Server();
app.runServer();
