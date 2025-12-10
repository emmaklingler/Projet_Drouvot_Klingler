// ----------------------
// Données de vocabulaire
// ----------------------

const THEMES = {
    animals: [
        {
            id: "dog",
            emoji: "🐶",
            word: "dog",
            translationFr: "chien"
        },
        {
            id: "cat",
            emoji: "🐱",
            word: "cat",
            translationFr: "chat"
        },
        {
            id: "lion",
            emoji: "🦁",
            word: "lion",
            translationFr: "lion"
        },
        {
            id: "frog",
            emoji: "🐸",
            word: "frog",
            translationFr: "grenouille"
        }
    ],
    fruits: [
        {
            id: "apple",
            emoji: "🍎",
            word: "apple",
            translationFr: "pomme"
        },
        {
            id: "banana",
            emoji: "🍌",
            word: "banana",
            translationFr: "banane"
        },
        {
            id: "grapes",
            emoji: "🍇",
            word: "grapes",
            translationFr: "raisins"
        },
        {
            id: "strawberry",
            emoji: "🍓",
            word: "strawberry",
            translationFr: "fraise"
        }
    ],
    flags: [
        {
            id: "france",
            emoji: "🇫🇷",
            word: "France",
            translationFr: "France"
        },
        {
            id: "spain",
            emoji: "🇪🇸",
            word: "Spain",
            translationFr: "Espagne"
        },
        {
            id: "germany",
            emoji: "🇩🇪",
            word: "Germany",
            translationFr: "Allemagne"
        },
        {
            id: "uk",
            emoji: "🇬🇧",
            word: "United Kingdom",
            translationFr: "Royaume-Uni"
        }
    ]
};

// ----------------------
// Sélecteurs DOM
// ----------------------

const modeSelect = document.getElementById("mode-select");
const themeSelect = document.getElementById("theme-select");
const voiceSelect = document.getElementById("voice-select");

const supportMsg = document.getElementById("support-msg");
const cardsGrid = document.getElementById("cards-grid");
const messageBox = document.getElementById("system-message");

const volumeSlider = document.getElementById("volume-slider");
const rateSlider = document.getElementById("rate-slider");
const pitchSlider = document.getElementById("pitch-slider");

const scoreValue = document.getElementById("score-value");
const streakValue = document.getElementById("streak-value");

// ----------------------
// État de l'application
// ----------------------

let currentMode = "learn";
let currentTheme = "animals";
let voices = [];
let currentAnswerId = null;
let score = 0;
let streak = 0;

// ----------------------
// Initialisation
// ----------------------

window.addEventListener("DOMContentLoaded", () => {
    checkSupport();
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;

    buildCards();
    attachUIEvents();

    updateMessage("Clique sur une carte pour écouter le mot.");
});

// Vérifier support de Speech Synthesis
function checkSupport() {
    if ("speechSynthesis" in window) {
        supportMsg.textContent = "✅ Votre navigateur supporte la synthèse vocale.";
    } else {
        supportMsg.textContent =
            "❌ Désolé, votre navigateur ne supporte pas la synthèse vocale.";
    }
}

