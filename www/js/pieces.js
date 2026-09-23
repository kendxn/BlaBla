// =========================================================================
// SHAPE GENERATION SYSTEM (Pre-calculated Shapes & 4 Pools)
// =========================================================================

function coordsToMatrix(coords) {
    let maxR = 0, maxC = 0;
    for (let i = 0; i < coords.length; i++) {
        if (coords[i][0] > maxR) maxR = coords[i][0];
        if (coords[i][1] > maxC) maxC = coords[i][1];
    }
    const matrix = Array.from({ length: maxR + 1 }, () => Array(maxC + 1).fill(0));
    for (let i = 0; i < coords.length; i++) {
        matrix[coords[i][0]][coords[i][1]] = 1;
    }
    return matrix;
}

const RAW_SHAPE_DEFINITIONS = [
    // --- MICRO (1-2 blocks & 2x2) ---
    { id: 'dot_1x1', category: 'micro', coords: [[0, 0]] },
    { id: 'domino_h', category: 'micro', coords: [[0, 0], [0, 1]] },
    { id: 'domino_v', category: 'micro', coords: [[0, 0], [1, 0]] },
    { id: 'box_2x2', category: 'micro', coords: [[0, 0], [0, 1], [1, 0], [1, 1]] },

    // --- LINE (3-5 blocks horizontal/vertical) ---
    { id: 'trio_h', category: 'line', coords: [[0, 0], [0, 1], [0, 2]] },
    { id: 'trio_v', category: 'line', coords: [[0, 0], [1, 0], [2, 0]] },
    { id: 'line_h_4', category: 'line', coords: [[0, 0], [0, 1], [0, 2], [0, 3]] },
    { id: 'line_v_4', category: 'line', coords: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { id: 'line_h_5', category: 'line', coords: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
    { id: 'line_v_5', category: 'line', coords: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },

    // --- L / T (3-5 blocks) ---
    { id: 'corner_2x2_1', category: 'lt', coords: [[0, 0], [1, 0], [1, 1]] },
    { id: 'corner_2x2_2', category: 'lt', coords: [[0, 1], [1, 0], [1, 1]] },
    { id: 'corner_2x2_3', category: 'lt', coords: [[0, 0], [0, 1], [1, 0]] },
    { id: 'corner_2x2_4', category: 'lt', coords: [[0, 0], [0, 1], [1, 1]] },
    { id: 'l_3x3_1', category: 'lt', coords: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
    { id: 'l_3x3_2', category: 'lt', coords: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]] },
    { id: 'l_3x3_3', category: 'lt', coords: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]] },
    { id: 'l_3x3_4', category: 'lt', coords: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]] },
    { id: 'j_2x3_1', category: 'lt', coords: [[1, 0], [1, 1], [1, 2], [0, 0]] },
    { id: 'j_2x3_2', category: 'lt', coords: [[1, 0], [1, 1], [1, 2], [0, 2]] },
    { id: 'j_2x3_3', category: 'lt', coords: [[0, 0], [0, 1], [0, 2], [1, 0]] },
    { id: 'j_2x3_4', category: 'lt', coords: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    { id: 't_3x2_up', category: 'lt', coords: [[0, 1], [1, 0], [1, 1], [1, 2]] },
    { id: 't_3x2_down', category: 'lt', coords: [[0, 0], [0, 1], [0, 2], [1, 1]] },
    { id: 't_2x3_left', category: 'lt', coords: [[0, 1], [1, 0], [1, 1], [2, 1]] },
    { id: 't_2x3_right', category: 'lt', coords: [[0, 0], [1, 0], [1, 1], [2, 0]] },
    { id: 's_shape', category: 'lt', coords: [[0, 1], [0, 2], [1, 0], [1, 1]] },
    { id: 'z_shape', category: 'lt', coords: [[0, 0], [0, 1], [1, 1], [1, 2]] },

    // --- MASSIVE (3x3 solid box, U-shapes, Big Cross) ---
    { id: 'box_3x3', category: 'massive', coords: [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]] },
    { id: 'u_shape_up', category: 'massive', coords: [[0,0],[0,2],[1,0],[1,1],[1,2]] },
    { id: 'u_shape_down', category: 'massive', coords: [[0,0],[0,1],[0,2],[1,0],[1,2]] },
    { id: 'u_shape_left', category: 'massive', coords: [[0,0],[0,1],[1,0],[2,0],[2,1]] },
    { id: 'u_shape_right', category: 'massive', coords: [[0,0],[0,1],[1,1],[2,0],[2,1]] },
    { id: 'big_cross', category: 'massive', coords: [[0,1],[1,0],[1,1],[1,2],[2,1]] }
];

