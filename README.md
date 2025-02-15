# Game show
Java, HTML, CSS based game show. 

## Add questions
Update the 'questions.json' file.

### Themes that can be used
* bubblegum-theme (purple/pink)
* sports-theme (green/blue)
* movie-theme (orage/red)
* music-theme (purple/red)

# Getting started with node.js
## First time using node.js
Initialize a node.js project:
$ npm init -y

Install required packages:
$ npm install express socket.io qrcode ip uuid

Generate new certs:
openssl req -nodes -new -x509 -keyout key.pem -out cert.pem

## Start server:
$ node server.js

Open https://localhost:4000 in a browser (for the host).
Players scan the QR code or go to http://localhost:4000/join to enter the game.
