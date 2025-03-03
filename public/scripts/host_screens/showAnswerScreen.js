let RGB_80_GREEN = "rgba(76, 175, 80, 0.8)";

function showAnswer() {
    clearScreen();
    let question = questions[currentIndex];
    let showAnswerBtn = document.getElementById("show-answer-btn");
    let mediaContainer = document.getElementById("answer-media-container");
    mediaContainer.innerHTML = "";
    mediaContainer.style.display = "block";
    
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

    // 🖼️ Handle Image
    if (question.answerImage) {
        let img = document.createElement("img");
        img.src = question.answerImage;
        img.alt = "Answer Image";
        mediaContainer.appendChild(img);
    }

    // 🔄 Send answer to server
    socket.emit("sendAnswerToServer", question);

    document.getElementById("answer-container").style.display = "flex";
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
            answerBox.style.background = RGB_80_GREEN; // Make it green if correct
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
                answerBox.style.background = RGB_80_GREEN; // Make it green
            }
        });

        answerGrid.appendChild(answerBox);
    });
});

/* Move to next question or game over screen - Triggered when next question button is pressed */
function moveToNextQuestion() {
    clearScreen();
    currentIndex++;
    if (currentIndex >= questions.length) {
        showGameOverScreen();
    }
    else {
        nextQuestion();
        socket.emit("nextQuestion");
    }
}