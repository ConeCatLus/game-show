const socket = io();

let questions = [];
let topPlayers = [];
let currentIndex = 0;
let currentTheme = null;

// Send to server that host has restarted so clients also restart
console.log("Host Started");
socket.emit("hostStarted");
changeTheme();

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
    updatePlayerList(updatedPlayers);
});

socket.on("updatePlayers", (updatedPlayers) => {
    updatePlayerList(updatedPlayers);
});

function changeTheme(theme = null) {
    if (theme) {
        document.getElementById("theme").value = theme;
        currentTheme = theme;
    }
    else {
        currentTheme = document.getElementById("theme").value;
    }
    document.body.className = currentTheme;
    socket.emit("changeTheme", currentTheme);
}

function updatePlayerList(players) {
    players.sort((a, b) => {
        if (b.score === a.score) {
            return a.name.localeCompare(b.name);
        }
        return b.score - a.score;
    });

    // Code to update the player list in the UI
    const playerListElement = document.getElementById("player-list");
    playerListElement.innerHTML = ""; // Clear the existing list

    const highestScore = players[0]?.score || 0;

    players.forEach((player) => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.name}: ${player.score}pts`;
        if (player.score === highestScore && player.score > 0) {
            playerItem.textContent = `👑 ${playerItem.textContent}`; // Add crown emoji to players with the highest score
        }
        playerListElement.appendChild(playerItem);
    });

    // Update the top players list in the game-over-container
    updateTopPlayersList(players);
}

function getTopPlayers() {
    const playerListElement = document.getElementById("player-list");
    const playerItems = Array.from(playerListElement.getElementsByTagName("li"));

    // Extract player data from the list items
    const players = playerItems.map(item => {
        const [name, score] = item.textContent.split(": ");
        return { name, score: parseInt(score) };
    });

    // Sort players by score in descending order
    players.sort((a, b) => b.score - a.score);

    const topPlayers = players.slice(0, 3).map((player, index) => {
        const medals = ["🥇", "🥈", "🥉"];
        const medal = medals[index] || "";
        return { ...player, medal };
    });

    return topPlayers;
}

function updateTopPlayersList() {
    topPlayers = getTopPlayers();
    const topPlayersListElement = document.getElementById("top-players-list");
    topPlayersListElement.innerHTML = ""; // Clear the existing list

    topPlayers.forEach(player => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.medal} ${player.name}: ${player.score} points`;
        topPlayersListElement.appendChild(playerItem);
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
    document.getElementById("setup-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("start-btn").style.display = "none";
    document.getElementById("question-container").style.display = "flex";
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

    document.getElementById("setup-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    
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

    if (question.theme) {
        changeTheme(question.theme); // Emit the theme change event to the server
    }
    document.getElementById("question-container").style.display = "flex";
    
    let timer;
    let timeLeft = question.timer;
    let timerEnabled = timeLeft > 0;

    socket.emit("startQuestion", question);
    
    if (timerEnabled) {
        startProgressBar(timeLeft);
        timer = setTimeout(() => {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("show-answer-btn").style.display = "inline-block";
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "inline-block";
    }
}

function showAnswer() {
    let question = questions[currentIndex];
    let showAnswerBtn = document.getElementById("show-answer-btn");

    if (showAnswerBtn.innerHTML === "Show Answer") {
        document.getElementById("next-btn").style.display = "inline-block";
    }

    document.getElementById("question-answer").textContent = question.answer;

    socket.emit("sendAnswerToServer", question.answer);
}

function showGameOverScreen() {
    // Hide the question and answer containers
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    
    // Show the game-over container
    document.getElementById("game-over-container").style.display = "flex";
    
    socket.emit("gameOver", topPlayers);
}

// Event listener for displaying the answer matrix
socket.on("displayAnswerMatrix", (players) => {
    // Hide other containers and show the answer container
    document.getElementById("setup-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "flex";
    
    const nextBtn = document.getElementById("next-btn");
    if (currentIndex === questions.length - 2) {
        nextBtn.innerText = "Last question";
    }
    if (currentIndex === questions.length - 1) {
        nextBtn.innerText = "Finish the game";
    }

    let answerGrid = document.getElementById("answer-grid");
    answerGrid.innerHTML = ""; // Clear previous answers
    currentAnswer = questions[currentIndex].answer;

    players.forEach(({ id, name, score, answer }) => {
        let answerBox = document.createElement("div");
        answerBox.classList.add("answer-box");
        answerBox.innerHTML = `<strong>${name}:</strong> ${answer}`;
        
        if (answer.toLowerCase() === currentAnswer.toLowerCase()) {
            socket.emit("updateScore", { id, score: score + 1 });
            answerBox.classList.add("clicked");
            answerBox.style.background = "rgba(76, 175, 80, 0.8)"; // Make it green
        } 

        // Add a click event to give points
        answerBox.addEventListener("click", () => {
            if (answerBox.classList.contains("clicked")) {
                // If clicked, remove the 'clicked' class, deduct a point, and reset background color
                socket.emit("updateScore", { id, score: score });
                answerBox.classList.remove("clicked");
                answerBox.style.background = ""; // Reset background color
            } else {
                // If not clicked, add the 'clicked' class, add a point, and change background color to green
                socket.emit("updateScore", { id, score: score + 1 });
                answerBox.classList.add("clicked");
                answerBox.style.background = "rgba(76, 175, 80, 0.8)"; // Make it green
            }
        });

        answerGrid.appendChild(answerBox);
    });
});

// Function to move to the next question
function moveToNextQuestion() {
    currentIndex++;
    if (currentIndex >= questions.length) {
        showGameOverScreen();
    }
    else {
        nextQuestion();
        socket.emit("nextQuestion");
    }
}

// Event listener for receiving client answers
socket.on("sendClientAnswerToHost", (player, answer) => {
    console.info(`${player.name} Answered: ${answer}`);
});