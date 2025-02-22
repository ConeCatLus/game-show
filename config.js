const config = {
    PORT: "4000",
    CLIENT_ID: "21dcef6970a446dba03fa04599fa7510"
};

// Dynamically set IP **only in Node.js**
if (typeof module !== "undefined" && module.exports) {
    const ip = require("ip");
    config.IP = ip.address();
    module.exports = config; // Export for server.js
} else {
    window.config = config; // Expose to frontend
}

