let currentTheme = null;

function changeTheme(theme = null) {
    if (theme) {
        document.getElementById("theme").value = theme;
        currentTheme = theme;
    }
    else {
        currentTheme = document.getElementById("theme").value;
    }
    document.body.className = currentTheme;
    socket.emit("changeTheme", currentTheme);
}
