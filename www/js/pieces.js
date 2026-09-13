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

function updateSkillUI() {
    let dots = linesEliminated % 6;
    for (let i = 1; i <= 6; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if(dot) {
            if (i <= dots || (linesEliminated > 0 && dots === 0)) { 
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }

    const nextThreshold = Math.ceil((linesEliminated + 1) / 6) * 6;
    if(linesText) linesText.textContent = `${linesEliminated} / ${nextThreshold}`;

    if(skillStatus) {
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
    setTimeout(() => {
        for (let i = 1; i <= 6; i++) {
            const dot = document.getElementById(`dot-${i}`);
            if(dot) dot.classList.remove('filled');
        }
    }, 500);

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
