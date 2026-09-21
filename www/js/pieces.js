const BASE_SHAPES = [
            // Pezzo O 2x2
            { matrix: [[1,1],[1,1]] },
            // Pezzo O 3x3 Grande
            { matrix: [
                [1,1,1],
                [1,1,1],
                [1,1,1]
            ] },
            // Pezzi I 4x1 Orizzontale & Verticale
            { matrix: [[1,1,1,1]] },
            { matrix: [[1],[1],[1],[1]] },
            // Pezzi I 5x1 Orizzontale & Verticale (Grandi)
            { matrix: [[1,1,1,1,1]] },
            { matrix: [[1],[1],[1],[1],[1]] },
            // Pezzi I 1x2, 1x3, 2x1, 3x1
            { matrix: [[1,1]] },
            { matrix: [[1,1,1]] },
            { matrix: [[1],[1]] },
            { matrix: [[1],[1],[1]] },
            // Pezzi L
            { matrix: [[1,0],[1,1]] },
            { matrix: [[0,1],[1,1]] },
            { matrix: [[1,1,1],[1,0,0]] },
            { matrix: [[1,1,1],[0,0,1]] },
            // Pezzi L 3x3 (Grandi: alto 3 e largo 3)
            { matrix: [
                [1,0,0],
                [1,0,0],
                [1,1,1]
            ] },
            { matrix: [
                [0,0,1],
                [0,0,1],
                [1,1,1]
            ] },
            { matrix: [
                [1,1,1],
                [1,0,0],
                [1,0,0]
            ] },
            { matrix: [
                [1,1,1],
                [0,0,1],
                [0,0,1]
            ] },
            // Pezzi J
            { matrix: [[1,1],[1,0]] },
            { matrix: [[1,1],[0,1]] },
            { matrix: [[1,0,0],[1,1,1]] },
            { matrix: [[0,0,1],[1,1,1]] },
            // Pezzi T
            { matrix: [[1,1,1],[0,1,0]] },
            { matrix: [[0,1,0],[1,1,1]] },
            { matrix: [[1,0],[1,1],[1,0]] },
            { matrix: [[0,1],[1,1],[0,1]] },
            // Pezzo S
            { matrix: [[0,1,1],[1,1,0]] },
            // Pezzo Z
            { matrix: [[1,1,0],[0,1,1]] }
        ];

        const SINGLE_DOT_SHAPE = { matrix: [[1]] };

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function initBoard() {
            userCoins = 0;
            updateCoinsDisplay();
            boardElement.innerHTML = '';
            boardState = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    boardElement.appendChild(cell);
                }
            }
            const vfxCanvas = document.createElement('canvas');
            vfxCanvas.id = 'vfx-canvas';
            boardElement.appendChild(vfxCanvas);

            particles = [];
            flashes = [];
            disintegrations = [];
            score = 0;
            linesEliminated = 0;
            skillDiscardActive = false;
            skillRotateActive = false;
            skillSingleActive = false;
            turnHasDragged = false;
            gameOver = false;
            if (typeof resetTurnSkills === 'function') resetTurnSkills();
            highScore = parseInt(localStorage.getItem('blockBlast3DHighScore8x8')) || 0;
            if(highScoreElement) highScoreElement.textContent = highScore;
            sessionStartHighScore = highScore;
            achievedNewRecord = false;
            hasTriggeredRecordScreen = false;
            updateScore(0);
            updateSkillUI();
            skillStatus.textContent = '';
            const goBestScoreText = document.getElementById('go-best-score-text');
            if (goBestScoreText) goBestScoreText.textContent = highScore;
            spawnPieces(true);
        }

        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function animateNumberValue(element, start, end, duration = 400) {
            if (!element) return;
            if (element._animFrameId) {
                cancelAnimationFrame(element._animFrameId);
            }

            let startVal;
            if (typeof start === 'number') {
                startVal = start;
            } else if (element._currentDisplayedValue !== undefined) {
                startVal = element._currentDisplayedValue;
            } else {
                startVal = parseInt(element.textContent) || 0;
            }

            if (startVal === end) {
                element.textContent = end;
                element._currentDisplayedValue = end;
                return;
            }

            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutCubic(progress);
                const currentVal = Math.round(startVal + (end - startVal) * easedProgress);

                element.textContent = currentVal;
                element._currentDisplayedValue = currentVal;

                if (progress < 1) {
                    element._animFrameId = requestAnimationFrame(update);
                } else {
                    element.textContent = end;
                    element._currentDisplayedValue = end;
                    element._animFrameId = null;
                }
            }

            element._animFrameId = requestAnimationFrame(update);
        }

        function updateCellGem(cell, colorObj, opacity = 1) {
            if (!cell) return;
            let gem = cell.querySelector('.block-cell');
            if (!gem) {
                gem = document.createElement('div');
                gem.className = 'block-cell';
                gem.innerHTML = '<div class="facet top"></div><div class="facet left"></div><div class="facet right"></div><div class="facet bottom"></div><div class="center-face"></div>';
                cell.appendChild(gem);
            }
            if (colorObj) {
                const shades = getGemShades(colorObj);
                gem.style.setProperty('--c-center', shades.center);
                gem.style.setProperty('--c-top', shades.top);
                gem.style.setProperty('--c-left', shades.left);
                gem.style.setProperty('--c-right', shades.right);
                gem.style.setProperty('--c-bottom', shades.bottom);
                gem.style.display = 'block';
                gem.style.opacity = opacity;
            } else {
                gem.style.display = 'none';
                gem.style.opacity = 1;
            }
        }

        function renderBoard() {
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    const cell = boardElement.children[r * BOARD_SIZE + c];
                    if (cell) {
                        const color = boardState[r][c];
                        cell.className = 'cell';
                        updateCellGem(cell, color, 1);
                    }
                }
            }
        }

        function animateTextScore(container, targetScore, duration = 400) {
            if (!container) return;
            let startScore = parseInt(container.textContent.replace(/,/g, '').replace(/\./g, '')) || 0;
            const scoreDiff = targetScore - startScore;
            if (scoreDiff === 0) {
                container.textContent = targetScore.toLocaleString();
                updateDigitScaling(container, targetScore, 3.6);
                return;
            }
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.round(startScore + (eased * scoreDiff));
                
                container.textContent = currentValue.toLocaleString();
                updateDigitScaling(container, currentValue, 3.6);
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    container.textContent = targetScore.toLocaleString();
                    updateDigitScaling(container, targetScore, 3.6);
                }
            }
            requestAnimationFrame(update);
        }

        function updateScore(points) {
            score += points;
            
            const currentScoreDisplay = document.getElementById('currentScoreDisplay') || scoreElement;
            if (currentScoreDisplay) {
                animateTextScore(currentScoreDisplay, score, 400);
            }

            if (score > sessionStartHighScore) {
                achievedNewRecord = true;
                highScore = score;
                localStorage.setItem('blockBlast3DHighScore8x8', highScore);
                
                const maxScoreDisplay = document.getElementById('maxScoreDisplay') || highScoreElement;
                if (maxScoreDisplay) {
                    maxScoreDisplay.textContent = highScore.toLocaleString();
                }
            }
        }

        function showHighScoreScreen() {
            const goScoreText = document.getElementById('go-score-text');
            if(goScoreText) animateNumberValue(goScoreText, 0, score, 800);

            if(gameOverScreen) {
                gameOverScreen.classList.add('new-high-score');
                gameOverScreen.classList.remove('visible');
                void gameOverScreen.offsetWidth;
                gameOverScreen.classList.add('visible');
            }

            setTimeout(() => {
                if(typeof shootConfetti === 'function') shootConfetti();
                else if(typeof spawnConfetti === 'function') spawnConfetti();
            }, 100);
        }

        function canPieceFit(grid, pieceMatrix) {
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (canPlace(pieceMatrix, r, c)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function isGridCritical(grid) {
            let filled = 0;
            const total = BOARD_SIZE * BOARD_SIZE;
            for (let r = 0; r < BOARD_SIZE; r++) {
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (grid[r][c] !== null) filled++;
                }
            }
            return (filled / total) > 0.75;
        }

        function getRandomPieceShape(isCritical = false) {
            let shapes;
            if (isCritical) {
                shapes = [
                    SINGLE_DOT_SHAPE,
                    { matrix: [[1,1]] },
                    { matrix: [[1],[1]] },
                    { matrix: [[1,1],[1,1]] }
                ];
            } else {
                shapes = [...BASE_SHAPES];
                if (typeof skillSingleActive !== 'undefined' && skillSingleActive) shapes.push(SINGLE_DOT_SHAPE);
            }
            const selected = shapes[Math.floor(Math.random() * shapes.length)];
            const colorList = Object.values(GEM_COLORS);
            const randomColor = colorList[Math.floor(Math.random() * colorList.length)];
            return {
                matrix: selected.matrix.map(row => [...row]),
                color: randomColor
            };
        }

        function generateThreePieces(currentGrid) {
            const pieces = [];
            const maxRerolls = 5;

            for (let i = 0; i < 3; i++) {
                let candidatePiece = getRandomPieceShape(false);
                let attempts = 0;

                while (!canPieceFit(currentGrid, candidatePiece.matrix) && attempts < maxRerolls) {
                    if (isGridCritical(currentGrid)) {
                        candidatePiece = getRandomPieceShape(true);
                    } else {
                        candidatePiece = getRandomPieceShape(false);
                    }
                    attempts++;
                }

                pieces.push(candidatePiece);
            }

            return pieces;
        }

        function getAvailableShapes() {
            let shapes = [...BASE_SHAPES];
            if (typeof skillSingleActive !== 'undefined' && skillSingleActive) shapes.push(SINGLE_DOT_SHAPE);
            return shapes;
        }

        function spawnPieces(all = false) {
            turnHasDragged = false;

            if (all || activePieces.length === 0) {
                hasPlacedPieceInTurn = false;
                if (typeof resetTurnSkills === 'function') resetTurnSkills();
                activePieces = [];
                const newPieces = generateThreePieces(boardState);
                for (let i = 0; i < 3; i++) {
                    const shape = newPieces[i];
                    createPieceElement(shape, i);
                    activePieces.push({ shape, slot: i, rotated: false });
                }
            }
            updateSkillUI();
            checkGameOver();
        }

        let lastFilledCount = -1;

        function updateSkillUI() {
            let dots = linesEliminated % 6;
            const filledCount = dots;

            const stepDuration = 0.90;
            const totalDuration = filledCount > 0 ? (filledCount * stepDuration) + 's' : '1.5s';
            const hasIncreased = filledCount !== lastFilledCount;
            lastFilledCount = filledCount;

            for (let i = 1; i <= 6; i++) {
                const blockImg = document.getElementById(`block-${i}`);
                if (blockImg) {
                    if (i <= filledCount) {
                        blockImg.src = 'assets/line_block_filled.png';
                        blockImg.style.setProperty('--wave-duration', totalDuration);
                        blockImg.style.setProperty('--wave-delay', ((i - 1) * stepDuration) + 's');
                        if (hasIncreased) {
                            blockImg.style.animation = 'none';
                            void blockImg.offsetWidth;
                            blockImg.style.animation = '';
                        }
                        blockImg.className = 'block green';
                    } else {
                        blockImg.src = 'assets/line_block_empty.png';
                        blockImg.style.removeProperty('--wave-duration');
                        blockImg.style.removeProperty('--wave-delay');
                        blockImg.style.animation = '';
                        blockImg.className = 'block blue';
                    }
                }
            }

            const displayCount = linesEliminated % 6;
            const linesClearedText = document.getElementById('linesClearedText');
            if (linesClearedText) {
                linesClearedText.textContent = `${displayCount}/6`;
            }

            if (skillStatus) {
                if (skillDiscardActive && !turnHasDragged) {
                    skillStatus.textContent = 'Cambiare Pezzo? (Tap)';
                } else if (skillRotateActive) {
                    skillStatus.textContent = 'Doppio Tap per Ruotare!';
                } else if (skillSingleActive) {
                    skillStatus.textContent = 'Punto Singolo Sbloccato!';
                } else {
                    skillStatus.textContent = '';
                }
            }
        }

        function grantSkill() {
            userCoins += 1;
            updateCoinsDisplay();

            const plusOneEl = document.getElementById('coinPlusOne');
            if (plusOneEl) {
                plusOneEl.classList.remove('show');
                void plusOneEl.offsetWidth;
                plusOneEl.classList.add('show');
            }

            const rand = Math.random();
            if (rand < 0.33 && !skillSingleActive) {
                skillSingleActive = true;
                if(skillStatus) skillStatus.textContent = 'Punto Singolo Sbloccato!';
            } else if (rand < 0.66) {
                skillRotateActive = true;
                if(skillStatus) skillStatus.textContent = 'Doppio Tap per Ruotare!';
            } else {
                skillDiscardActive = true;
                if(skillStatus) skillStatus.textContent = 'Cambiare Pezzo? (Tap)';
            }
            updateSkillUI();
        }

        function rotateMatrix(matrix) {
            const rows = matrix.length;
            const cols = matrix[0].length;
            let result = Array.from({length: cols}, () => Array(rows).fill(0));
            for(let r=0; r<rows; r++){
                for(let c=0; c<cols; c++){
                    result[c][rows - 1 - r] = matrix[r][c];
                }
            }
            return result;
        }

        