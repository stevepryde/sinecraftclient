const fs = require("fs");


class GameConfig {
    constructor(path, version) {
        this.path = path;
        this.version = version;
        this.config = {
            url: "http://localhost:5000"
        };

        this.readConfig();
    }

    readConfig() {
        try {
            this.config = JSON.parse(fs.readFileSync(this.path, 'utf8'));
        }
        catch (err) {
            this.writeConfig();
        }
    }

    writeConfig() {
        try {
            fs.writeFileSync(this.path, JSON.stringify(this.config));
        }
        catch (err) {
            console.log(err);
        }
    }

    get(key, _default = undefined) {
        if (this.config.hasOwnProperty(key)) {
            return this.config[key];
        }

        return _default;
    }

    set(key, value) {
        this.config[key] = value;
        this.writeConfig();
    }

    updateTokens(tokenData) {
        this.config.authToken = tokenData.authToken;
        this.config.refreshToken = tokenData.refreshToken;
        this.writeConfig();
    }
}

module.exports = {
    GameConfig
};
