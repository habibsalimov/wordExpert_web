document.addEventListener('DOMContentLoaded', () => {
    const messageHandler = new MessageHandler();
    const sourceTextarea = document.querySelector('.editor:first-child textarea');
    const targetTextarea = document.querySelector('.editor:last-child textarea');
    const swapButton = document.querySelector('.swap-button');
    const improveButton = document.querySelector('.improve-button');
    const sourceLangButton = document.querySelector('.language-selector:first-child .language-button');
    const targetLangButton = document.querySelector('.language-selector:last-child .language-button');

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
        if (!sourceText) return;

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

            targetTextarea.value = result.translation;
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
        if (!sourceText) return;

        try {
            targetTextarea.value = 'Sayqallanmoqda...';
            targetTextarea.classList.add('translating');
            
            const result = await messageHandler.sendMessage({
                text: sourceText,
                sourceLang,
                targetLang,
                model: 'sayqalchi'
            });

            if (result.error) {
                throw new Error(result.error);
            }

            targetTextarea.value = result.translation;
        } catch (error) {
            console.error('Improvement error:', error);
            targetTextarea.value = 'Sayqallash vaqtida xatolik yuz berdi.\n' + error.message;
        } finally {
            targetTextarea.classList.remove('translating');
        }
    }

    // Event listeners
    swapButton.addEventListener('click', swapLanguages);
    sourceTextarea.addEventListener('input', debounce(translateText, 500));
    improveButton.addEventListener('click', improveText);

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        Auth.logout();
    });
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