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
    .catch(error => console.error("QR Code Error:", error)
);

// Listen for updated player list from the server
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

    let mediaContainer = document.getElementById("media-container");
    mediaContainer.innerHTML = "";
    mediaContainer.style.display = "block";

    document.getElementById("next-btn").style.display = "none";
    document.getElementById("show-answer-btn").style.display = "none";
    document.getElementById("progress-container").style.display = "block";

    let showAnswerBtn = document.getElementById("show-answer-btn");
    showAnswerBtn.innerHTML = "Show Answer";

    // 🎨 Handle theme change
    if (question.theme) {
        changeTheme(question.theme);
    }

    // 🖼️ Handle Image
    if (question.image) {
        let img = document.createElement("img");
        img.src = question.image;
        img.alt = "Question Image";
        mediaContainer.appendChild(img);
    }

    // 📺 Handle Video
    if (question.video) {
        let iframe = document.createElement("iframe");
        iframe.src = question.video;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        mediaContainer.appendChild(iframe);
    }

    // 🎵 Handle Audio (Multiple Tracks)
    if (question.audio) {
        let audioContainer = document.createElement("div");
        let playingIndex = -1; // Track which song is playing
        let currentPlayingBtn = null;

        question.audio.forEach((audioUrl, index) => {
            let playBtn = document.createElement("button");
            playBtn.innerText = `▶ Play Track ${index + 1}`;
            
            playBtn.onclick = () => {
                if (playingIndex === index) {
                    // Stop current track
                    playingIndex = -1;
                    playBtn.innerText = `▶ Play Track ${index + 1}`;
                    stopSong();
                    currentPlayingBtn = null;
                } else {
                    // Stop any currently playing track first
                    if (currentPlayingBtn) {
                        currentPlayingBtn.innerText = `▶ Play Track ${playingIndex + 1}`;
                    }

                    // Start new track
                    playingIndex = index;
                    playBtn.innerText = `⏹ Stop`;
                    playSong(audioUrl);
                    currentPlayingBtn = playBtn;
                }
            };
            audioContainer.appendChild(playBtn);
        });


        mediaContainer.appendChild(audioContainer);
    }

    // ⏳ Timer Logic
    let timeLeft = question.timer;
    let timerEnabled = timeLeft > 0;
    socket.emit("startQuestion", question);

    if (timerEnabled) {
        startProgressBar(timeLeft);
        setTimeout(() => {
            document.getElementById("progress-container").style.display = "none";
            document.getElementById("show-answer-btn").style.display = "inline-block";
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "inline-block";
    }

    document.getElementById("question-container").style.display = "flex";
}

function showAnswer() {
    let question = questions[currentIndex];
    let showAnswerBtn = document.getElementById("show-answer-btn");

    if (showAnswerBtn.innerHTML === "Show Answer") {
        if (question.audio) {
            stopSong(); // If song -> Stop it before showing answer
        }
        document.getElementById("next-btn").style.display = "inline-block";
    }

    let answerContainer = document.getElementById("question-answer");
    
    // Clear previous answer
    answerContainer.innerHTML = ""; 

    // 🎵 If the answer is an object (Artist + Title), format it
    if (typeof question.answer === "object") {
        let answerText = "";
        for (let key in question.answer) {
            answerText += `<strong>${key}:</strong> ${question.answer[key]}<br>`;
        }
        answerContainer.innerHTML = answerText;
    } 
    // 📋 If it's a normal text answer, display as is
    else if (typeof question.answer === "string") {
        answerContainer.textContent = question.answer;
    }

    // 🔄 Send answer to server
    socket.emit("sendAnswerToServer", question);
}

function showGameOverScreen() {
    // Hide the question and answer containers
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    
    // Show the game-over container
    document.getElementById("game-over-container").style.display = "flex";
    
    socket.emit("gameOver", topPlayers);
}

function isCloseMatch(input, correct) {
    let distance = levenshteinDistance(input, correct);
    let threshold = Math.ceil(correct.length * 0.3); // Allow 30% of the length as errors
    return distance <= threshold;
}

// Levenshtein Distance Algorithm
function levenshteinDistance(a, b) {
    let tmp;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    if (a.length > b.length) {
        tmp = a;
        a = b;
        b = tmp;
    }

    let row = Array(a.length + 1).fill(0).map((_, i) => i);
    
    for (let i = 1; i <= b.length; i++) {
        let prev = i;
        for (let j = 1; j <= a.length; j++) {
            let val = b[i - 1] === a[j - 1] ? row[j - 1] : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
            row[j - 1] = prev;
            prev = val;
        }
        row[a.length] = prev;
    }
    return row[a.length];
}

// Helper function to check if the player's answer matches the correct answer
function checkAnswer(playerAnswer, correctAnswer) {
    let score = 0;

    // If correctAnswer is an object (e.g., multiple fields)
    if (typeof correctAnswer === 'object' && !Array.isArray(correctAnswer)) {
        let correctValues = Object.values(correctAnswer); // Keep original case for `isCloseMatch`
        let playerValues = Object.values(playerAnswer); 

        // Check if each player's answer exists in the correct answer set (ignoring order)
        playerValues.forEach(playerVal => {
            let matchIndex = correctValues.findIndex(correctVal => isCloseMatch(playerVal, correctVal));
            if (matchIndex !== -1) {
                score++;
                correctValues.splice(matchIndex, 1); // Remove matched value to prevent duplicate scoring
            }
        });
    } else {
        // If correctAnswer is a single string
        if (isCloseMatch(playerAnswer, correctAnswer)) {
            score = 1;
        }
    }

    return score;
}



// Event listener to handle the display of answers and updating the score
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
        let answerText = "";
        if (typeof answer === 'object') {
            Object.entries(answer).forEach(([key, value]) => {
                answerText += `<strong>${key}:</strong> ${value}<br>`;
            });
        }
        else {
            answerText = answer;
        }
        answerBox.innerHTML = `<strong>${name}:</strong> ${answerText}`;

        // Check if the player's answer is correct
        let answerScore = checkAnswer(answer, currentAnswer);

        // Update the player's score based on correctness
        if (answerScore > 0) {
            socket.emit("updateScore", { id, score: score + answerScore }); // Award points for the answer
            answerBox.classList.add("clicked");
            answerBox.style.background = "rgba(76, 175, 80, 0.8)"; // Make it green if correct
        }

        // Add a click event to toggle points (in case you want to allow re-clicking)
        answerBox.addEventListener("click", () => {
            if (answerBox.classList.contains("clicked")) {
                // If clicked, remove the 'clicked' class, deduct points, and reset background color
                socket.emit("updateScore", { id, score: score });
                answerBox.classList.remove("clicked");
                answerBox.style.background = ""; // Reset background color
            } else {
                // If not clicked, add points and change background color to green
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
