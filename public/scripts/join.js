const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const gameCode = urlParams.get("code");
const GameState = Object.freeze({
    JOIN_SCREEN: "time to join",
    LIMBO_SCREEN: "waiting for host to start",
    QUESTION_SCREEN: "answer question",
    ANSWER_SCREEN: "show answer",
    GAME_OVER: "game over",
    CHANGE_THEME: "change theme"
});

let playerName = "";
let playerAnswer = "";
let gameState;
let progressTimeout;

document.getElementById("game-code").innerText = gameCode;

socket.on("newState", (state, data) => {
    console.log(`State changed to: ${state}`, data);

    switch (state) {
        case GameState.JOIN_SCREEN:
            gameState = state;
            showJoinScreen(); 
            break;

        case GameState.LIMBO_SCREEN:
            if (gameState === GameState.JOIN_SCREEN) {
                gameState = state;
                showLimboScreen(); // Player has joined and is in limbo until game starts
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.LIMBO_SCREEN)
            } 
            break;

        case GameState.QUESTION_SCREEN:
            if (gameState == GameState.LIMBO_SCREEN ||
                gameState == GameState.ANSWER_SCREEN) {
                gameState = state;
                showQuestionScreen(data); // Data might contain the current question
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.QUESTION_SCREEN)
            }
            break;

        case GameState.ANSWER_SCREEN:
            if (gameState == GameState.QUESTION_SCREEN) {
                gameState = state;
                showAnswerScreen(data); // Data might contain the correct answer
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.QUESTION_SCREEN)
            }
            break;

        case GameState.GAME_OVER:
            if (gameState == GameState.QUESTION_SCREEN) {
                gameState = state;
                showGameOverScreen(data); // Data might contain the correct answer
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.QUESTION_SCREEN)
            }
            state = GameState.GAME_OVER;
            break;

        case GameState.CHANGE_THEME:
            document.body.className = data;
            break;

        default:
            console.warn(`Unknown state: ${state}`);
            break;
    }
});

function updateStatus(message) {
    const statusElements = document.querySelectorAll('.status');
    statusElements.forEach(element => {
        element.textContent = message;
    });
}

// Action function for onClick -> Join button
function joinGame() {
    playerName = document.getElementById("player-name").value.trim();
    if (!playerName) {
        updateStatus("Please enter a name.");
        return;
    }
    else {
        socket.emit("joinGame", playerName);
    }   
}
// Set screen -> JOIN_SCREEN
function showJoinScreen() {
    updateStatus("");
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
    document.getElementById("join-container").style.display = "block";
    document.getElementById("player-name").value = "";
}
// Set screen -> LIMBO_SCREEN
function showLimboScreen() {
    updateStatus("Joined game as " + playerName);
    document.getElementById("join-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
    document.getElementById("display-limbo-message").innerText = "Waiting for host to start...";
    document.getElementById("join-screen-name").innerText = "Bubblegum Limbo";
    document.getElementById("limbo-container").style.display = "block";
}
// Start PrograssBar
function startProgressBar(duration) {
    let progressBar = document.getElementById("progress-bar");
    progressBar.style.transition = "none";
    progressBar.style.width = "100%";
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}s linear`;
        progressBar.style.width = "0%";
    }, 100);
}
// Set screen -> QUESTION_SCREEN 
function showQuestionScreen(question) {
    updateStatus("");
    document.getElementById("join-container").style.display = "none";
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
    document.getElementById("question-container").style.display = "block";
    document.getElementById("display-question").innerText = question.question;
    document.getElementById("answer-display-question").innerText = question.question; // For showAnswerScreen
    document.getElementById("client-answer").value = "";
    document.getElementById("join-screen-name").innerText = "Bubblegum Game - Question "; //+ questionNumber;
    playerAnswer = "";

    let timeLeft = question.timer;

    if (timeLeft > 0) {
        document.getElementById("progress-container").style.display = "inline-block";
        startProgressBar(timeLeft);
        clearTimeout(progressTimeout);
        progressTimeout = setTimeout(() => {
            submitAnswer(true);
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none";
    }
}
// Submit answer to server
function submitAnswer(noAnswer = false)
{
    playerAnswer = document.getElementById("client-answer").value.trim();
    if (!playerAnswer && !noAnswer) {
        updateStatus("Please enter an answer");
        return;
    }
    else {
        socket.emit("clientAnswer", playerAnswer);
    }
}
// Set screen -> SHOW_SCREEN 
function showAnswerScreen()
{    
    updateStatus("");
    document.getElementById("join-container").style.display = "none";
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
    document.getElementById("display-your-answer").innerText = "Your answer: " + playerAnswer;
    document.getElementById("display-wait-message").innerText = "Correct answer will show soon!";   
    document.getElementById("display-correct-answer").style.display = "none"; // Hide answer until we get it
    document.getElementById("answer-container").style.display = "flex";
}
// Server broadcast answer to all clients
socket.on("showAnswer", (questionAnswer) => {
    // If a question don't have a timer this will trigger the show answer screen.
    if (gameState === GameState.QUESTION_SCREEN) {
        gameState = GameState.ANSWER_SCREEN; 
        showAnswerScreen();
    }
    if (gameState === GameState.ANSWER_SCREEN) {
        document.getElementById("display-correct-answer").innerText = "Correct answer: " + questionAnswer;
        document.getElementById("display-wait-message").innerText = "The next question will show soon!";  
        document.getElementById("display-correct-answer").style.display = "block";
    }
    else {
        console.info("Illeagal action in state: " + gameState);
    }
});

function updateTopPlayersList(topPlayers) {
    const topPlayersListElement = document.getElementById("top-players-list");
    topPlayersListElement.innerHTML = ""; // Clear the existing list

    topPlayers.forEach(player => {
        const playerItem = document.createElement("li");
        playerItem.textContent = `${player.medal} ${player.name}: ${player.score} points`;
        topPlayersListElement.appendChild(playerItem);
    });
}

function showGameOverScreen(topPlayers) {
    updateStatus("");
    document.getElementById("join-container").style.display = "none";
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "block";

    updateTopPlayersList(topPlayers);
}
