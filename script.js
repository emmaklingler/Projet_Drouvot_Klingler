let THEMES = {};

let currentMode       = 'learn';
let currentThemeKey   = 'animaux';
let difficulty        = 6;
let currentLanguage   = 'fr';        // 'fr' | 'en' | 'es' | 'de'

let gameScore         = 0;
let bestScore         = 0;
let lives             = 3;
let isGameOver        = false;

let currentWord       = null;
let currentGameCards  = [];

const synth           = window.speechSynthesis;
let voices            = [];
let selectedVoice     = null;

const learnModeBtn       = document.getElementById('learnMode');
const gameModeBtn        = document.getElementById('gameMode');
const learningSection    = document.getElementById('learning-section');
const gameSection        = document.getElementById('game-section');

const cardsContainer     = document.getElementById('cards-container');
const gameCardsContainer = document.getElementById('game-cards');

const playSoundBtn       = document.getElementById('playSound');
const scoreSpan          = document.getElementById('score');
const bestScoreSpan      = document.getElementById('bestScore');
const livesSpan          = document.getElementById('lives');
const feedbackDiv        = document.getElementById('feedback');

const themeSelect        = document.getElementById('themeSelect');
const difficultySelect   = document.getElementById('difficultySelect');
const languageSelect     = document.getElementById('languageSelect');

const voiceSelect        = document.getElementById('voiceSelect');
const rateSlider         = document.getElementById('rateSlider');
const rateValue          = document.getElementById('rateValue');
const supportMsg         = document.getElementById('supportMsg');

document.addEventListener('DOMContentLoaded', async () => {
    await loadVocabulary();
    loadUserSettings();
    checkSpeechSupport();
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
    loadBestScore();
    initializeApp();
    setupEventListeners();
});

async function loadVocabulary() {
    try {
        const response = await fetch('vocab.json');
        THEMES = await response.json();
    } catch (error) {
        console.error('Erreur lors du chargement du vocabulaire:', error);
    }
}

function initializeApp() {
    renderLearningCards();
    renderGameCards();
    updateScoreDisplay();
    updateLivesDisplay();
}

function loadUserSettings() {
    const savedTheme      = localStorage.getItem('vocabTheme');
    const savedDifficulty = localStorage.getItem('vocabDifficulty');
    const savedLanguage   = localStorage.getItem('vocabLang');

    if (savedTheme && THEMES[savedTheme]) {
        currentThemeKey = savedTheme;
        themeSelect.value = savedTheme;
    }

    if (savedDifficulty && ['4', '6', '8'].includes(savedDifficulty)) {
        difficulty = parseInt(savedDifficulty, 10);
        difficultySelect.value = savedDifficulty;
    }

    if (savedLanguage && ['fr', 'en', 'es', 'de'].includes(savedLanguage)) {
        currentLanguage = savedLanguage;
        languageSelect.value = savedLanguage;
    } else {
        currentLanguage = 'fr';
        languageSelect.value = 'fr';
    }
}

function checkSpeechSupport() {
    if ('speechSynthesis' in window) {
        supportMsg.textContent = 'Votre navigateur supporte la synthèse vocale.';
    } else {
        supportMsg.textContent = 'Votre navigateur ne supporte pas la synthèse vocale.';
    }
}

function initVoices() {
    voices = synth.getVoices() || [];
    voiceSelect.innerHTML = '';

    const savedVoiceName = localStorage.getItem('vocabVoice');

    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [défaut]' : ''}`;
        voiceSelect.appendChild(option);
    });

    let chosen = null;

    if (savedVoiceName) {
        chosen = voices.find(v => v.name === savedVoiceName) || null;
    }

    if (!chosen) {
        // on essaie de trouver une voix dans la langue courante
        const targetLang = getSpeechLangFor(currentLanguage);
        chosen = voices.find(v => v.lang === targetLang) ||
            voices.find(v => v.lang.startsWith(currentLanguage)) ||
            null;
    }

    selectedVoice = chosen || voices[0] || null;

    if (selectedVoice) {
        voiceSelect.value = selectedVoice.name;
    }
}

function loadBestScore() {
    const stored = localStorage.getItem('vocabBestScore');
    bestScore = stored ? parseInt(stored, 10) : 0;
    bestScoreSpan.textContent = `Record : ${bestScore}`;
}

function setupEventListeners() {
    learnModeBtn.addEventListener('click', () => switchMode('learn'));
    gameModeBtn.addEventListener('click', () => switchMode('game'));

    playSoundBtn.addEventListener('click', () => {
        if (currentWord) {
            const label = getWordForCurrentLanguage(currentWord);
            speakWord(label);
        }
    });

    themeSelect.addEventListener('change', () => {
        currentThemeKey = themeSelect.value;
        localStorage.setItem('vocabTheme', currentThemeKey);

        renderLearningCards();
        renderGameCards();
        if (currentMode === 'game') startNewGame();
    });

    difficultySelect.addEventListener('change', () => {
        difficulty = parseInt(difficultySelect.value, 10);
        localStorage.setItem('vocabDifficulty', difficultySelect.value);

        renderGameCards();
        if (currentMode === 'game') startNewGame();
    });

    languageSelect.addEventListener('change', () => {
        currentLanguage = languageSelect.value;
        localStorage.setItem('vocabLang', currentLanguage);

        // On relit l'interface dans la nouvelle langue
        renderLearningCards();
        renderGameCards();
    });

    voiceSelect.addEventListener('change', () => {
        selectedVoice = voices.find(v => v.name === voiceSelect.value);
        if (selectedVoice) {
            localStorage.setItem('vocabVoice', selectedVoice.name);
        }
    });

    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value;
    });
}

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    (mode === 'learn' ? learnModeBtn : gameModeBtn).classList.add('active');

    learningSection.style.display = (mode === 'learn') ? 'block' : 'none';
    gameSection.style.display     = (mode === 'game')  ? 'block' : 'none';

    if (mode === 'game') startNewGame();
}

