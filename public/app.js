class MessageHandler {
    constructor() {
        // Backend API URL'i
        this.apiUrl = 'http://localhost:5001/api';
        // API istekleri için default headers
        this.headers = {
            'Content-Type': 'application/json',
        };
        // Add auth token if exists
        const token = localStorage.getItem('access_token');
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    updateAuthToken(token) {
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    async sendMessage(message) {
        try {
            const response = await fetch(`${this.apiUrl}/translate`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    text: message.text,         // Keep as 'text' here since that's what the server expects
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
    static async loginUser(email, password) {
        try {
            const response = await fetch('http://localhost:5001/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Login failed');
            }

            const data = await response.json();
            // Store the tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async refreshToken(refreshToken) {
        try {
            const response = await fetch('http://localhost:5001/api/token/refresh', {
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
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = 'login.html';
    }

    static async checkTokenValidity() {
        const token = localStorage.getItem('access_token');
        if (!token) return false;

        try {
            const response = await fetch('http://localhost:5001/api/translate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: '',
                    sourceLang: 'eng_Latn',
                    targetLang: 'uzn_Latn'
                })
            });

            if (response.status === 401) {
                localStorage.clear();
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    static async guardRoute() {
        if (!window.location.pathname.includes('login.html')) {
            const isValid = await this.checkTokenValidity();
            if (!isValid) {
                window.location.href = 'login.html';
            }
        }
    }
}
