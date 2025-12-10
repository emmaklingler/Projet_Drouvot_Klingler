// =======================
// Données : thèmes & mots
// =======================

const THEMES = {
    animaux: [
        { name: 'chat',       emoji: '🐱', audio: 'chat',       imageQuery: 'cat' },
        { name: 'chien',      emoji: '🐶', audio: 'chien',      imageQuery: 'dog' },
        { name: 'oiseau',     emoji: '🐦', audio: 'oiseau',     imageQuery: 'bird' },
        { name: 'poisson',    emoji: '🐟', audio: 'poisson',    imageQuery: 'fish' },
        { name: 'éléphant',   emoji: '🐘', audio: 'éléphant',   imageQuery: 'elephant' },
        { name: 'lion',       emoji: '🦁', audio: 'lion',       imageQuery: 'lion' },
        { name: 'papillon',   emoji: '🦋', audio: 'papillon',   imageQuery: 'butterfly' },
        { name: 'abeille',    emoji: '🐝', audio: 'abeille',    imageQuery: 'bee' }
    ],
    nourriture: [
        { name: 'pomme',      emoji: '🍎', audio: 'pomme',      imageQuery: 'apple fruit' },
        { name: 'banane',     emoji: '🍌', audio: 'banane',     imageQuery: 'banana' },
        { name: 'raisin',     emoji: '🍇', audio: 'raisin',     imageQuery: 'grapes' },
        { name: 'pizza',      emoji: '🍕', audio: 'pizza',      imageQuery: 'pizza' },
        { name: 'gâteau',     emoji: '🍰', audio: 'gâteau',     imageQuery: 'cake dessert' },
        { name: 'carotte',    emoji: '🥕', audio: 'carotte',    imageQuery: 'carrot' }
    ],
    objets: [
        { name: 'livre',      emoji: '📖', audio: 'livre',      imageQuery: 'book' },
        { name: 'ordinateur', emoji: '💻', audio: 'ordinateur', imageQuery: 'laptop computer' },
        { name: 'téléphone',  emoji: '📱', audio: 'téléphone',  imageQuery: 'smartphone' },
        { name: 'maison',     emoji: '🏠', audio: 'maison',     imageQuery: 'house' },
        { name: 'voiture',    emoji: '🚗', audio: 'voiture',    imageQuery: 'car' },
        { name: 'chaise',     emoji: '🪑', audio: 'chaise',     imageQuery: 'chair' }
    ]
};

// ===============
// Variables état
// ===============

let currentMode = 'learn';          // "learn" ou "game"
let currentThemeKey = 'animaux';    // clé dans THEMES
let difficulty = 6;                 // nombre de cartes dans le jeu
let useApiImages = false;           // emoji ou images API

let gameScore = 0;
let bestScore = 0;
let currentWord = null;             // objet vocab courant pour le jeu
let currentGameCards = [];          // sous-ensemble utilisé dans la grille de jeu

const synth = window.speechSynthesis;
let voices = [];
let selectedVoice = null;

// ==================
// Récup éléments DOM
// ==================

const learnModeBtn       = document.getElementById('learnMode');
const gameModeBtn        = document.getElementById('gameMode');
const learningSection    = document.getElementById('learning-section');
const gameSection        = document.getElementById('game-section');

const cardsContainer     = document.getElementById('cards-container');
const gameCardsContainer = document.getElementById('game-cards');

const playSoundBtn       = document.getElementById('playSound');
const scoreSpan          = document.getElementById('score');
const bestScoreSpan      = document.getElementById('bestScore');
const feedbackDiv        = document.getElementById('feedback');

const themeSelect        = document.getElementById('themeSelect');
const difficultySelect   = document.getElementById('difficultySelect');
const imageModeToggle    = document.getElementById('imageModeToggle');

const voiceSelect        = document.getElementById('voiceSelect');
const rateSlider         = document.getElementById('rateSlider');
const rateValue          = document.getElementById('rateValue');
const supportMsg         = document.getElementById('supportMsg');

// ===============
// Initialisation
// ===============

