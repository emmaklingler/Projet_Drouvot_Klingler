// Données de vocabulaire
const vocabulary = [
    { name: 'chat', emoji: '🐱', audio: 'chat' },
    { name: 'chien', emoji: '🐶', audio: 'chien' },
    { name: 'oiseau', emoji: '🐦', audio: 'oiseau' },
    { name: 'poisson', emoji: '🐟', audio: 'poisson' },
    { name: 'éléphant', emoji: '🐘', audio: 'éléphant' },
    { name: 'lion', emoji: '🦁', audio: 'lion' },
    { name: 'papillon', emoji: '🦋', audio: 'papillon' },
    { name: 'abeille', emoji: '🐝', audio: 'abeille' }
];

// Variables globales
let currentMode = 'learn';
let gameScore = 0;
let currentWord = null;
let speechSynthesis = window.speechSynthesis;

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    renderLearningCards();
    renderGameCards();
}

function setupEventListeners() {
    document.getElementById('learnMode').addEventListener('click', () => switchMode('learn'));
    document.getElementById('gameMode').addEventListener('click', () => switchMode('game'));
    document.getElementById('playSound').addEventListener('click', playCurrentWord);
}

function switchMode(mode) {
    currentMode = mode;
    
    // Mise à jour des boutons
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(mode + 'Mode').classList.add('active');
    
    // Mise à jour des sections
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(mode === 'learn' ? 'learning-section' : 'game-section').classList.add('active');
    
    if (mode === 'game') {
        startNewGame();
    }
}

function renderLearningCards() {
    const container = document.getElementById('cards-container');
    container.innerHTML = '';
    
    vocabulary.forEach(item => {
        const card = createCard(item, () => speakWord(item.audio));
        container.appendChild(card);
    });
}

function renderGameCards() {
    const container = document.getElementById('game-cards');
    container.innerHTML = '';
    
    vocabulary.forEach(item => {
        const card = createCard(item, () => handleGameCardClick(item));
        container.appendChild(card);
    });
}

function createCard(item, clickHandler) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <span class="card-image">${item.emoji}</span>
        <div class="card-name">${item.name}</div>
    `;
    card.addEventListener('click', clickHandler);
    return card;
}

function speakWord(word) {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
}

function startNewGame() {
    gameScore = 0;
    updateScore();
    clearFeedback();
    resetCardStyles();
    selectRandomWord();
}

function selectRandomWord() {
    currentWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    clearFeedback();
    resetCardStyles();
}

function playCurrentWord() {
    if (currentWord) {
        speakWord(currentWord.audio);
    }
}

function handleGameCardClick(selectedItem) {
    if (!currentWord) return;
    
    const cards = document.querySelectorAll('#game-cards .card');
    const clickedCard = event.currentTarget;
    
    if (selectedItem.name === currentWord.name) {
        // Bonne réponse
        clickedCard.classList.add('correct');
        gameScore++;
        updateScore();
        showFeedback('Bonne réponse !', 'correct');
        speakWord('Bonne réponse');
        
        setTimeout(() => {
            selectRandomWord();
        }, 2000);
    } else {
        // Mauvaise réponse
        clickedCard.classList.add('incorrect');
        showFeedback('Essayez encore !', 'incorrect');
        speakWord('Essayez encore');
        
        setTimeout(() => {
            clickedCard.classList.remove('incorrect');
        }, 1000);
    }
}

function updateScore() {
    document.getElementById('score').textContent = `Score: ${gameScore}`;
}

function showFeedback(message, type) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback-${type}`;
}

function clearFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.className = '';
}

function resetCardStyles() {
    document.querySelectorAll('#game-cards .card').forEach(card => {
        card.classList.remove('correct', 'incorrect');
    });
}