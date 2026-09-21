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
        if (typeof isSkillAvailable === 'function' && isSkillAvailable('shifting_peach') && !hasPlacedPieceInTurn) {
            skillStatus.textContent = 'Shifting Peach 🍑: Tap pezzo';
        } else if (skillDiscardActive && !turnHasDragged) {
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

function updateDigitScaling(element, val, baseSizeCqh) {
    if (!element) return;
    const strVal = String(val).replace(/,/g, '').replace(/\./g, '');
    const numDigits = Math.max(1, strVal.length);
    const scaleFactor = Math.pow(0.85, numDigits - 1);
    const finalSize = (baseSizeCqh * scaleFactor).toFixed(2);
    element.style.fontSize = `${finalSize}cqh`;
}

let userCoins = 0;

function updateCoinsDisplay() {
    const els = document.querySelectorAll('#linesCoinDisplay, #topBarCoinsDisplay, .coin-count-number, .coins-count');
    els.forEach(el => {
        el.textContent = userCoins;
        updateDigitScaling(el, userCoins, 1.88);
    });
}

function resetCoins() {
    userCoins = 0;
    updateCoinsDisplay();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateCoinsDisplay);
} else {
    updateCoinsDisplay();
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
