const IP = "192.168.1.66";
const PORT = "4000";
const clientId = '21dcef6970a446dba03fa04599fa7510'; // Your Spotify App Client ID

const redirectUri = `https://${IP}:${PORT}/`; // Must match Spotify Developer Dashboard settings

const scopes = [
    'streaming', // Required for playback
    'user-read-private', 'user-read-email', 
    'user-modify-playback-state', 'user-read-playback-state'
].join('%20');

const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;

let player;
let deviceId;
let isPlayerInitialized = false; // 🔄 Prevent duplicate player initialization

// ✅ Get the Spotify Access Token
function getAccessToken() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    let accessToken = params.get("access_token");
    let expiresIn = params.get("expires_in");

    if (accessToken) {
        localStorage.setItem("spotify_access_token", accessToken);
        localStorage.setItem("spotify_token_expires", Date.now() + expiresIn * 1000);
        window.history.replaceState({}, document.title, window.location.pathname);
    } else {
        accessToken = localStorage.getItem("spotify_access_token");
    }
    return accessToken;
}

// ✅ Check if the Token is Expired
function isTokenExpired() {
    const expiresAt = localStorage.getItem("spotify_token_expires");
    return !expiresAt || Date.now() > expiresAt;
}

// ✅ Request a New Token (Redirect to Spotify Login)
function requestNewToken() {
    console.log("🔄 Redirecting to Spotify login...");
    window.location.href = authUrl;
}

// ✅ Check & Refresh Token on Page Load
function checkAndRefreshToken() {
    const token = localStorage.getItem("spotify_access_token");

    if (!token || isTokenExpired()) {
        console.warn("🔄 Token is missing or expired. Requesting a new one...");
        requestNewToken();
    } else {
        console.log("✅ Token is valid.");
        initializePlayer(); // Ensure player starts only once
    }
}

// ✅ Logout & Clear Token
function logoutSpotify() {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_token_expires");
    requestNewToken();
}

// ✅ Ensure SDK Function is Defined Globally
window.onSpotifyWebPlaybackSDKReady = function () {
    initializePlayer();
};

function initializePlayer() {
    if (isPlayerInitialized) return; // ✅ Prevent duplicate initialization
    isPlayerInitialized = true;

    console.log("🛠️ Initializing Spotify Player...");

    const token = localStorage.getItem("spotify_access_token");
    if (!token) {
        console.error("❌ No valid token! Cannot initialize Spotify player.");
        return;
    }

    player = new Spotify.Player({
        name: 'Quiz Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('✅ Player is ready!', device_id);
        deviceId = device_id;
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error('❌ Authentication error: ', message);
        logoutSpotify();
    });

    player.addListener('not_ready', ({ device_id }) => {
        console.warn('⚠️ Player is offline', device_id);
    });

    player.connect();
}

// ✅ Wait Until Device ID is Ready
async function waitForDeviceId() {
    let retries = 15;
    while (!deviceId && retries > 0) {
        console.warn("⏳ Waiting for device ID...");
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries--;
    }

    if (!deviceId) {
        console.error("❌ No device ID found after waiting!");
        return false;
    }
    console.log(`✅ Device ID is ready: ${deviceId}`);
    return true;
}

// ✅ Transfer Playback to the Web Player
async function transferPlaybackToWebPlayer() {
    const deviceReady = await waitForDeviceId();

    if (!deviceReady) {
        console.error("❌ Could not set active device!");
        return;
    }

    console.log(`🎛️ Transferring playback to device: ${deviceId}`);
    fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("spotify_access_token")}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_id: deviceId })
    }).then(response => {
        if (!response.ok) {
            return response.json().then(err => console.error("❌ Error transferring playback:", err));
        }
        console.log("✅ Playback transferred to Web Player.");
    }).catch(err => console.error("❌ Network error transferring playback:", err));
}


// ✅ Function to Play a Song
async function playSong(trackUrl) {
    const token = localStorage.getItem("spotify_access_token");

    if (!token || isTokenExpired()) {
        console.error("❌ Token expired! Refreshing...");
        requestNewToken();
        return;
    }

    if (!deviceId) {
        console.error("❌ No active Spotify device found! Ensure the player is ready.");
        return;
    }

    let trackUri = `spotify:track:${trackUrl.split('/track/')[1].split('?')[0]}`; // Clean up URI

    console.log("🔄 Transferring playback to Web Player...");
    await fetch("https://api.spotify.com/v1/me/player", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ device_ids: [deviceId], play: false }) // Don't auto-play
    }).then(response => {
        if (!response.ok) {
            console.error("❌ Error transferring playback:", response.status);
        }
    });

    console.log(`🎵 Playing track: ${trackUri}`);
    fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ uris: [trackUri], position_ms: 0  }) 
    }).then(response => {
        if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
        console.log("✅ Song is playing!");
    }).catch(err => console.error("❌ Error playing song:", err));
}

function stopSong() {
    const token = localStorage.getItem("spotify_access_token");

    if (!token || isTokenExpired()) {
        console.error("❌ Token expired! Refreshing...");
        requestNewToken();
        return;
    }

    if (!deviceId) {
        console.error("❌ No active Spotify device found! Ensure the player is ready.");
        return;
    }

    fetch("https://api.spotify.com/v1/me/player/pause", {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) throw new Error(`Spotify API error: ${response.status}`);
        console.log("⏹️ Song stopped!");
    })
    .catch(error => console.error("❌ Error stopping song:", error));
}

// ✅ Ensure Token is Valid on Page Load
window.onload = () => {
    getAccessToken();
    checkAndRefreshToken();
};
