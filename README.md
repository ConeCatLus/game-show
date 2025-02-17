# Game show
Java, HTML, CSS based game show. 

## Add questions
Update the 'questions.json' file.

### Supported questions
* Multiple questions with multiple answers
* Add images
* Add Spotify links for music quiz
* Youtube clips
* Timer based questions

### Themes that can be used
* bubblegum-theme (purple/pink)
* sports-theme (green/blue)
* movie-theme (orage/red)
* music-theme (purple/red)

# Get started!
## First time using node.js
### Initialize a node.js project:
```sh
$ npm init -y
```
### Install required packages:
```sh
$ npm install express socket.io qrcode ip uuid
```
## Generate certs:
```sh
$ openssl req -nodes -new -x509 -keyout certs/key.pem -out certs/cert.pem
```

## Spotify API
1. In [soptifyAuth.js](public/scripts/soptifyAuth.js) change IP and PORT to match the host.
2. Go to: https://developer.spotify.com/dashboard/ sign in and "Create app". 
3. Copy "Client ID" from Spotify dashboard to [soptifyAuth.js](public/scripts/soptifyAuth.js)
4. Add "Redirect URIs" same style as redirectUri in [soptifyAuth.js](public/scripts/soptifyAuth.js) but with the actual IP and PORT.
5. Select "APIs used" to be "Web Playback SDK".

## Start server:
```sh
$ node server.js
```

Open the webb adress displayed in the terminal and start your quiz! in a browser (for the host).
Players scan the QR code to join.
