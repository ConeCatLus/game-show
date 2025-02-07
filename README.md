# Game show
Java, HTML, CSS based game show. 

## Add questions
Update the 'questions.json' file.

# Getting started with node.js
## First time using node.js
Initialize a node.js project:
$ npm init -y

install required packages:
$ npm install express socket.io qrcode ip uuid

## Start server:
$ node server.js

Open http://localhost:3000 in a browser (for the host).
Players scan the QR code or go to http://localhost:3000/join to enter the game.

socket.emit(event, data) → Send a message.
socket.on(event, callback) → Listen for a message.
io.emit(event, data) → Send to all clients.
socket.broadcast.emit(event, data) → Send to everyone except the sender.

