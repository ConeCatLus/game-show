const socket = io();
const urlParams = new URLSearchParams(window.location.search);
const GameState = Object.freeze({
    JOIN_SCREEN: "time to join",
    LIMBO_SCREEN: "waiting for host to start",
    QUESTION_SCREEN: "answer question",
    ANSWER_SCREEN: "show answer",
    GAME_OVER: "game over",
    CHANGE_THEME: "change theme"
});

let playerName = "";
let playerAnswer = {};
let gameState;
let progressTimeout;
let playerId = localStorage.getItem("playerId");

if (!playerId) {
    playerId = crypto.randomUUID(); // Generate a new unique ID
    localStorage.setItem("playerId", playerId);
    console.log("Generated new player ID:", playerId);
    socket.emit("connectedPlayer");
}
else {
    // Send playerId to the server
    console.log("Player reconnected", playerId);
    socket.emit("reconnectPlayer", playerId);
}

socket.on("newState", (state, data, force) => {
    console.log(`State changed to: ${state}`, data);
    if (force) {
        console.log("Force state change on reconnected player");
    }

    switch (state) {
        case GameState.JOIN_SCREEN:
            gameState = state;
            showJoinScreen(); 
            break;

        case GameState.LIMBO_SCREEN:
            if (gameState === GameState.JOIN_SCREEN ||
                force) 
            {
                gameState = state;
                showLimboScreen(); // Player has joined and is in limbo until game starts
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.LIMBO_SCREEN)
            } 
            break;

        case GameState.QUESTION_SCREEN:
            if ((gameState == GameState.LIMBO_SCREEN ||
                gameState == GameState.ANSWER_SCREEN)  ||
                force) 
            {
                gameState = state;
                showQuestionScreen(data); // Data might contain the current question
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.QUESTION_SCREEN)
            }
            break;

        case GameState.ANSWER_SCREEN:
            if (gameState == GameState.QUESTION_SCREEN  ||
                force) 
            {
                gameState = state;
                showAnswerScreen(data); // Data might contain the correct answer
            }
            else {
                console.log("Illegal state transition from " + gameState + " to " + GameState.QUESTION_SCREEN)
            }
            break;

        case GameState.GAME_OVER:
            if (gameState == GameState.ANSWER_SCREEN  ||
                force) 
            {
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
        socket.emit("joinGame", {playerId, playerName});
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
    q = question.question;
    updateStatus("");
    playerAnswer = {};
    document.getElementById("join-container").style.display = "none";
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
    document.getElementById("display-question").innerText = q.question;
    document.getElementById("join-screen-name").innerText = "Bubblegum Game - Question "; //+ questionNumber;
    
    let timeLeft = q.timer;

    // Clear any previous inputs or elements
    let answerContainer = document.getElementById("answers");
    answerContainer.innerHTML = ""; // Clear previous answer inputs

    // 📝 If the answer is an object (multi-part answer), create multiple inputs
    if (typeof q.answer === "object") {
        for (let key in q.answer) {
            let input = document.createElement("input");
            input.type = "text";
            input.placeholder = key;   
            input.classList.add("client-answer-input");
            input.setAttribute("data-key", key);
            answerContainer.appendChild(input);
            answerContainer.appendChild(document.createElement("br"));
        }
    } else {
        // Otherwise, just create a single input
        let input = document.createElement("input");
        input.type = "text";
        input.id = "client-answer";
        input.placeholder = "Enter your answer";
        answerContainer.appendChild(input);
    }

    document.getElementById("question-container").style.display = "block";
    
    // 🕒 Handle timer
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
function submitAnswer(noAnswer = false) {
    // Get the values of all the dynamically created inputs
    const answerInputs = document.querySelectorAll(".client-answer-input");
    if (answerInputs.length > 0) {
        answerInputs.forEach(input => {
            const key = input.getAttribute("data-key");
            const value = input.value.trim();
            if (value) {
                playerAnswer[key] = value;
            }
        });
    } else {
        // If it's just one input (e.g., a single string answer), handle it normally
        playerAnswer = document.getElementById("client-answer").value.trim();
    }

    // Check if the player answered the question
    if (Object.keys(playerAnswer).length === 0 && !noAnswer) {
        updateStatus("Please enter an answer");
        return;
    } else {
        console.log("Player answer:", playerAnswer);
        socket.emit("clientAnswer", {playerId, playerAnswer});
    }
}

// Set screen -> SHOW_SCREEN 
function showAnswerScreen(data) {
    updateStatus("");
    document.getElementById("join-container").style.display = "none";
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";

    document.getElementById("answer-display-question").innerText = data.question.question;

    // Display the player's answer (could be an object with multiple fields)
    let playerAnswerDisplay = "Your answer: ";
    // Virgin is a flag to check if the player have not answerd a question since last connect
    if (data.playerAnswer) {
        playerAnswer = data.playerAnswer;
    }
    if (typeof playerAnswer === "object") {
        playerAnswerDisplay += Object.entries(playerAnswer).map(([key, value]) => `${key}: ${value}`).join(", ");
    } else {
        playerAnswerDisplay += playerAnswer;
    }
    if (data.showAnswer) {
        displayQuestionAnswer(data.question.answer);
    }
    else {
        document.getElementById("display-wait-message").innerText = "Correct answer will show soon!"; 
        document.getElementById("display-correct-answer").style.display = "none"; // Hide answer until we get it
    } 
    document.getElementById("display-your-answer").innerText = playerAnswerDisplay; 
    document.getElementById("answer-container").style.display = "flex";
}

function displayQuestionAnswer(answer) {
    let answerDisplay = "Correct answer: ";
    if (typeof answer === "object") {
        answerDisplay += Object.entries(answer).map(([key, value]) => `${key}: ${value}`).join(", ");
    } else {
        answerDisplay += answer;
    }
    document.getElementById("display-correct-answer").innerText = answerDisplay;
    document.getElementById("display-wait-message").innerText = "The next question will show soon!";  
    document.getElementById("display-correct-answer").style.display = "block";
}

// Server broadcast answer to all clients
socket.on("showAnswer", (question) => {
    // If a question doesn't have a timer this will trigger the show answer screen
    if (gameState === GameState.QUESTION_SCREEN) {
        gameState = GameState.ANSWER_SCREEN; 
        showAnswerScreen({question: question});
    }

    if (gameState === GameState.ANSWER_SCREEN) {
        displayQuestionAnswer(question.answer);
    } else {
        console.info("Illegal action in state: " + gameState);
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