function getCurrentVocabulary() {
    if (currentThemeKey === 'mix') {
        return [
            ...THEMES.animaux,
            ...THEMES.nourriture,
            ...THEMES.objets
        ];
    }
    return THEMES[currentThemeKey];
}

function getWordForCurrentLanguage(item) {
    if (item.translations && item.translations[currentLanguage]) {
        return item.translations[currentLanguage];
    }
    if (item.translations && item.translations.fr) {
        return item.translations.fr;
    }
    return item.name;
}

function renderLearningCards() {
    const vocab = getCurrentVocabulary();
    cardsContainer.innerHTML = '';

    vocab.forEach(item => {
        const card = createCard(item, () => {
            const label = getWordForCurrentLanguage(item);
            speakWord(label);
        });
        cardsContainer.appendChild(card);
    });
}

function renderGameCards() {
    const all = [...getCurrentVocabulary()];
    shuffleArray(all);
    currentGameCards = all.slice(0, Math.min(difficulty, all.length));

    gameCardsContainer.innerHTML = '';

    currentGameCards.forEach(item => {
        const card = createCard(item, (event) => handleGameCardClick(item, event.currentTarget));
        gameCardsContainer.appendChild(card);
    });
}

function createCard(item, clickHandler) {
    const card = document.createElement('div');
    card.className = 'card';

    const img = document.createElement('img');
    img.className = 'card-image-img';
    img.alt = item.name;
    img.src = item.imagePath;

    img.onerror = () => {
        img.remove();
        const fallback = document.createElement('div');
        fallback.textContent = 'Image manquante';
        fallback.style.color = 'red';
        card.appendChild(fallback);
    };

    const nameDiv = document.createElement('div');
    nameDiv.className = 'card-name';
    nameDiv.textContent = getWordForCurrentLanguage(item);

    card.appendChild(img);
    card.appendChild(nameDiv);

    card.addEventListener('click', clickHandler);

    return card;
}

function startNewGame() {
    gameScore  = 0;
    lives      = 3;
    isGameOver = false;

    updateScoreDisplay();
    updateLivesDisplay();
    clearFeedback();
    resetGameCardStyles();
    selectRandomWord();
}

function selectRandomWord() {
    if (!currentGameCards.length) return;
    const index = Math.floor(Math.random() * currentGameCards.length);
    currentWord = currentGameCards[index];
    resetGameCardStyles();

    const label = getWordForCurrentLanguage(currentWord);
    speakWord(label);
}

function handleGameCardClick(selectedItem, cardElement) {
    if (!currentWord || isGameOver) return;

    if (selectedItem.name === currentWord.name) {
        // Bonne réponse
        cardElement.classList.add('correct');
        gameScore++;
        updateScoreDisplay();
        showFeedback('Bonne réponse !', 'correct');
        speakText('Bonne réponse', 'fr-FR');

        setTimeout(() => {
            selectRandomWord();
        }, 1200);

    } else {
        // Mauvaise réponse  = perte de vie
        cardElement.classList.add('incorrect');
        lives--;
        updateLivesDisplay();
        showFeedback(`Raté ! Il reste ${lives} vie(s)`, 'incorrect');
        speakText('Essayez encore', 'fr-FR');

        if (lives <= 0) {
            gameOver();
            return;
        }

        setTimeout(() => {
            cardElement.classList.remove('incorrect');
        }, 700);
    }
}

function updateScoreDisplay() {
    scoreSpan.textContent = `Score : ${gameScore}`;
    if (gameScore > bestScore) {
        bestScore = gameScore;
        localStorage.setItem('vocabBestScore', bestScore.toString());
    }
    bestScoreSpan.textContent = `Record : ${bestScore}`;
}

function updateLivesDisplay() {
    livesSpan.textContent = `Vies : ${lives}`;
}

function gameOver() {
    isGameOver = true;

    feedbackDiv.className = '';
    feedbackDiv.classList.add('feedback-incorrect');
    feedbackDiv.innerHTML = `
        GAME OVER !<br>
        <button id="restartBtn">Rejouer</button>
    `;

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            startNewGame();
        });
    }

    speakText('Fin de la partie', 'fr-FR');
}

function resetGameCardStyles() {
    document.querySelectorAll('#game-cards .card').forEach(card => {
        card.classList.remove('correct', 'incorrect');
    });
}

function showFeedback(message, type) {
    feedbackDiv.textContent = message;
    feedbackDiv.className = '';
    if (type === 'correct') feedbackDiv.classList.add('feedback-correct');
    if (type === 'incorrect') feedbackDiv.classList.add('feedback-incorrect');
}

function clearFeedback() {
    feedbackDiv.textContent = '';
    feedbackDiv.className = '';
}

function speakWord(text) {
    const lang = getSpeechLangFor(currentLanguage);
    speakText(text, lang);
}

function speakText(text, lang) {
    if (!('speechSynthesis' in window)) return;

    if (synth.speaking) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = parseFloat(rateSlider.value);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    synth.speak(utterance);
}

function getSpeechLangFor(langCode) {
    switch (langCode) {
        case 'en': return 'en-US';
        case 'es': return 'es-ES';
        case 'de': return 'de-DE';
        default:   return 'fr-FR';
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
