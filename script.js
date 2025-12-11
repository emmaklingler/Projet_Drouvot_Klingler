// =======================
// Données : thèmes & mots
// =======================

const THEMES = {
    animaux: [
        { name: 'chat', audio: 'chat', imagePath: 'assets/img/chat.jpg' },
        { name: 'chien', audio: 'chien', imagePath: 'assets/img/chien.jpg' },
        { name: 'oiseau', audio: 'oiseau', imagePath: 'assets/img/oiseau.jpg' },
        { name: 'poisson', audio: 'poisson', imagePath: 'assets/img/poisson.jpg' },
        { name: 'éléphant', audio: 'éléphant', imagePath: 'assets/img/elephant.jpg' },
        { name: 'lion', audio: 'lion', imagePath: 'assets/img/lion.jpg' },
        { name: 'papillon', audio: 'papillon', imagePath: 'assets/img/papillon.jpg' },
        { name: 'abeille', audio: 'abeille', imagePath: 'assets/img/abeille.jpg' }
    ],

    nourriture: [
        { name: 'pomme', audio: 'pomme', imagePath: 'assets/img/pomme.jpg' },
        { name: 'banane', audio: 'banane', imagePath: 'assets/img/banane.jpg' },
        { name: 'raisin', audio: 'raisin', imagePath: 'assets/img/raisin.jpg' },
        { name: 'pizza', audio: 'pizza', imagePath: 'assets/img/pizza.jpg' },
        { name: 'gâteau', audio: 'gâteau', imagePath: 'assets/img/gateau.jpg' },
        { name: 'carotte', audio: 'carotte', imagePath: 'assets/img/carotte.jpg' }
    ],

    objets: [
        { name: 'livre', audio: 'livre', imagePath: 'assets/img/livre.jpg' },
        { name: 'ordinateur', audio: 'ordinateur', imagePath: 'assets/img/ordinateur.jpg' },
        { name: 'téléphone', audio: 'téléphone', imagePath: 'assets/img/telephone.jpg' },
        { name: 'maison', audio: 'maison', imagePath: 'assets/img/maison.jpg' },
        { name: 'voiture', audio: 'voiture', imagePath: 'assets/img/voiture.jpg' },
        { name: 'chaise', audio: 'chaise', imagePath: 'assets/img/chaise.jpg' }
    ]
};

// ===============
// Variables état
// ===============

let currentMode = 'learn';
let currentThemeKey = 'animaux';
let difficulty = 6;

let gameScore = 0;
let bestScore = 0;
let currentWord = null;
let currentGameCards = [];

let lives = 3;
let isGameOver = false;

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
const livesSpan          = document.getElementById('lives');
const feedbackDiv        = document.getElementById('feedback');

const themeSelect        = document.getElementById('themeSelect');
const difficultySelect   = document.getElementById('difficultySelect');

const voiceSelect        = document.getElementById('voiceSelect');
const rateSlider         = document.getElementById('rateSlider');
const rateValue          = document.getElementById('rateValue');
const supportMsg         = document.getElementById('supportMsg');

// ===============
// Initialisation
// ===============

document.addEventListener('DOMContentLoaded', () => {
    // Charge les préférences utilisateur (thème, difficulté)
    loadUserSettings();

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
    updateLivesDisplay();
}

// ====================
// Sauvegarde simple
// ====================

function loadUserSettings() {
    const savedTheme = localStorage.getItem('vocabTheme');
    const savedDifficulty = localStorage.getItem('vocabDifficulty');

    if (savedTheme && THEMES[savedTheme]) {
        currentThemeKey = savedTheme;
        themeSelect.value = savedTheme;
    }

    if (savedDifficulty && ['4', '6', '8'].includes(savedDifficulty)) {
        difficulty = parseInt(savedDifficulty, 10);
        difficultySelect.value = savedDifficulty;
    }
}

// ====================
// Support / Voix
// ====================

function checkSpeechSupport() {
    if ('speechSynthesis' in window) {
        supportMsg.textContent = ' Votre navigateur supporte la synthèse vocale.';
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

    // 1) Si une voix sauvegardée existe encore, on la reprend
    if (savedVoiceName) {
        chosen = voices.find(v => v.name === savedVoiceName) || null;
    }

    // 2) Sinon on essaye une voix FR
    if (!chosen) {
        chosen = voices.find(v => v.lang.startsWith('fr')) || null;
    }

    // 3) Sinon première voix dispo
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

// ==========================
// Gestion des événements UI
// ==========================

function setupEventListeners() {
    learnModeBtn.addEventListener('click', () => switchMode('learn'));
    gameModeBtn.addEventListener('click', () => switchMode('game'));

    playSoundBtn.addEventListener('click', () => {
        if (currentWord) speakWord(currentWord.audio);
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

// =================
// Changement modes
// =================

function switchMode(mode) {
    currentMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    (mode === 'learn' ? learnModeBtn : gameModeBtn).classList.add('active');

    // On garde ton système "une page à la fois"
    learningSection.style.display = (mode === 'learn') ? 'block' : 'none';
    gameSection.style.display = (mode === 'game') ? 'block' : 'none';

    if (mode === 'game') startNewGame();
}

// ===================
// Rendu des cartes UI
// ===================

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

    const img = document.createElement('img');
    img.className = 'card-image-img';
    img.alt = item.name;
    img.src = item.imagePath;

    img.onerror = () => {
        img.remove();
        const fallback = document.createElement('div');
        fallback.textContent = "Image manquante";
        fallback.style.color = "red";
        card.appendChild(fallback);
    };

    const nameDiv = document.createElement('div');
    nameDiv.className = 'card-name';
    nameDiv.textContent = item.name;

    card.appendChild(img);
    card.appendChild(nameDiv);

    card.addEventListener('click', clickHandler);

    return card;
}

// ============
// Mode "Jeu"
// ============

function startNewGame() {
    gameScore = 0;
    lives = 3;
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
    speakWord(currentWord.audio);
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
        // Mauvaise réponse → perte de vie
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

    speakText("Fin de la partie", "fr-FR");
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

// =====================
// Synthèse vocale
// =====================

function speakWord(word) {
    speakText(word, 'fr-FR');
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

// =====================
// Helpers utilitaires
// =====================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
