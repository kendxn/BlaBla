/**
 * Negozio Blast - Game UI Script
 * 
 * TODO / ARCHITETTURA DA IMPLEMENTARE PER IL BACKEND DI GIOCO:
 * 1. Lo SCORE (es. 15,740) diventerà dinamico e verrà aggiornato ad ogni blocco piazzato o riga eliminata,
 *    richiamando la funzione `addScore()`.
 * 2. Il MAX SCORE verrà aggiornato se il punteggio corrente supera il record storico, e verrà
 *    salvato (es. nel LocalStorage o sul server).
 * 3. L'eliminazione di righe o colonne chiamerà `addLinesCleared()`.
 *    - Ad ogni riga eliminata, un quadratino blu (vuoto) diventa verde (pieno).
 *    - Raggiunto il target (es. 6/6), il target viene scalato (es. a 12 -> 6/12) e la barra
 *      si resetta graficamente (i quadratini verdi tornano blu).
 * 4. Completare una barra attiverà un'animazione (+1) sopra la moneta per segnalare il guadagno
 *    tramite `showCoinAnimation()`.
 * 5. I bottoni SKILLS e SHOP sono attivi graficamente ma le loro modali o logiche interne 
 *    (es. spendere monete per abilità) devono essere ancora collegate al motore di gioco.
 */

(function () {
    'use strict';

    // ===== Configuration & State =====
    const SPRITE_SHEET_SRC = 'assets/btn_skills.png';
    let gameState = {
        maxScore: 48320,
        currentScore: 15740,
        linesCleared: 4,
        targetLines: 6,
        coins: 0
    };

    /**
     * Pre-crops all 10 digits from the sprite sheet into individual
     * data-URL images for crisp, direct <img> rendering.
     */
    function preloadDigits(spriteSheet, callback) {
        const digits = [];
        const digitWidth = spriteSheet.naturalWidth / 10;
        const digitHeight = spriteSheet.naturalHeight;

        for (let i = 0; i < 10; i++) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = digitWidth;
            canvas.height = digitHeight;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
                spriteSheet,
                i * digitWidth, 0,
                digitWidth, digitHeight,
                0, 0,
                digitWidth, digitHeight
            );
            digits.push(canvas.toDataURL('image/png'));
        }

        callback(digits);
    }

    /**
     * Animates score counting up with easing for images (Used for MAX SCORE).
     */
    function renderImageScore(container, digitDataURLs, score, commaClass) {
        container.innerHTML = '';
        const scoreStr = score.toString();

        for (let i = 0; i < scoreStr.length; i++) {
            if (i > 0 && (scoreStr.length - i) % 3 === 0) {
                const comma = document.createElement('span');
                comma.textContent = ',';
                comma.classList.add(commaClass);
                container.appendChild(comma);
            }

            const digit = parseInt(scoreStr[i]);
            const img = document.createElement('img');
            img.src = digitDataURLs[digit];
            img.alt = scoreStr[i];
            img.classList.add('digit-img');
            img.draggable = false;
            container.appendChild(img);
        }
    }

    function animateImageScore(container, digitDataURLs, targetScore, commaClass, duration) {
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(eased * targetScore);
            renderImageScore(container, digitDataURLs, currentValue, commaClass);
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    }

    /**
     * Animates score counting up with easing for text (Used for CURRENT SCORE).
     */
    function animateTextScore(container, targetScore, duration) {
        if (!container) return;
        if (targetScore >= 1000) {
            container.classList.add('long-score');
        } else {
            container.classList.remove('long-score');
        }
        let startScore = parseInt(container.textContent.replace(/,/g, '')) || 0;
        const scoreDiff = targetScore - startScore;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            const currentValue = Math.round(startScore + (eased * scoreDiff));
            
            if (currentValue >= 1000) {
                container.classList.add('long-score');
            } else {
                container.classList.remove('long-score');
            }

            container.textContent = currentValue.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                container.textContent = targetScore.toLocaleString();
            }
        }
        requestAnimationFrame(update);
    }

    // ===== GAME LOGIC EXPOSED FUNCTIONS (To be called by future backend) =====
    
    /**
     * Adds points to the current score and updates the UI.
     * If current score exceeds max score, max score is updated too.
     */
    window.addScore = function(points) {
        const currentScoreContainer = document.getElementById('currentScoreDisplay');
        gameState.currentScore += points;
        animateTextScore(currentScoreContainer, gameState.currentScore, 500);

        if (gameState.currentScore > gameState.maxScore) {
            gameState.maxScore = gameState.currentScore;
            // TODO: Aggiornare anche il MAX SCORE UI qui se necessario
        }
    };

    /**
     * Shows a "+1" animation floating up from the coin icon.
     */
    window.showCoinAnimation = function() {
        const plusOneEl = document.getElementById('coinPlusOne');
        if (plusOneEl) {
            // Rimuoviamo e reinseriamo la classe per ri-triggerare l'animazione CSS
            plusOneEl.classList.remove('show');
            void plusOneEl.offsetWidth; // Trigger reflow
            plusOneEl.classList.add('show');
        }
    };

    /**
     * Call this when lines or columns are cleared.
     * Updates the lines counter. If the target is reached, it resets the bar
     * and shows the coin animation.
     */
    window.addLinesCleared = function(linesCount) {
        gameState.linesCleared += linesCount;
        
        // Se abbiamo raggiunto o superato il target
        if (gameState.linesCleared >= gameState.targetLines) {
            // Aggiungiamo una moneta e mostriamo l'animazione +1
            gameState.coins += 1;
            window.showCoinAnimation();

            // Aumentiamo il target per il prossimo livello (es. 6 -> 12 -> 16)
            if (gameState.targetLines === 6) gameState.targetLines = 12;
            else if (gameState.targetLines === 12) gameState.targetLines = 16;
            else gameState.targetLines += 4; 
            
            // Aggiorniamo il testo
            document.getElementById('linesClearedText').textContent = `${gameState.linesCleared}/${gameState.targetLines}`;
            
            // Reset grafico dei quadratini verdi in blu
            document.querySelectorAll('.lines-blocks .block').forEach(block => {
                if (block.classList.contains('green')) {
                    block.classList.remove('green');
                    block.classList.add('blue');
                    block.src = 'assets/line_block_empty.png'; // Immagine quadratino blu
                }
            });
        } else {
            // TODO: Cambiare gradualmente un blocco blu in verde per ogni riga fatta
            document.getElementById('linesClearedText').textContent = `${gameState.linesCleared}/${gameState.targetLines}`;
        }
    };

    // ===== Initialize UI on Load =====
    function init() {
        const spriteSheet = new Image();
        spriteSheet.src = SPRITE_SHEET_SRC;

        const maxScoreContainer = document.getElementById('maxScoreDisplay');
        const currentScoreContainer = document.getElementById('currentScoreDisplay');

        // Always animate text score for current score
        setTimeout(function () {
            animateTextScore(currentScoreContainer, gameState.currentScore, 1000);
        }, 400);

        spriteSheet.onload = function () {
            preloadDigits(spriteSheet, function (digitDataURLs) {
                // Animate MAX SCORE with images
                animateImageScore(maxScoreContainer, digitDataURLs, gameState.maxScore, 'digit-comma', 1200);
            });
        };

        spriteSheet.onerror = function () {
            console.error('Failed to load digit sprite sheet:', SPRITE_SHEET_SRC);
            maxScoreContainer.textContent = gameState.maxScore.toLocaleString();
        };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
