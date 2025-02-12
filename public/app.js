class MessageHandler {
    constructor() {
        // Backend API URL'i
        this.apiUrl = 'http://wordexpert.uz/api';
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
            // Token kontrolü yap
            const isTokenValid = await Auth.checkTokenValidity();
            if (!isTokenValid) {
                Auth.logout();
                throw new Error('Session expired. Please login again.');
            }

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
                if (response.status === 401 || response.status === 403) {
                    Auth.logout();
                    throw new Error('Session expired. Please login again.');
                }
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
            if (error.message.includes('Session expired')) {
                Auth.logout();
            }
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
            const response = await fetch('http://wordexpert.uz/api/token', {
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
            const response = await fetch('http://wordexpert.uz/api/token/refresh', {
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
        localStorage.clear();
        window.location.href = 'login.html';
    }

    static async checkTokenValidity() {
        const token = localStorage.getItem('access_token');
        if (!token) return false;

        try {
            // Önce token'ın süresini kontrol et
            const tokenData = this.parseJwt(token);
            if (tokenData.exp * 1000 < Date.now()) {
                // Token süresi dolmuş, refresh token ile yenilemeyi dene
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    try {
                        const newTokens = await this.refreshToken(refreshToken);
                        localStorage.setItem('access_token', newTokens.access);
                        return true;
                    } catch {
                        return false;
                    }
                }
                return false;
            }

            // Token hala geçerli, API kontrolü yap
            const response = await fetch('http://wordexpert.uz/api/verify-token', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            return response.ok;
        } catch {
            return false;
        }
    }

    static parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch {
            return {};
        }
    }

    static async guardRoute() {
        if (!window.location.pathname.includes('login.html')) {
            const isValid = await this.checkTokenValidity();
            if (!isValid) {
                this.logout();
            }
        }
    }
}
