let currentIndex = 0;

/* Setup next question - Triggered by move to next question button */
function nextQuestion() {
    removeScoreBubbles();
    let question = questions[currentIndex];
    document.getElementById("question-text").innerText = question.question;
    if (question.question.length > 110) {
        document.getElementById("question-text").style.fontSize = "3vh"
    }
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

    if (question.order) {
        let list = document.createElement("ul");
        list.id = "sortable-list"; // Use the new styled ID
        question.order.forEach((option) => {
            let listItem = document.createElement("li");
            listItem.innerText = option;
            listItem.classList.add("sortable-item"); // Use the new styled class
            list.appendChild(listItem);
        });
        mediaContainer.appendChild(list);
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

    // 🎵 Handle Audio (Multiple Tracks)
    if (question.audio) {
        let audioContainer = document.createElement("div");
        let playingIndex = -1; // Track which song is playing
        let currentPlayingBtn = null;

        question.audio.forEach((audioUrl, index) => {
            let playBtn = document.createElement("button");
            playBtn.classList.add("play-button");
            playBtn.innerText = `▶ Play Track ${index + 1}`;
            
            playBtn.onclick = () => {
                if (playingIndex === index) {
                    // Stop current track
                    playingIndex = -1;
                    playBtn.innerText = `▶ Play Track ${index + 1}`;
                    playBtn.classList.remove("playing");
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
                    playBtn.classList.add("playing");
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

    document.getElementById("question-container").classList.add("active")
}

/* Start progress bar - triggered if a question has a timer */
function startProgressBar(duration) {
    let progressBar = document.getElementById("progress-bar");
    progressBar.style.transition = "none";
    progressBar.style.width = "100%";
    setTimeout(() => {
        progressBar.style.transition = `width ${duration}s linear`;
        progressBar.style.width = "0%";
    }, 100);
}
