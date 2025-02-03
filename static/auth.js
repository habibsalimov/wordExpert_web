class Auth {
    // Returns the current access token; refreshes if needed.
    static async checkAndRefreshToken() {
        let accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            throw new Error('No access token found');
        }
        // Optionally add token expiration checks here.
        return accessToken;
    }

    // Calls Api.refreshToken using stored refresh token and updates tokens.
    static async refreshToken() {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token found');

        const tokens = await Api.refreshToken(refreshToken);
        localStorage.setItem('accessToken', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
        return tokens;
    }

    static logout() {
        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page with correct path
        window.location.href = 'login.html'; // Removed leading slash
    }
}
