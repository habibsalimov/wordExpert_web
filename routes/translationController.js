const axios = require('axios');

const translate = async (req, res) => {
    try {
        const { text, sourceLang, targetLang, model } = req.body;
        const authToken = req.headers.authorization;

        if (!authToken) {
            return res.status(401).json({
                success: false,
                error: 'Authorization token required'
            });
        }

        const response = await axios.post(process.env.TRANSLATION_API_URL, {
            content: text,  // Changed from text to content
            source_lang: sourceLang,
            target_lang: targetLang,
            model: model || 'tilmoch'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken
            }
        });

        res.json({
            success: true,
            translation: response.data.translated_text
        });
    } catch (error) {
        console.error('Translation error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Translation failed',
            details: error.response?.data || error.message
        });
    }
};

module.exports = {
    translate
};