const ALL_PRECALCULATED_SHAPES = RAW_SHAPE_DEFINITIONS.map(def => ({
    ...def,
    matrix: coordsToMatrix(def.coords)
}));

const SHAPE_POOLS = {
    micro: ALL_PRECALCULATED_SHAPES.filter(s => s.category === 'micro'),
    line: ALL_PRECALCULATED_SHAPES.filter(s => s.category === 'line'),
    lt: ALL_PRECALCULATED_SHAPES.filter(s => s.category === 'lt'),
    massive: ALL_PRECALCULATED_SHAPES.filter(s => s.category === 'massive')
};

const BASE_SHAPES = ALL_PRECALCULATED_SHAPES;
const SINGLE_DOT_SHAPE = SHAPE_POOLS.micro.find(s => s.id === 'dot_1x1');

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
            comboCount = 1;
            comboTolerance = 0;
            comboLevel = 1;
            consecutiveClears = 0;
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
                updateDigitScaling(container, targetScore, 4.32);
                return;
            }
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.round(startScore + (eased * scoreDiff));
                
                container.textContent = currentValue.toLocaleString();
                updateDigitScaling(container, currentValue, 4.32);
                
                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    container.textContent = targetScore.toLocaleString();
                    updateDigitScaling(container, targetScore, 4.32);
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

function canPlaceShapeOnBoard(board, shape, startRow, startCol) {
    const coords = shape.coords;
    const len = coords.length;
    
    if (board instanceof Uint8Array || (Array.isArray(board) && board.length === 64)) {
        for (let i = 0; i < len; i++) {
            const r = startRow + coords[i][0];
            const c = startCol + coords[i][1];
            if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
            if (board[(r << 3) + c] !== 0) return false;
        }
    } else {
        for (let i = 0; i < len; i++) {
            const r = startRow + coords[i][0];
            const c = startCol + coords[i][1];
            if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
            if (board[r][c] !== null && board[r][c] !== 0) return false;
        }
    }
    return true;
}

function isShapePlaceable(board, shape) {
    const coords = shape.coords;
    let maxR = 0, maxC = 0;
    for (let i = 0; i < coords.length; i++) {
        if (coords[i][0] > maxR) maxR = coords[i][0];
        if (coords[i][1] > maxC) maxC = coords[i][1];
    }
    const limitR = 8 - maxR;
    const limitC = 8 - maxC;
    
    for (let r = 0; r < limitR; r++) {
        for (let c = 0; c < limitC; c++) {
            if (canPlaceShapeOnBoard(board, shape, r, c)) {
                return true;
            }
        }
    }
    return false;
}

function canPieceFit(grid, pieceMatrix) {
    const shape = {
        coords: []
    };
    for (let r = 0; r < pieceMatrix.length; r++) {
        for (let c = 0; c < pieceMatrix[r].length; c++) {
            if (pieceMatrix[r][c]) shape.coords.push([r, c]);
        }
    }
    return isShapePlaceable(grid, shape);
}

function getBoardDensity(board) {
    let occupied = 0;
    if (board instanceof Uint8Array || (Array.isArray(board) && board.length === 64)) {
        for (let i = 0; i < 64; i++) {
            if (board[i] !== 0) occupied++;
        }
    } else {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] !== null && board[r][c] !== 0) occupied++;
            }
        }
    }
    return occupied / 64;
}

function pickWeightedCategory(weights) {
    const totalWeight = weights.micro + weights.line + weights.lt + weights.massive;
    let rand = Math.random() * totalWeight;
    if (rand < weights.micro) return 'micro';
    rand -= weights.micro;
    if (rand < weights.line) return 'line';
    rand -= weights.line;
    if (rand < weights.lt) return 'lt';
    return 'massive';
}

