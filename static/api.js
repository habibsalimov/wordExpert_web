class Api {
    // Development endpoint - change this for production
    static BASE_URL = 'https://dev.wordexpert.ai/api'; // Local development server

    static async fetchWithAuth(endpoint, options = {}) {
        let retries = 0;
        const maxRetries = 2;
        while (retries <= maxRetries) {
            try {
                let accessToken = await Auth.checkAndRefreshToken();
                const response = await fetch(`${this.BASE_URL}${endpoint}`, {
                    ...options,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        ...(options.headers || {})
                    }
                });
                // Token geçersiz ise yenilemeyi dene
                if (response.status === 401 && retries < maxRetries) {
                    console.log('Token expired, attempting refresh...');
                    const tokens = await Auth.refreshToken();
                    if (tokens) {
                        retries++;
                        continue;
                    }
                }
                return response;
            } catch (error) {
                if (error.message === 'TOKEN_REFRESH_FAILED' || retries === maxRetries) {
                    throw error;
                }
                retries++;
            }
        }
        throw new Error('TOKEN_REFRESH_FAILED');
    }

    static async authenticate(username, password) {
        try {
            console.log('Attempting authentication...', { username });
            const response = await fetch(`${this.BASE_URL}/token/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                mode: 'cors',
                credentials: 'omit', // Changed from 'include' to 'omit' for local testing
                body: JSON.stringify({ username, password })
            });

            // Handle CORS error specifically
            if (!response.ok) {
                if (response.status === 0) {
                    throw new Error('Network error - possible CORS issue. Please check server configuration.');
                }
                const error = new Error(`Authentication failed: ${response.status} ${response.statusText}`);
                error.status = response.status;
                throw error;
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('Authentication error details:', {
                message: error.message,
                status: error.status
            });
            
            // Provide more specific error message for CORS
            if (error.message.includes('CORS')) {
                throw new Error('Server connection error. Please contact support.');
            }
            
            throw error;
        }
    }

    static async refreshToken(refreshToken) {
        try {
            const response = await fetch(`${this.BASE_URL}/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh: refreshToken })
            });
            if (!response.ok) {
                throw new Error('TOKEN_REFRESH_FAILED');
            }
            const data = await response.json();
            return {
                access: data.access,
                refresh: data.refresh || refreshToken // Eğer yeni refresh token dönmezse eskisini kullan
            };
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    // New login functionality using endpoint response data
    static async loginUser(username, password) {
        try {
            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            const authData = await this.authenticate(username, password);
            
            if (!authData?.access || !authData?.refresh) {
                throw new Error('Invalid response format: missing tokens');
            }

            localStorage.setItem('accessToken', authData.access);
            localStorage.setItem('refreshToken', authData.refresh);
            return authData;
        } catch (error) {
            console.error('Login failed:', error);
            throw new Error(error.message || 'Login failed. Please check your credentials.');
        }
    }
}

