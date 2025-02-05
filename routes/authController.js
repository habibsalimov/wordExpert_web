const axios = require('axios');

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const response = await axios.post(process.env.AUTH_API_URL, {
            email,
            password
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Login error:', error.response?.data || error.message);
        res.status(401).json({
            error: error.response?.data?.error || 'Login failed'
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refresh } = req.body;

        const response = await axios.post(process.env.AUTH_REF_API_URL, {
            refresh
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Token refresh error:', error.response?.data || error.message);
        res.status(401).json({
            error: error.response?.data?.error || 'Token refresh failed'
        });
    }
};

module.exports = {
    login,
    refreshToken
};