document.addEventListener('DOMContentLoaded', () => {
    checkSpeechSupport();
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;

    loadBestScore();
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    renderLearningCards();
    renderGameCards();
    updateScoreDisplay();
}

// ====================
// Support / Voix / API
// ====================

function checkSpeechSupport() {
    if ('speechSynthesis' in window) {
        supportMsg.textContent = '✅ Votre navigateur supporte la synthèse vocale.';
    } else {
        supportMsg.textContent = '❌ Désolé, votre navigateur ne supporte pas la synthèse vocale.';
    }
}

function initVoices() {
    voices = synth.getVoices() || [];
    voiceSelect.innerHTML = '';

    voices.forEach((voice) => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' [par défaut]' : ''}`;
        voiceSelect.appendChild(option);
    });

    // Voix FR par défaut si possible
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    selectedVoice = frVoice || voices[0] || null;
    if (selectedVoice) {
        voiceSelect.value = selectedVoice.name;
    }
}

function loadBestScore() {
    const stored = localStorage.getItem('vocabBestScore');
    bestScore = stored ? parseInt(stored, 10) : 0;
    bestScoreSpan.textContent = `Record : ${bestScore}`;
}

// ==========================
// Gestion des événements UI
// ==========================

function setupEventListeners() {
    learnModeBtn.addEventListener('click', () => switchMode('learn'));
    gameModeBtn.addEventListener('click', () => switchMode('game'));

    playSoundBtn.addEventListener('click', () => {
        if (currentWord) {
            speakWord(currentWord.audio);
        }
    });

    themeSelect.addEventListener('change', () => {
        currentThemeKey = themeSelect.value;
        renderLearningCards();
        renderGameCards();
        if (currentMode === 'game') {
            startNewGame();
        }
    });

    difficultySelect.addEventListener('change', () => {
        difficulty = parseInt(difficultySelect.value, 10);
        renderGameCards();
        if (currentMode === 'game') {
            startNewGame();
        }
    });

    imageModeToggle.addEventListener('change', () => {
        useApiImages = imageModeToggle.checked;
        renderLearningCards();
        renderGameCards();
    });

    voiceSelect.addEventListener('change', () => {
        const name = voiceSelect.value;
        const found = voices.find(v => v.name === name);
        if (found) selectedVoice = found;
    });

    rateSlider.addEventListener('input', () => {
        rateValue.textContent = rateSlider.value;
    });
}

// =================
// Changement modes
// =================

function switchMode(mode) {
    currentMode = mode;

    // Boutons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    (mode === 'learn' ? learnModeBtn : gameModeBtn).classList.add('active');

    // Sections
    learningSection.classList.toggle('active', mode === 'learn');
    gameSection.classList.toggle('active', mode === 'game');

    if (mode === 'game') {
        startNewGame();
    } else {
        clearFeedback();
    }
}

// ===================
// Rendu des cartes UI
// ===================

function getCurrentVocabulary() {
    if (currentThemeKey === 'mix') {
        // mix des 3 thèmes
        return [
            ...THEMES.animaux,
            ...THEMES.nourriture,
            ...THEMES.objets
        ];
    }
    return THEMES[currentThemeKey];
}

function renderLearningCards() {
    const vocab = getCurrentVocabulary();
    cardsContainer.innerHTML = '';

    vocab.forEach(item => {
        const card = createCard(item, () => speakWord(item.audio));
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

    // Image emoji ou image API
    let visualEl;
    if (useApiImages) {
        const img = document.createElement('img');
        img.className = 'card-image card-image-img';
        img.alt = item.name;
        img.src = buildImageUrl(item.imageQuery || item.name);

        img.onerror = () => {
            // fallback : emoji si l'image ne charge pas
            img.remove();
            const span = document.createElement('span');
            span.className = 'card-image card-image-emoji';
            span.textContent = item.emoji;
            card.insertBefore(span, card.firstChild);
        };

        visualEl = img;
    } else {
        const span = document.createElement('span');
        span.className = 'card-image card-image-emoji';
        span.textContent = item.emoji;
        visualEl = span;
    }

    const nameDiv = document.createElement('div');
    nameDiv.className = 'card-name';
    nameDiv.textContent = item.name;

    card.appendChild(visualEl);
    card.appendChild(nameDiv);

    card.addEventListener('click', clickHandler);

    return card;
}

function buildImageUrl(query) {
    // Simple API publique (sans clé) : Unsplash Source
    return `https://source.unsplash.com/160x160/?${encodeURIComponent(query)}`;
}

// ============
// Mode "Jeu"
// ============

function startNewGame() {
    gameScore = 0;
    updateScoreDisplay();
    clearFeedback();
    resetGameCardStyles();
    selectRandomWord();
}

function selectRandomWord() {
    if (!currentGameCards.length) return;
    const index = Math.floor(Math.random() * currentGameCards.length);
    currentWord = currentGameCards[index];
    clearFeedback();
    resetGameCardStyles();
    speakWord(currentWord.audio);
}

function handleGameCardClick(selectedItem, cardElement) {
    if (!currentWord) return;

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
        // Mauvaise réponse
        cardElement.classList.add('incorrect');
        showFeedback('Essayez encore !', 'incorrect');
        speakText('Essayez encore', 'fr-FR');

        setTimeout(() => {
            cardElement.classList.remove('incorrect');
        }, 800);
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

function resetGameCardStyles() {
    document.querySelectorAll('#game-cards .card').forEach(card => {
        card.classList.remove('correct', 'incorrect');
    });
}

function showFeedback(message, type) {
    feedbackDiv.textContent = message;
    feedbackDiv.className = '';
    if (type === 'correct') {
        feedbackDiv.classList.add('feedback-correct');
    } else if (type === 'incorrect') {
        feedbackDiv.classList.add('feedback-incorrect');
    }
}

function clearFeedback() {
    feedbackDiv.textContent = '';
    feedbackDiv.className = '';
}

// =====================
// Synthèse vocale
// =====================

function speakWord(word) {
    speakText(word, 'fr-FR');
}

function speakText(text, lang) {
    if (!('speechSynthesis' in window)) return;

    if (synth.speaking) {
        synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = parseFloat(rateSlider.value);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    synth.speak(utterance);
}

// =====================
// Helpers utilitaires
// =====================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
