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
$ mkcert -key-file certs/key.pem -cert-file certs/cert.pem F.209 <ip-address>
```

## Setup - Spotify API and Server details
1. Go to: https://developer.spotify.com/dashboard/ sign in and click "Create app".
2. Navigate to settings -> Basic information
3. Add "https://ip-address:port/" under "Redirect URIs"
5. Select "APIs used" to be "Web Playback SDK"
6. Copy "Client ID" from Spotify dashboard
7. In an editor open [config.js](config.js)
8. Add your port and IP and PORT then add the CLIENT_ID (from spotify dashboard)

## Add questions
Add a .json file here [questions](public/quizes/)

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
| sport-theme     | Green/Blue   |
| movie-theme      | Orange/Red   |
| music-theme      | Purple/Red   |

### JSON Example
You can have several 'optional' question items like image + audio + timer it's not limited

```json
{
  "quizName": "Give your quiz a name",
  "quizName-info": "Add a name to be shown in the dropdown list",
  "quizTheme": "bubblegum-theme",
  "quizeTheme-info": "Add a quiz theme to be shown in the start screen",
  [
    {
      "question": "Name the artist and song title.",
      "question-info": "Required - The prompt for the question to be asked.",
      "answer": {
        "Artist": "Queen",
        "Title": "Bohemian Rhapsody"
      },
      "answer-info": "Required - An answer object. Each key represents an input field placeholder.",
      "answerImage": "../images/answerImg.png",
      "answerImage-info": "Add an image to be shown with the answer",
      "image": "../images/inception.avif",
      "image-info": "Optional - Displays an image.",
      "audio": [
        "https://open.spotify.com/track/3z8h0TU7ReDPLIbEnYhWZb?si=b829b7cc4c5b4f41"
      ],
      "audio-info": "Optional - An array of Spotify links. Each entry generates its own play button.",
      "timer": 0,
      "timer-info": "Optional - Set to 0 for no timer, or a positive number for a countdown in seconds.",
      "theme": "music-theme",
      "theme-info": "Optional - Sets a theme for the question. Available themes: 'bubblegum-theme' (purple/pink), 'sport-theme' (green/blue), 'movie-theme' (orange/red), 'music-theme' (purple/red)."
    }
  ]
}
```

## Start server:
To show the server network name and password, add two string inputs when starting the server.
```sh
$ node server.js "network-name" "password"
```

Open the web address displayed in the terminal and start your quiz!
Players scan the QR code to join.