function getRandomShapeFromCategory(category, currentScore = 0, boardDensity = 0) {
    let pool = SHAPE_POOLS[category] || ALL_PRECALCULATED_SHAPES;
    
    if (currentScore > 1000 && boardDensity < 0.8) {
        const filtered = pool.filter(s => s.id !== 'dot_1x1');
        if (filtered.length > 0) pool = filtered;
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
}

function getNearCompleteLinesInfo(board) {
    const rowCounts = new Array(8).fill(0);
    const colCounts = new Array(8).fill(0);

    if (board instanceof Uint8Array || (Array.isArray(board) && board.length === 64)) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[(r << 3) + c] !== 0) {
                    rowCounts[r]++;
                    colCounts[c]++;
                }
            }
        }
    } else {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (board[r][c] !== null && board[r][c] !== 0) {
                    rowCounts[r]++;
                    colCounts[c]++;
                }
            }
        }
    }

    return { rowCounts, colCounts };
}

function shapeCompletesLineAt(board, shape, startRow, startCol, lineInfo) {
    const coords = shape.coords;
    const len = coords.length;
    
    const tempRows = lineInfo.rowCounts.slice();
    const tempCols = lineInfo.colCounts.slice();

    for (let i = 0; i < len; i++) {
        const r = startRow + coords[i][0];
        const c = startCol + coords[i][1];
        tempRows[r]++;
        tempCols[c]++;
    }

    for (let r = 0; r < 8; r++) {
        if (lineInfo.rowCounts[r] < 8 && tempRows[r] === 8) return true;
    }
    for (let c = 0; c < 8; c++) {
        if (lineInfo.colCounts[c] < 8 && tempCols[c] === 8) return true;
    }

    return false;
}

function getFavorableLineClearingShapes(board) {
    const lineInfo = getNearCompleteLinesInfo(board);
    
    let hasNearCompleteLines = false;
    for (let i = 0; i < 8; i++) {
        if (lineInfo.rowCounts[i] >= 5 || lineInfo.colCounts[i] >= 5) {
            hasNearCompleteLines = true;
            break;
        }
    }
    
    if (!hasNearCompleteLines) return [];

    const clearingShapes = [];
    for (let i = 0; i < ALL_PRECALCULATED_SHAPES.length; i++) {
        const shape = ALL_PRECALCULATED_SHAPES[i];
        const coords = shape.coords;
        let maxR = 0, maxC = 0;
        for (let j = 0; j < coords.length; j++) {
            if (coords[j][0] > maxR) maxR = coords[j][0];
            if (coords[j][1] > maxC) maxC = coords[j][1];
        }
        const limitR = 8 - maxR;
        const limitC = 8 - maxC;

        let completes = false;
        for (let r = 0; r < limitR; r++) {
            for (let c = 0; c < limitC; c++) {
                if (canPlaceShapeOnBoard(board, shape, r, c)) {
                    if (shapeCompletesLineAt(board, shape, r, c, lineInfo)) {
                        completes = true;
                        break;
                    }
                }
            }
            if (completes) break;
        }

        if (completes) {
            clearingShapes.push(shape);
        }
    }

    return clearingShapes;
}

