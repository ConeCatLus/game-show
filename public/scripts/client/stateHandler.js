const socket = io();
const GameState = Object.freeze({
    JOIN_SCREEN: "time to join",
    LIMBO_SCREEN: "waiting for host to start",
    QUESTION_SCREEN: "answer question",
    ANSWER_SCREEN: "show answer",
    GAME_OVER: "game over",
    CHANGE_THEME: "change theme"
});

let gameState;

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
        element.innerHTML = message;
    });
}

function clearScreen() {
    updateStatus("");
    document.getElementById("join-container").style.display = "none";
    document.getElementById("limbo-container").style.display = "none";
    document.getElementById("question-container").style.display = "none";
    document.getElementById("answer-container").style.display = "none";
    document.getElementById("game-over-container").style.display = "none";
}
