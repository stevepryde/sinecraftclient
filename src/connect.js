const axios = require("axios");

class AuthError extends Error { };

class SineConnect {
    constructor(config) {
        this.config = config;
        this.url = this.config.get("url");
        if (this.url.slice(-1) !== "/") {
            this.url += "/";
        }

        this.user = {};
        this.authToken = config.get("authToken", "");
        this.refreshToken = config.get("refreshToken", "");

        // Set up axios.
        this.axios = axios.create({ baseURL: this.url });
    }

    req(config, options = {}) {
        var that = this;
        if (!config.headers) {
            config.headers = {};
        }
        config.headers['User-Agent'] = "Sinecraft Client v" + this.config.version;
        config.headers['x-sinecraft-auth-token'] = this.authToken;
        return this.axios.request(config)
            .catch(function (err) {
                if (err.response && !options.skipInterceptor) {
                    return that.interceptor(err.response);
                }
                return err.response;
            });
    }

    interceptor(response) {
        var dontHandle = [
            "auth/login",
            "auth/refresh",
            "auth/create"
        ];
        var that = this;

        if (response.status === 498 && !dontHandle.includes(response.config.url)) {
            // Refresh the token.
            return that.axios.post("auth/refresh", {
                authToken: that.authToken,
                refreshToken: that.refreshToken
            }).then(function (authResponse) {
                if (authResponse.status !== 200) {
                    // Just return the original response.
                    return response;
                }

                that.updateAuthTokens(authResponse.data);

                // Now retry the original request.
                return that.req(response.config, {
                    skipInterceptor: true
                });
            }).catch(function (err) {
                console.log("Failed to refresh auth token. You will be logged out.");
                that.clearAuthTokens();
            });
        }

        return response;
    }

    get(endpoint, params = {}) {
        return this.req({
            method: 'get',
            url: endpoint,
            params: params
        });
    }

    post(endpoint, data) {
        return this.req({
            method: 'post',
            url: endpoint,
            data: data
        });
    }

    isAuthed() {
        if (this.authToken) {
            return true;
        }

        return false;
    }

    getCurrentUser() {
        var that = this;
        return this.get("/user/me").then(function (response) {
            that.user = response.data;
            return that.user;
        });
    }

    createUser(username, password) {
        var that = this;

        return this.post("/auth/create", { username, password })
            .then(function (response) {
                if (response.status !== 200) {
                    throw new AuthError("Invalid login: " + response.statusText);
                }

                that.updateAuthTokens(response.data);
                return that.getCurrentUser();
            });
    }

    login(username, password) {
        var that = this;
        return this.post("/auth/login", { username, password })
            .then(function (response) {
                if (response.status !== 200) {
                    throw new AuthError("Invalid login: " + response.statusText);
                }

                that.updateAuthTokens(response.data);
                return that.getCurrentUser();
            })
            .catch(function (err) {
                that.clearAuthTokens();
                throw err;
            });
    }

    logout() {
        var that = this;
        return this.post("/auth/logout", {})
            .then(function (response) {
                if (response.status !== 200) {
                    throw new AuthError("Logout failed: " + response.statusText);
                }

                that.clearAuthTokens();
                return response;
            }).catch(function (err) {
                // Force logout.
                that.clearAuthTokens();
            });
    }

    updatepw(password, newPassword) {
        var that = this;
        return this.post("/auth/pw", { password, newPassword })
            .then(function (response) {
                if (response.status !== 200) {
                    throw new AuthError("Invalid login: " + response.statusText);
                }

                that.updateAuthTokens(response.data);
                return that.getCurrentUser();
            })
            .catch(function (err) {
                that.clearAuthTokens();
                throw err;
            });
    }

    updateAuthTokens(tokenData) {
        this.authToken = tokenData.authToken;
        this.refreshToken = tokenData.refreshToken;
        this.config.updateTokens(tokenData);
    }

    clearAuthTokens() {
        this.updateAuthTokens({
            authToken: "",
            refreshToken: ""
        });
    }

    sendCommand(cmd) {
        return this.post("/game/cmd", { cmd: cmd })
            .then(function (response) {
                if (response.status !== 200) {
                    throw new Error(cmd);
                }

                return response;
            });
    }

    getPlayerStatus() {
        return this.get("/user/status")
            .then(function (response) {
                if (response.status !== 200) {
                    throw new Error("Error getting status");
                }

                return response.data;
            });
    }
}

module.exports = {
    SineConnect
};

