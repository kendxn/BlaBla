const BASE_SHAPES = [
    // Pezzo O (Giallo / Oro)
    { matrix: [[1,1],[1,1]], color: GEM_COLORS.yellow },
    // Pezzi I (Ciano / Azzurro & Turchese Chiaro)
    { matrix: [[1,1]], color: GEM_COLORS.cyan },
    { matrix: [[1,1,1]], color: GEM_COLORS.cyan },
    { matrix: [[1,1,1,1]], color: GEM_COLORS.turquoise },
    { matrix: [[1],[1]], color: GEM_COLORS.cyan },
    { matrix: [[1],[1],[1]], color: GEM_COLORS.turquoise },
    { matrix: [[1],[1],[1],[1]], color: GEM_COLORS.cyan },
    // Pezzi L (Arancione Intenso & Rosa Magenta)
    { matrix: [[1,0],[1,1]], color: GEM_COLORS.orange },
    { matrix: [[0,1],[1,1]], color: GEM_COLORS.magenta },
    { matrix: [[1,1,1],[1,0,0]], color: GEM_COLORS.orange },
    { matrix: [[1,1,1],[0,0,1]], color: GEM_COLORS.magenta },
    // Pezzi J (Blu Elettrico & Viola Scuro / Indaco)
    { matrix: [[1,1],[1,0]], color: GEM_COLORS.blue },
    { matrix: [[1,1],[0,1]], color: GEM_COLORS.indigo },
    { matrix: [[1,0,0],[1,1,1]], color: GEM_COLORS.blue },
    { matrix: [[0,0,1],[1,1,1]], color: GEM_COLORS.indigo },
    // Pezzi T (Viola & Verde Acqua / Teal)
    { matrix: [[1,1,1],[0,1,0]], color: GEM_COLORS.purple },
    { matrix: [[0,1,0],[1,1,1]], color: GEM_COLORS.teal },
    { matrix: [[1,0],[1,1],[1,0]], color: GEM_COLORS.purple },
    { matrix: [[0,1],[1,1],[0,1]], color: GEM_COLORS.teal },
    // Pezzo S (Verde Lime)
    { matrix: [[0,1,1],[1,1,0]], color: GEM_COLORS.lime },
    // Pezzo Z (Rosso / Corallo)
    { matrix: [[1,1,0],[0,1,1]], color: GEM_COLORS.red }
];

const SINGLE_DOT_SHAPE = { matrix: [[1]], color: GEM_COLORS.yellow };

function getAvailableShapes() {
    let shapes = [...BASE_SHAPES];
    if (skillSingleActive) shapes.push(SINGLE_DOT_SHAPE);
    return shapes;
}

function spawnPieces(all = false) {
    const shapesPool = getAvailableShapes();
    turnHasDragged = false;

    if (all) {
        activePieces = [];
        for (let i = 0; i < 3; i++) {
            const shape = shapesPool[Math.floor(Math.random() * shapesPool.length)];
            createPieceElement(shape, i);
            activePieces.push({ shape, slot: i, rotated: false });
        }
    } else {
        if (activePieces.length === 0) {
            for (let i = 0; i < 3; i++) {
                const shape = shapesPool[Math.floor(Math.random() * shapesPool.length)];
                createPieceElement(shape, i);
                activePieces.push({ shape, slot: i, rotated: false });
            }
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
