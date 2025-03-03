// Set screen -> SHOW_SCREEN 
function showAnswerScreen(data) {
    clearScreen();

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