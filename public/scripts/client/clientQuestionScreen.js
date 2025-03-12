let playerAnswer = {};
let progressTimeout;

// Set screen -> QUESTION_SCREEN 
function showQuestionScreen(question) {
    q = question.question;
    clearScreen();
    playerAnswer = {};
    document.getElementById("display-question").innerText = q.question;
    document.getElementById("join-screen-name").innerText = "Bubblegum Game";
    
    let timeLeft = q.timer;

    // Clear any previous inputs or elements
    let answerContainer = document.getElementById("answers");
    answerContainer.classList.remove("alt-answers"); // Clear class if previous was alt-answers
    answerContainer.innerHTML = ""; // Clear previous answer inputs

    if (q.order) {
        let list = document.createElement("ul");
        list.id = "sortable-list"; // Use the new styled ID
    
        q.order.forEach((option, index) => {
            let item = document.createElement("li");
            item.innerText = option;
            item.classList.add("sortable-item");
            item.setAttribute("data-index", index);
            list.appendChild(item);
        });
        answerContainer.appendChild(list);
        initializeDragDrop();
        updatePlayerAnswer();
    }
    else if (q.alternatives) {
        answerContainer.classList.add("alt-answers");
        // Create buttons for each alternative answer
        q.alternatives.forEach((alt) => {
            let button = document.createElement("button");
            button.innerText = alt;
            button.classList.add("answer-button");
            button.onclick = () => {
                document.querySelectorAll(".answer-button").forEach(btn => btn.classList.remove("selected"));
                button.classList.add("selected");
                playerAnswer = button.innerText;
            };

            answerContainer.appendChild(button);
        });
    }
    // 📝 If the answer is an object (multi-part answer), create multiple inputs
    else if (typeof q.answer === "object") {
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
        if (!Array.isArray(playerAnswer) && typeof playerAnswer !== "string") {
            playerAnswer = document.getElementById("client-answer").value.trim();
        }
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