// Charger la liste des voix
function initVoices() {
    voices = window.speechSynthesis.getVoices() || [];
    voiceSelect.innerHTML = "";

    voices.forEach((voice) => {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})${voice.default ? " [def.]" : ""}`;
        voiceSelect.appendChild(option);
    });
}

// ----------------------
// Construction des cartes
// ----------------------

function buildCards() {
    cardsGrid.innerHTML = "";
    const items = THEMES[currentTheme];

    items.forEach((item) => {
        const card = document.createElement("article");
        card.className = "card";
        card.dataset.id = item.id;

        const emojiEl = document.createElement("div");
        emojiEl.className = "card-emoji";
        emojiEl.textContent = item.emoji;

        const labelEl = document.createElement("div");
        labelEl.className = "card-label";
        labelEl.textContent = item.word;

        const subtitleEl = document.createElement("div");
        subtitleEl.className = "card-subtitle";
        subtitleEl.textContent = `FR : ${item.translationFr}`;

        card.appendChild(emojiEl);
        card.appendChild(labelEl);
        card.appendChild(subtitleEl);

        card.addEventListener("click", () => handleCardClick(item));

        cardsGrid.appendChild(card);
    });
}

// ----------------------
// Évènements UI
// ----------------------

function attachUIEvents() {
    modeSelect.addEventListener("change", () => {
        currentMode = modeSelect.value;
        resetCardStates();

        if (currentMode === "learn") {
            currentAnswerId = null;
            updateMessage("Mode Apprentissage : clique sur une carte pour écouter le mot.");
        } else {
            updateMessage("Mode Quiz : écoute et clique sur la bonne carte.");
            startQuizRound();
        }
    });

    themeSelect.addEventListener("change", () => {
        currentTheme = themeSelect.value;
        resetCardStates();
        buildCards();

        if (currentMode === "quiz") {
            startQuizRound();
        } else {
            updateMessage(
                "Nouveau thème sélectionné. Clique sur une carte pour écouter le mot."
            );
        }
    });
}

// ----------------------
// Gestion des cartes
// ----------------------

function handleCardClick(item) {
    if (currentMode === "learn") {
        speakWord(item);
    } else if (currentMode === "quiz") {
        checkQuizAnswer(item);
    }
}

// Mode apprentissage : prononcer le mot
function speakWord(item) {
    const word = item.word;
    speak(word, "en-US");
    updateMessage(`Tu écoutes le mot : "${word}". Répète-le à voix haute.`);
}

// Mode quiz : nouvelle manche
function startQuizRound() {
    const items = THEMES[currentTheme];
    if (!items || items.length === 0) return;

    const random = items[Math.floor(Math.random() * items.length)];
    currentAnswerId = random.id;

    const targetWord = random.word;
    speak(targetWord, "en-US");

    updateMessage("Quiz : écoute le mot et clique sur la carte correspondante.");
    resetCardStates();
}

// Vérification réponse quiz
function checkQuizAnswer(item) {
    if (!currentAnswerId) return;

    const clickedId = item.id;
    const cards = document.querySelectorAll(".card");

    if (clickedId === currentAnswerId) {
        score++;
        streak++;
        scoreValue.textContent = score;
        streakValue.textContent = streak;

        const word = item.word;
        updateMessage(`Bonne réponse ! C'était "${word}".`);
        speak("Bonne réponse !", "fr-FR");

        cards.forEach((card) => {
            if (card.dataset.id === clickedId) {
                card.classList.add("correct");
            }
        });

        // On lance un nouveau mot
        setTimeout(() => {
            resetCardStates();
            startQuizRound();
        }, 900);
    } else {
        // Mauvaise réponse = une autre chance, on ne change pas de mot
        streak = 0;
        streakValue.textContent = streak;

        updateMessage("Mauvaise carte, essaie encore.");
        speak("Ce n'est pas la bonne carte, essaie encore.", "fr-FR");

        cards.forEach((card) => {
            if (card.dataset.id === clickedId) {
                card.classList.add("wrong");
                setTimeout(() => card.classList.remove("wrong"), 300);
            }
        });
    }
}

// ----------------------
// Synthèse vocale
// ----------------------

function speak(text, lang) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance();
    msg.text = text;
    msg.lang = lang;

    msg.volume = parseFloat(volumeSlider.value);
    msg.rate = parseFloat(rateSlider.value);
    msg.pitch = parseFloat(pitchSlider.value);

    if (voiceSelect.value) {
        const selected = voices.find((v) => v.name === voiceSelect.value);
        if (selected) {
            msg.voice = selected;
        }
    }

    msg.onstart = () => {
        console.log("Synthèse en cours pour :", text);
    };

    msg.onend = () => {
        console.log("Synthèse terminée pour :", text);
    };

    window.speechSynthesis.speak(msg);
}

// ----------------------
// Helpers UI
// ----------------------

function updateMessage(msg) {
    messageBox.textContent = msg;
}

function resetCardStates() {
    document.querySelectorAll(".card").forEach((card) => {
        card.classList.remove("correct", "wrong");
    });
}
