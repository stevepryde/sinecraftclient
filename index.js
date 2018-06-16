const path = require("path");

const {
    GameConfig
} = require("./src/config");
const {
    SineConnect
} = require("./src/connect");
const {
    ask,
    getPassword
} = require("./src/userinput");

const VERSION = "1.0";

process.on('SIGINT', function () {
    console.log('\nSIGINT caught');
    process.exit();
});

process.on('SIGTERM', function () {
    console.log('\nSIGTERM caught.');
    process.exit();
});

const configPath = path.join(__dirname, 'config.json');
var config = new GameConfig(configPath, VERSION);
var conn = new SineConnect(config);

async function doCreate() {
    console.log("Creating a new account...");
    var username = await ask("Enter a username:");
    if (username.length === 0) {
        return;
    }

    var password = await getPassword("Enter a password:");
    var displayName = await ask("Enter your display name:");
    await conn.createUser(username, password, displayName)
        .then(function (response) {
            console.log("Account creation successful.\n");
            console.log("Welcome, " + conn.user.displayName + "\n");
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
        });
}

async function doLogin() {
    console.log("Type 'create' to create a new account");
    var username = await ask("Enter your username:");
    if (username === "create") {
        return doCreate();
    }
    else if (username.length === 0) {
        return;
    }

    var password = await getPassword("Enter your password:");
    await conn.login(username, password)
        .then(function (response) {
            console.log("Login successful.\n");
            console.log("Welcome, " + conn.user.displayName + "\n");
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
        });
}

async function doUpdatePW() {
    var curPassword = await getPassword("Enter your old password:");
    var newPassword = await getPassword("Enter your new password:");
    var newPasswordRepeat = await getPassword("Enter your new password again:");
    if (newPasswordRepeat !== newPassword) {
        console.log("New password does not match. Aborting password change.");
        return;
    }

    await conn.updatepw(curPassword, newPassword)
        .then(function (response) {
            console.log("Password updated successfully.\n");
        })
        .catch(function (err) {
            console.log("Error: " + err.message);
        });
}

async function doMainLoop() {
    console.log("\n");
    var title = "Sinecraft Version " + VERSION;
    console.log(title);
    console.log("-".repeat(title.length) + "\n");

    if (conn.isAuthed()) {
        await conn.getCurrentUser();
        console.log("Welcome, " + conn.user.displayName + "\n");
    }

    while (true) {
        while (!conn.isAuthed()) {
            await doLogin();
        }

        console.log("\n");
        var cmd = await ask("Enter your command:");
        switch (cmd) {
            case "ping":
                await conn.getCurrentUser();
                if (conn.isAuthed()) {
                    console.log("User: " + conn.user.displayName);
                    console.log("Connected.");
                }
                break;
            case "quit":
                console.log("Ok, bye.");
                console.log("\n\nThank you for playing Sinecraft. See you next time.\n");
                return;
            case "logout":
                await conn.logout().then(function (response) {
                    console.log("Logout successful.\n");
                });
                break;
            case "changepw":
                await doUpdatePW();
                break;
            default:
                console.log("Unknown command: " + cmd + "\n");
                break;
        }
    }
}

doMainLoop();
