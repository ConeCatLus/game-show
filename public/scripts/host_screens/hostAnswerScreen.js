let RGB_80_RED = "rgba(244, 67, 54, 0.8)";
let RGB_80_YELLOW = "rgba(255, 221, 51, 0.8)";
let RGB_80_ORANGE = "rgba(255, 153, 51, 0.8)";
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
    if (question.answerVideo) {
        let iframe = document.createElement("iframe");
        let videoId = question.answerVideo.split("v=")[1]; // Extract video ID
        let startTime = 0; // Set start time in seconds
        if (question.startAt)
        {
            startTime = question.startAt;
        }
        iframe.src = `https://www.youtube.com/embed/${videoId}?start=${startTime}`;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        mediaContainer.appendChild(iframe);
    }
    // 🔄 Send answer to server
    socket.emit("sendAnswerToServer", question);

    document.getElementById("answer-container").classList.add("active");
}

function isCloseMatch(input, correct) {
    let distance = levenshteinDistance(input.toLowerCase(), correct.toLowerCase());
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
    }
    // If correctAnswer is an array of objects
    else if(Array.isArray(correctAnswer)) {
        // If correctAnswer is an array of strings
        for (let i = 0; i < correctAnswer.length; i++) {
            if (correctAnswer[i] === playerAnswer[i]) {
                score++; // Found a mismatch
            }
        }
    }
    else {
        // If correctAnswer is a single string
        if (isCloseMatch(playerAnswer, correctAnswer)) {
            score++;
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
    correctAnswer = questions[currentIndex].answer;

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
        let answerScore = checkAnswer(answer, correctAnswer);

        // Update the player's score based on correctness
        if (answerScore > 0) {
            socket.emit("updateScore", { id, score: score + answerScore, answerScore: answerScore }); // Award points for the answer
            if (answerScore === answer.length || 
                answerScore === Object.keys(answer).length ||
                typeof answer == "string") {
                answerBox.style.background = RGB_80_GREEN; // Make it green if correct
            } else {
                // Add a click option for one extra point
                answerBox.style.background = RGB_80_YELLOW; // Make it yellow if partially correct
            }
        } else {
            answerBox.style.background = RGB_80_RED;
        }

        if (answerBox.style.background !== RGB_80_GREEN) {
            let displayScore = answerScore;
            // Add a click option for one extra point
            answerBox.addEventListener("click", () => {
                if (answerBox.classList.contains("max-points")) {
                    // If clicked, remove the 'clicked' class, deduct points, and reset background color
                    displayScore = answerScore;
                    socket.emit("updateScore", { id, score: score + answerScore, answerScore: answerScore });
                    answerBox.classList.remove("max-points");
                    if (answerScore === 0) {
                        answerBox.style.background = RGB_80_RED;
                    } else {
                        answerBox.style.background = RGB_80_YELLOW; // Reset background color
                    }
                } else {
                    // If not clicked, add points and change background color to green
                    displayScore = displayScore + 1;
                    socket.emit("updateScore", { id, score: score + displayScore, answerScore: displayScore });
                    if (displayScore === correctAnswer.length || 
                        displayScore === Object.keys(correctAnswer).length ||
                        typeof correctAnswer == "string") {
                        answerBox.classList.add("max-points");
                        answerBox.style.background = RGB_80_GREEN;
                    }
                }
            });
        }
        answerGrid.appendChild(answerBox);
    });
});

/* Move to next question or game over screen - Triggered when next question button is pressed */
function moveToNextQuestion() {
    clearScreen();
    currentIndex++;
    if (currentIndex >= questions.length) {
        showGameOverScreen();
    } else {
        nextQuestion();
        socket.emit("nextQuestion");
    }
}
