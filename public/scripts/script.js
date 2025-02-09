const socket = io();

let questions = [];
let currentIndex = 0;

// Send to server that host has restarted so clients also restart
console.log("Host Started");
socket.emit("hostStarted");

// Fetch and display QR Code & Game Code
fetch("/qr")
    .then(res => res.json())
    .then(data => {
        document.getElementById("qr-code").src = data.qr;
    })
    .catch(error => console.error("QR Code Error:", error));

socket.on("gameCode", (code) => {
    document.getElementById("game-code").innerText = code;
});

// Listen for updated player list from the server
socket.on("updatePlayers", (updatedPlayers) => {
    updatedPlayers;
    updatePlayerList(updatedPlayers);
});

function updatePlayerList(players) {
    let playerList = document.getElementById("player-list");
    playerList.innerHTML = ""; // Clear list before updating

    players.forEach(player => {
        let li = document.createElement("li");

        let playerText = document.createElement("span");
        playerText.textContent = `${player.name}: ${player.score}`;

        let minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.classList.add("minus");
        minusBtn.addEventListener("click", () => {
            if (player.score > 0) {
                player.score--;
                socket.emit("updateScore", { id: player.id, score: player.score });
            }
        });

        let plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.classList.add("plus");
        plusBtn.addEventListener("click", () => {
            player.score++;
            socket.emit("updateScore", { id: player.id, score: player.score });
        });

        li.appendChild(minusBtn);
        li.appendChild(playerText);
        li.appendChild(plusBtn);
        playerList.appendChild(li);
    });
}

// Load questions from JSON
document.addEventListener("DOMContentLoaded", () => {
    loadQuestions();
});

function loadQuestions() {
    fetch("questions.json")
        .then(response => response.json())
        .then(data => {
            questions = data;
        })
        .catch(error => console.error("Error loading questions:", error));
}

function startGame() {
    // socket.emit("startGame");
    document.getElementById("start-btn").style.display = "none";
    document.getElementById("question-container").style.display = "flex";
    document.getElementById("setup-container").style.display = "none";
    nextQuestion();
}

socket.on("gameStarted", () => {
    console.log("Game is starting!");
});

function startProgressBar(duration) {
    let progressBar = document.getElementById("progress-bar");
    progressBar.style.transition = "none";
    progressBar.style.width = "100%";
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}s linear`;
        progressBar.style.width = "0%";
    }, 100);
}

function nextQuestion() {
    if (currentIndex >= questions.length) {
        document.getElementById("question-text").innerText = "Game Over!";
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "none";
        document.getElementById("next-btn").style.display = "none";
        document.getElementById("media-container").style.display = "none";
        return;
    }

    let question = questions[currentIndex];
    document.getElementById("question-text").innerText = question.question;
    
    document.getElementById("media-container").innerHTML = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("show-answer-btn").style.display = "none";
    document.getElementById("media-container").style.display = "block";

    let showAnswerBtn = document.getElementById("show-answer-btn");
    showAnswerBtn.innerHTML = "Show Answer";

    document.getElementById("progress-container").style.display = "block";

    if (question.image) {
        let img = document.createElement("img");
        img.src = question.image;
        img.alt = "Question Image";
        document.getElementById("media-container").appendChild(img);
    }

    if (question.video) {
        let iframe = document.createElement("iframe");
        iframe.src = question.video;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        document.getElementById("media-container").appendChild(iframe);
    }

    socket.emit("startQuestion", question);
    let timer;
    let timeLeft = question.timer;
    let timerEnabled = timeLeft > 0;

    if (timerEnabled) {
        startProgressBar(timeLeft);
        timer = setTimeout(() => {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("show-answer-btn").style.display = "block";
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "block";
    }
}

function showAnswer() {
    let question = questions[currentIndex];
    let showAnswerBtn = document.getElementById("show-answer-btn");

    if (showAnswerBtn.innerHTML === "Show Answer") {
        showAnswerBtn.innerHTML = question.answer;
        showAnswerBtn.style.background = "#ff4da6";
        document.getElementById("next-btn").style.display = "block";
    }

    socket.emit("sendAnswerToServer", question.answer);
}

function moveToNextQuestion() {
    currentIndex++;
    nextQuestion();
    socket.emit("nextQuestion");
}

socket.on("sendClientAnswerToHost", (player, answer) => {
    console.info(player.name + " Answered: " + answer);
});