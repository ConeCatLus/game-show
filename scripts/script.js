let questions = [];
let currentIndex = 0;
let timer;
let timeLeft = 10;
let timerEnabled = true;
let players = [];

function addPlayer() {
    let playerName = document.getElementById("player-name").value.trim();
    if (playerName) {
        let newPlayer = { name: playerName, score: 0 };
        players.push(newPlayer);

        // Update Player List
        let playerList = document.getElementById("player-list");
        let li = document.createElement("li");

        let playerText = document.createElement("span");
        playerText.textContent = `${newPlayer.name}: ${newPlayer.score}`;
        // Create the "-" button (subtract points)
        let minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.classList.add ("minus");
        minusBtn.addEventListener("click", function() {
            if (newPlayer.score-1 > 0)
            {
                console.info(newPlayer.score-1);
                newPlayer.score--;
                updatePlayerList();
            }
        });

        // Create the "+" button (add points)
        let plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.classList.add("plus");
        plusBtn.addEventListener("click", function() {
            newPlayer.score++;
            updatePlayerList();
        });

        // Append the buttons to the list item
        li.appendChild(minusBtn);
        li.appendChild(playerText);
        li.appendChild(plusBtn);

        // Add the player list item to the player container
        playerList.appendChild(li);

        // Clear input field
        document.getElementById("player-name").value = ""; 
    }
}

function updatePlayerList() {
    // Update the player list UI
    let playerList = document.getElementById("player-list");
    playerList.innerHTML = ""; // Clear existing player list
    players.forEach(player => {
        let li = document.createElement("li");

        // Create player name and score span
        let playerText = document.createElement("span");
        playerText.textContent = `${player.name}: ${player.score}`;

        // Create the "-" button (subtract points)
        let minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        minusBtn.classList.add("minus"); // Add class for styling
        minusBtn.addEventListener("click", function() {
            if (player.score-1 >= 0)
            {
                console.info(player.score-1);
                player.score--;
                updatePlayerList();
            }
        });

        // Create the "+" button (add points)
        let plusBtn = document.createElement("button");
        plusBtn.textContent = "+";
        plusBtn.classList.add("plus"); // Add class for styling
        plusBtn.addEventListener("click", function() {
            player.score++; // Increase score
            updatePlayerList(); // Re-render player list
        });

        // Append the elements to the list item
        li.appendChild(minusBtn);
        li.appendChild(playerText);
        li.appendChild(plusBtn);

        // Add the player list item to the player container
        playerList.appendChild(li);
    });
}

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
    document.getElementById("start-btn").style.display = "none";
    document.getElementById("question-container").style.display = "flex";
    document.getElementById("setup-container").style.display = "none";
    nextQuestion();
}

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
    clearInterval(timer);

    if (currentIndex >= questions.length) {
        document.getElementById("question-text").innerText = "Game Over!";
        document.getElementById("progress-container").style.display = "none";
        document.getElementById("show-answer-btn").style.display = "none";
        document.getElementById("next-btn").style.display = "none";
        document.getElementById("media-container").style.display = "none"; // Hide media container
        return;
    }

    let question = questions[currentIndex];
    document.getElementById("question-text").innerText = question.question;
    document.getElementById("media-container").innerHTML = "";
    document.getElementById("next-btn").style.display = "none";
    document.getElementById("show-answer-btn").style.display = "none";
    document.getElementById("media-container").style.display = "block"; // Show media container for new question

    // Reset "Show Answer" button text
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

    timeLeft = question.timer;
    timerEnabled = timeLeft > 0;

    if (timerEnabled) {
        startProgressBar(timeLeft);
        timer = setTimeout(() => {
            document.getElementById("progress-container").style.display = "none"; // Remove progress bar
            document.getElementById("show-answer-btn").style.display = "block"; // Show answer button
        }, timeLeft * 1000);
    } else {
        document.getElementById("progress-container").style.display = "none"; 
        document.getElementById("show-answer-btn").style.display = "block"; // Show answer immediately
    }
}

function showAnswer() {
    let question = questions[currentIndex];
    let showAnswerBtn = document.getElementById("show-answer-btn");

    if (showAnswerBtn.innerHTML === "Show Answer") {
        showAnswerBtn.innerHTML = question.answer;
        showAnswerBtn.style.background = "#ff4da6"; 
        document.getElementById("next-btn").style.display = "block"; // Show Next button
    }
}

function moveToNextQuestion() {
    clearTimeout(timer);
    currentIndex++;
    nextQuestion();
}
