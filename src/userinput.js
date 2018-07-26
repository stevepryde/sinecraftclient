const readline = require("readline");

var cmdHistory = [];
var cmdIndex = 0;
var lastCmdBlock = false;
var curPrompt = '';
var currl = null;

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.name === 'up') {
        cmdIndex++;
        if (cmdIndex >= cmdHistory.length) {
            cmdIndex = cmdHistory.length - 1;
            return;
        }

        if (currl) {
            currl.write(null, { ctrl: true, name: 'u' });
            currl.write(cmdHistory[cmdIndex]);
        }
    }
    else if (key.name === 'down') {
        cmdIndex--;
        if (cmdIndex < 0) {
            cmdIndex = -1;
            if (currl) {
                currl.write(null, { ctrl: true, name: 'u' });
            }
            return;
        }

        if (currl) {
            currl.write(null, { ctrl: true, name: 'u' });
            currl.write(cmdHistory[cmdIndex]);
        }
    }

});

function ask(msg, options = {}) {
    curPrompt = msg;

    return new Promise(function (resolve, reject) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        currl = rl;
        rl.on('SIGINT', () => {
            console.log("\n\nCTRL+C! Exiting.\n\n");
            process.stdin.removeAllListeners();
            process.exit();
        });

        rl.on('SIGTERM', () => {
            console.log("\n\nSIGTERM! Exiting.\n\n");
            process.stdin.removeAllListeners();
            process.exit();
        });

        rl.on('keypress', (str, key) => {
            console.log("HELLO");
        });

        rl.question(msg, (answer) => {
            rl.pause();
            rl.close();
            if (options.hide) {
                // The CR gets hidden as well.
                console.log("");
            }
            else {
                cmdHistory.unshift(answer.trim());
                // Limit to 100 commands.
                cmdHistory = cmdHistory.slice(0, 100);
                cmdIndex = -1;
            }
            resolve(answer);
        });

        if (options.hide) {
            rl.stdoutMuted = true;
            rl._writeToOutput = function _writeToOutput(stringToWrite) {
                if (rl.stdoutMuted)
                    rl.output.write("*");
                else
                    rl.output.write(stringToWrite);
            };
        }


    });
}

async function getPassword(msg) {
    return await ask(msg, { hide: true });
}


module.exports = {
    ask,
    getPassword
};
