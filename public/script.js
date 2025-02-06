document.addEventListener('DOMContentLoaded', () => {
    const messageHandler = new MessageHandler();
    const sourceTextarea = document.querySelector('.editor:first-child textarea');
    const targetTextarea = document.querySelector('.editor:last-child textarea');
    const swapButton = document.querySelector('.swap-button');
    const improveButton = document.querySelector('.improve-button');
    const sourceLangButton = document.querySelector('.language-selector:first-child .language-button');
    const targetLangButton = document.querySelector('.language-selector:last-child .language-button');
    const charCounter = document.querySelector('.char-counter');
    const backButton = document.querySelector('.back-button');
    const forwardButton = document.querySelector('.forward-button');
    const historyButtons = document.querySelector('.history-buttons');
    const MAX_CHARS = 5000;

    // Çeviri geçmişi için değişkenler
    let translationHistory = [];
    let currentHistoryIndex = -1;
    let lastNormalTranslation = ''; // Normal çevirinin son halini tutmak için

    // Geçmiş yönetimi fonksiyonları
    function addToHistory(translation) {
        // Eğer geçmişte ileri gitmiş ve yeni bir iyileştirme yapılıyorsa
        // ileri kısmındaki geçmişi temizle
        if (currentHistoryIndex < translationHistory.length - 1) {
            translationHistory = translationHistory.slice(0, currentHistoryIndex + 1);
        }
        
        translationHistory.push(translation);
        currentHistoryIndex = translationHistory.length - 1;
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        backButton.disabled = currentHistoryIndex <= 0;
        forwardButton.disabled = currentHistoryIndex >= translationHistory.length - 1;
    }

    function showHistoryButtons() {
        historyButtons.classList.add('visible');
    }

    function hideHistoryButtons() {
        historyButtons.classList.remove('visible');
    }

    function goBack() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            targetTextarea.value = translationHistory[currentHistoryIndex];
            updateHistoryButtons();
        }
    }

    function goForward() {
        if (currentHistoryIndex < translationHistory.length - 1) {
            currentHistoryIndex++;
            targetTextarea.value = translationHistory[currentHistoryIndex];
            updateHistoryButtons();
        }
    }

    // Event listeners for history buttons
    backButton.addEventListener('click', goBack);
    forwardButton.addEventListener('click', goForward);

    // Update language buttons with supported languages
    const languages = {
        'eng_Latn': 'English',
        'uzn_Latn': "O'zbekcha",
        'uzn_Cyrl': 'Ўзбекча',
        'rus_Cyrl': 'Русский',
        'kaa_Latn': 'Qaraqalpaqsha',
        'kaa_Cyrl': 'Қарақалпақша'
    };

    let sourceLang = 'eng_Latn';
    let targetLang = 'uzn_Latn';

    // Update language display
    sourceLangButton.firstChild.textContent = languages[sourceLang];
    targetLangButton.firstChild.textContent = languages[targetLang];

    // Dil değiştirme işlevi
    function swapLanguages() {
        [sourceLang, targetLang] = [targetLang, sourceLang];
        
        sourceLangButton.firstChild.textContent = languages[sourceLang];
        targetLangButton.firstChild.textContent = languages[targetLang];
        
        const sourceText = sourceTextarea.value;
        sourceTextarea.value = targetTextarea.value;
        targetTextarea.value = sourceText;
        
        // Dil değiştiğinde geçmişi temizle ve butonları gizle
        translationHistory = [];
        currentHistoryIndex = -1;
        hideHistoryButtons();
        
        if (sourceTextarea.value) {
            translateText();
        }
    }

    // Add language selection dropdowns
    function createLanguageDropdown(button, currentLang) {
        const dropdown = document.createElement('div');
        dropdown.className = 'language-dropdown';
        dropdown.innerHTML = Object.entries(languages).map(([code, name]) => `
            <div class="language-option ${code === currentLang ? 'active' : ''}" data-lang="${code}">
                ${name}
            </div>
        `).join('');
        
        return dropdown;
    }

    // Function to close all dropdowns
    function closeAllDropdowns() {
        document.querySelectorAll('.language-dropdown').forEach(d => d.remove());
    }

    // Update language button click handlers
    [sourceLangButton, targetLangButton].forEach((button, index) => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event from bubbling up
            const isSource = index === 0;
            const currentLang = isSource ? sourceLang : targetLang;
            
            // Close existing dropdowns first
            closeAllDropdowns();
            
            const dropdown = createLanguageDropdown(button, currentLang);
            button.parentElement.appendChild(dropdown);
            
            // Handle language selection
            dropdown.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent closing dropdown immediately
                const option = e.target.closest('.language-option');
                if (!option) return;
                
                const newLang = option.dataset.lang;
                if (isSource) {
                    sourceLang = newLang;
                    sourceLangButton.firstChild.textContent = languages[newLang];
                } else {
                    targetLang = newLang;
                    targetLangButton.firstChild.textContent = languages[newLang];
                }
                
                closeAllDropdowns();
                if (sourceTextarea.value.trim()) {
                    translateText();
                }
            });
        });
    });

    // Add global click handler to close dropdowns
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.language-selector')) {
            closeAllDropdowns();
        }
    });

    // Metin çevirisi işlevi
    async function translateText() {
        const sourceText = sourceTextarea.value.trim();
        if (!sourceText) {
            targetTextarea.value = "";
            lastNormalTranslation = ""; // Son çeviriyi temizle
            return;
        }

        try {
            targetTextarea.value = 'Tarjima qilinmoqda...';
            targetTextarea.classList.add('translating');
            
            const result = await messageHandler.sendMessage({
                text: sourceText,
                sourceLang,
                targetLang,
                model: 'tilmoch'
            });

            if (result.error) {
                throw new Error(result.error);
            }

            const translation = modifyText(result.translation);
            targetTextarea.value = translation;
            lastNormalTranslation = translation; // Son normal çeviriyi kaydet
            
            // Normal çeviride geçmişi sıfırla ve butonları gizle
            translationHistory = [];
            currentHistoryIndex = -1;
            hideHistoryButtons();
            updateHistoryButtons();
        } catch (error) {
            console.error('Translation error:', error);
            targetTextarea.value = 'Tarjima vaqtida xatolik yuz berdi.\n' + error.message;
        } finally {
            targetTextarea.classList.remove('translating');
        }
    }

    // Add new function for text improvement
    async function improveText() {
        const sourceText = sourceTextarea.value.trim();
        if (!sourceText) {
            targetTextarea.value = "";
            return;
        }

        try {
            targetTextarea.value = 'Sayqallanmoqda...';
            targetTextarea.classList.add('translating');
            
            const result = await messageHandler.sendMessage({
                text: sourceText,
                sourceLang: targetLang,
                targetLang: targetLang,
                model: 'sayqalchi'
            });

            if (result.error) {
                throw new Error(result.error);
            }

            const translation = modifyText(result.translation);
            
            // İlk sayqallash işleminde, normal çeviriyi geçmişe ekle
            if (translationHistory.length === 0 && lastNormalTranslation) {
                addToHistory(lastNormalTranslation);
            }
            
            // Sayqallash sonucunu geçmişe ekle
            addToHistory(translation);
            targetTextarea.value = translation;
            showHistoryButtons(); // Sayqallash sonrası butonları göster
        } catch (error) {
            console.error('Improvement error:', error);
            targetTextarea.value = 'Sayqallash vaqtida xatolik yuz berdi.\n' + error.message;
        } finally {
            targetTextarea.classList.remove('translating');
        }
    }

    // Add smart quotes converter function
    function convertToSmartQuotes(text) {
        const parts = text.split('"');
        const replaced = [];
        
        for (let i = 0; i < parts.length; i++) {
            if (i === 0) {
                replaced.push(parts[i]);
            } else {
                const prevPart = parts[i-1];
                const isOpeningQuote = 
                    prevPart === "" || // Quote at start of text
                    /[.!?\n \t]$|[.!?][ \t\n]*$/.test(prevPart); // Quote after sentence ending or whitespace
                
                replaced.push((isOpeningQuote ? '\u201c' : '\u201d') + parts[i]);
            }
        }
        
        return replaced.join('');
    }

    // Update text modifier function to include smart quotes
    function modifyText(text) {
        return convertToSmartQuotes(text)
            .replace(/\u2018/g, '\u02bb') // Replace left single quotation mark
            .replace(/\u2019/g, '\u02bc'); // Replace right single quotation mark
    }

    // Add text modifier function
    function modifyApostrophes(text) {
        return text
            .replace(/\u2018/g, '\u02bb') // Replace left single quotation mark with modifier letter turned comma
            .replace(/\u2019/g, '\u02bc'); // Replace right single quotation mark with modifier letter apostrophe
    }

    // Event listeners
    swapButton.addEventListener('click', swapLanguages);
    sourceTextarea.addEventListener('input', debounce(translateText, 500));
    improveButton.addEventListener('click', improveText);

    // Add new event listener for character counting
    sourceTextarea.addEventListener('input', () => {
        updateCharCounter();
    });

    // Add copy button functionality
    const copyButton = document.querySelector('.copy-button');
    
    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(targetTextarea.value);
            
            // Change to checkmark icon temporarily
            const originalHTML = copyButton.innerHTML;
            copyButton.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            
            // Revert back to copy icon after 1.5 seconds
            setTimeout(() => {
                copyButton.innerHTML = originalHTML;
            }, 1500);
            
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });

    function updateCharCounter() {
        const currentLength = sourceTextarea.value.length;
        charCounter.textContent = `${currentLength} / ${MAX_CHARS}`;
        
        if (currentLength >= MAX_CHARS) {
            charCounter.classList.add('at-limit');
            charCounter.classList.remove('near-limit');
            sourceTextarea.value = sourceTextarea.value.slice(0, MAX_CHARS);
        } else if (currentLength >= MAX_CHARS * 0.9) {
            charCounter.classList.add('near-limit');
            charCounter.classList.remove('at-limit');
        } else {
            charCounter.classList.remove('near-limit', 'at-limit');
        }
    }
});

// Debounce yardımcı fonksiyonu
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}