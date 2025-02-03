class MessageHandler {
    constructor() {
        this.apiUrl = 'https://websocket.tahrirchi.uz/translate-v2';
        this.apiKey = 'th_0c299545-91a4-4b1b-8239-be010149938a';
        this.defaultSourceLang = 'eng_Latn';
        this.defaultTargetLang = 'uzn_Latn';
    }

    async sendMessage(message) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.apiKey
                },
                body: JSON.stringify({
                    text: message.text,
                    source_lang: message.sourceLang || this.defaultSourceLang,
                    target_lang: message.targetLang || this.defaultTargetLang,
                    model: message.model || 'tilmoch'  // Default to 'tilmoch' if no model specified
                })
            });

            if (!response.ok) {
                throw new Error(`Translation failed! Status: ${response.status}`);
            }

            const data = await response.json();
            return {
                translation: data.translated_text,
                error: data.error
            };
        } catch (error) {
            console.error('Translation API request failed:', error);
            throw error;
        }
    }
}
