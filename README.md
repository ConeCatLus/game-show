# Game show
Java, HTML, CSS based game show. 

# Getting started!
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
Mac/Windows/Linux - install mkcert to generate secure certs
```sh
$ mkcert -key-file certs/key.pem -cert-file certs/cert.pem 192.168.1.209 localhost
```

## Spotify API
1. In [soptifyAuth.js](public/scripts/soptifyAuth.js) change IP and PORT to match the host.
2. Go to: https://developer.spotify.com/dashboard/ sign in and "Create app". 
3. Copy "Client ID" from Spotify dashboard to [soptifyAuth.js](public/scripts/soptifyAuth.js)
4. Add "Redirect URIs" same style as redirectUri in [soptifyAuth.js](public/scripts/soptifyAuth.js) but with the actual IP and PORT.
5. Select "APIs used" to be "Web Playback SDK".

## Add questions
Update the [questions.json](public/questions.json) file.

### Supported questions
* Multiple questions with multiple answers
* Add images
* Add Spotify links for music quiz
* Youtube clips
* Timer based questions

### Themes that can be used
| Theme Name        | Colors        |
|-------------------|--------------|
| bubblegum-theme  | Purple/Pink  |
| sports-theme     | Green/Blue   |
| movie-theme      | Orange/Red   |
| music-theme      | Purple/Red   |

### JSON Example
```json
[
  {
    "question": "Name the artist and song title.",
    "question-info": "Required - The prompt for the question to be asked.",
    "answer": {
      "Artist": "Queen",
      "Title": "Bohemian Rhapsody"
    },
    "answer-info": "Required - An answer object. Each key represents an input field placeholder.",
    "image": "../images/inception.avif",
    "image-info": "Optional - Displays an image.",
    "audio": [
      "https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb?si=b829b7cc4c5b4f41"
    ],
    "audio-info": "Optional - An array of Spotify links. Each entry generates its own play button.",
    "timer": 0,
    "timer-info": "Optional - Set to 0 for no timer, or a positive number for a countdown in seconds.",
    "theme": "music-theme",
    "theme-info": "Optional - Sets a theme for the question. Available themes: 'bubblegum-theme' (purple/pink), 'sports-theme' (green/blue), 'movie-theme' (orange/red), 'music-theme' (purple/red)."
  }
]
```

## Start server:
```sh
$ node server.js
```

Open the webb adress displayed in the terminal and start your quiz! in a browser (for the host).
Players scan the QR code to join.