function generateNextThreeShapes(board, currentScore = 0) {
    const result = [];
    const density = getBoardDensity(board);
    const favorableClearingShapes = getFavorableLineClearingShapes(board);

    // --- REGOLE BOARD VUOTA (DENSITÀ BASSA) ---
    let allowedPool = ALL_PRECALCULATED_SHAPES;
    if (density < 0.25) {
        // Board molto vuota: Escludi pezzi micro, fai uscire solo pezzi grandi!
        allowedPool = ALL_PRECALCULATED_SHAPES.filter(s => s.category !== 'micro');
    }

    // --- SELEZIONE PEZZI FAVOREVOLI PER ELIMINARE RIGHE ---
    let favorableTargetShape = null;
    if (favorableClearingShapes.length > 0) {
        favorableTargetShape = favorableClearingShapes[Math.floor(Math.random() * favorableClearingShapes.length)];
    }

    // --- SLOT 1: Survival & Favorable Line Clear ---
    const placeableShapes = allowedPool.filter(s => isShapePlaceable(board, s));
    let slot1Shape;

    if (favorableTargetShape && isShapePlaceable(board, favorableTargetShape)) {
        slot1Shape = favorableTargetShape;
    } else if (placeableShapes.length > 0) {
        slot1Shape = placeableShapes[Math.floor(Math.random() * placeableShapes.length)];
    } else {
        const allPlaceable = ALL_PRECALCULATED_SHAPES.filter(s => isShapePlaceable(board, s));
        slot1Shape = allPlaceable.length > 0 ? allPlaceable[Math.floor(Math.random() * allPlaceable.length)] : SHAPE_POOLS.micro[0];
    }
    result.push(slot1Shape);

    // --- SLOT 2: Dynamic Difficulty Weights ---
    let slot2Weights;
    if (density < 0.25) {
        // Board vuota: Pezzi grandi (Massicci, Linee lunghe, L/T)
        slot2Weights = { micro: 0, line: 45, lt: 25, massive: 30 };
    } else if (density < 0.45) {
        slot2Weights = { micro: 5, line: 40, lt: 30, massive: 25 };
    } else if (density > 0.75) {
        // Board molto piena: Micro di salvataggio
        slot2Weights = { micro: 45, line: 20, lt: 25, massive: 10 };
    } else {
        slot2Weights = { micro: 15, line: 30, lt: 35, massive: 20 };
    }

    let slot2Shape = null;
    if (favorableClearingShapes.length > 1) {
        const unusedFavorable = favorableClearingShapes.filter(s => s.id !== slot1Shape.id && isShapePlaceable(board, s));
        if (unusedFavorable.length > 0 && Math.random() < 0.8) {
            slot2Shape = unusedFavorable[Math.floor(Math.random() * unusedFavorable.length)];
        }
    }

    if (!slot2Shape) {
        const slot2Category = pickWeightedCategory(slot2Weights);
        slot2Shape = getRandomShapeFromCategory(slot2Category, currentScore, density);
    }
    result.push(slot2Shape);

    // --- SLOT 3: Weighted Balancing & Safety Rule ---
    let slot3Weights = { ...slot2Weights };
    let slot3Category = pickWeightedCategory(slot3Weights);
    let slot3Shape = getRandomShapeFromCategory(slot3Category, currentScore, density);

    if (density < 0.25 && slot3Shape.category === 'micro') {
        const largePool = [...SHAPE_POOLS.line, ...SHAPE_POOLS.massive, ...SHAPE_POOLS.lt];
        slot3Shape = largePool[Math.floor(Math.random() * largePool.length)];
    }

    let massiveCount = (result[0].category === 'massive' ? 1 : 0) + 
                       (result[1].category === 'massive' ? 1 : 0) + 
                       (slot3Shape.category === 'massive' ? 1 : 0);

    let safetyAttempts = 0;
    while (massiveCount >= 3 && safetyAttempts < 10) {
        const nonMassiveWeights = { micro: 20, line: 45, lt: 35, massive: 0 };
        const safeCategory = pickWeightedCategory(nonMassiveWeights);
        slot3Shape = getRandomShapeFromCategory(safeCategory, currentScore, density);
        massiveCount = (result[0].category === 'massive' ? 1 : 0) + 
                       (result[1].category === 'massive' ? 1 : 0) + 
                       (slot3Shape.category === 'massive' ? 1 : 0);
        safetyAttempts++;
    }

    result.push(slot3Shape);
    return result;
}

function generateThreePieces(currentGrid) {
    const currentScore = typeof score !== 'undefined' ? score : 0;
    const rawShapes = generateNextThreeShapes(currentGrid, currentScore);
    const colorList = Object.values(GEM_COLORS);

    return rawShapes.map(shape => {
        const randomColor = colorList[Math.floor(Math.random() * colorList.length)];
        return {
            id: shape.id,
            category: shape.category,
            coords: shape.coords,
            matrix: shape.matrix.map(row => [...row]),
            color: randomColor
        };
    });
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

            if (typeof updateComboToleranceUI === 'function') {
                updateComboToleranceUI();
            } else {
                const linesClearedText = document.getElementById('linesClearedText') || document.querySelector('#linesClearedText');
                if (linesClearedText) {
                    linesClearedText.textContent = `${comboTolerance}/3`;
                }
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

        