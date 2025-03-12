const socket = io();
let questions = [];

// Load questions from JSON
document.addEventListener("DOMContentLoaded", () => {
    console.log("Host Started");
    socket.emit("hostStarted"); // Send to server that host has restarted so clients also restart

    changeTheme();

    fetch("/api/network")
        .then(res => res.json())
        .then(data => {
            document.getElementById("ssid").innerHTML = data.ssid;
            document.getElementById("password").innerHTML = data.password;
        })
        .catch(error => console.error("Network Error:", error));    

    // Fetch and display QR Code & Game Code
    fetch("/qr")
        .then(res => res.json())
        .then(data => {
            document.getElementById("qr-code").src = data.qr;
        })
        .catch(error => console.error("QR Code Error:", error));

    fetch("/api/quizes")
        .then(response => response.json())
        .then(quizzes => {
            const dropdown = document.getElementById("quizDropdown");
            
            quizzes.forEach(quizFile => {
                fetch(`quizes/${quizFile}`)
                    .then(response => response.json())
                    .then(quizData => {
                        const option = document.createElement("option");
                        option.value = `quizes/${quizFile}`;
                        option.textContent = quizData.quizName || quizFile.replace(".json", ""); // Use quizName if available
                        dropdown.appendChild(option);
                    })
                    .catch(error => console.error("Error fetching quiz details:", error));
            });
        })
        .catch(error => console.error("Error fetching quizzes:", error));

        document.getElementById("setup-container").classList.add("active");
        document.getElementById("players-container").classList.add("active");
});

/* Select quiz - Triggered when a quiz is selected in the dropdown */
function selectQuiz() {
    const dropdown = document.getElementById("quizDropdown");
    const quizTitle = document.getElementById("quiz-title");
    const selectedQuiz = dropdown.value;

    if (!selectedQuiz) {
        quizTitle.textContent = "Bubblegum Quiz";
        return;
    }

    fetch(selectedQuiz)
        .then(response => response.json())
        .then(data => {
            if (data.questions) {
                questions = data.questions; // Extract questions array
                console.log("Loaded Quiz:", questions);
                changeTheme(data.quizTheme);
                if (data.quizName) {
                    quizTitle.textContent = data.quizName;
                    socket.emit("changeQuizTitle", data.quizName);
                }
                document.getElementById("status").textContent = "";
            } else {
                console.error("Invalid quiz format: No 'questions' array found.");
            }
        })
        .catch(error => console.error("Error loading selected quiz:", error));
}

/* Start Game - Button trigger this function */
function startGame() {
    const dropdown = document.getElementById("quizDropdown");
    const status = document.getElementById("status");
    if (!dropdown.value) {
        status.textContent = "Please select a quiz before starting!";
        return;
    }

    if (!questions || questions.length === 0) {
        status.textContent = "The selected quiz has no questions. Please choose another one.";
        return;
    }

    clearScreen();    
    nextQuestion();
}

function clearScreen() {
    document.getElementById("status").textContent = "";
    document.getElementById("setup-container").classList.remove("active");
    document.getElementById("question-container").classList.remove("active");
    document.getElementById("answer-container").classList.remove("active");
    document.getElementById("game-over-container").classList.remove("active");
}
