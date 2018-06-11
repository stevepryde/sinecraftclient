const readline = require("readline");

function ask(msg, options = {}) {
    return new Promise(function (resolve, reject) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('SIGINT', () => {
            console.log("\n\nCTRL+C! Exiting.\n\n");
            process.exit(1);
        });

        rl.on('SIGTERM', () => {
            console.log("\n\nSIGTERM! Exiting.\n\n");
            process.exit(1);
        });

        rl.question(msg, (answer) => {
            rl.close();
            if (options.hide) {
                // The CR gets hidden as well.
                console.log("");
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
