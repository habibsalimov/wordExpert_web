class MessageHandler {
    constructor() {
        // Backend API URL'i
        this.apiUrl = 'http://localhost:5000/api';
        // API istekleri için default headers
        this.headers = {
            'Content-Type': 'application/json',
        };
    }

    async sendMessage(message) {
        try {
            const response = await fetch(`${this.apiUrl}/translate`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    text: message.text,
                    sourceLang: message.sourceLang,
                    targetLang: message.targetLang,
                    model: message.model || 'tilmoch'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Translation failed');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Translation failed');
            }

            return {
                translation: data.translation,
                error: null
            };
        } catch (error) {
            console.error('Translation request failed:', error);
            return {
                translation: null,
                error: error.message || 'Translation service unavailable'
            };
        }
    }
}
class Auth {
    static async loginUser(username, password) {
        try {
            const response = await fetch('http://localhost:5000/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async refreshToken(refreshToken) {
        try {
            const response = await fetch('http://localhost:5000/api/token/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    static logout() {
        window.location.href = 'login.html';
    }
}
