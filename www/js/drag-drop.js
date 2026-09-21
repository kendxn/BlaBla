let dragState = null;
let lastPreviewRow = -1;
let lastPreviewCol = -1;

function clearPreview() {
    renderBoard();
    lastPreviewRow = -1;
    lastPreviewCol = -1;
}

function showPreview(shape, row, col) {
    clearPreview();
    
    let tempBoard = boardState.map(r => [...r]);
    for(let r=0; r<shape.matrix.length; r++){
        for(let c=0; c<shape.matrix[r].length; c++){
            if(shape.matrix[r][c]){
                tempBoard[row+r][col+c] = shape.color;
            }
        }
    }

    let rowsToClear = [];
    let colsToClear = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        if (tempBoard[r].every(val => val !== null)) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
        if (tempBoard.every(r => r[c] !== null)) colsToClear.push(c);
    }

    for(let r=0; r<shape.matrix.length; r++){
        for(let c=0; c<shape.matrix[r].length; c++){
            if(shape.matrix[r][c]){
                const cell = boardElement.children[(row+r) * BOARD_SIZE + (col+c)];
                if(cell) {
                    cell.classList.add('preview');
                    cell.innerHTML = createGemBlockHTML(shape.color);
                    const gem = cell.querySelector('.block-cell');
                    if (gem) gem.style.opacity = '0.4';
                }
            }
        }
    }

    rowsToClear.forEach(r => {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = boardElement.children[r * BOARD_SIZE + c];
            if(cell) {
                cell.classList.add('preview-clear');
                cell.innerHTML = createGemBlockHTML(shape.color);
            }
        }
    });
    colsToClear.forEach(c => {
        for (let r = 0; r < BOARD_SIZE; r++) {
            const cell = boardElement.children[r * BOARD_SIZE + c];
            if(cell) {
                cell.classList.add('preview-clear');
                cell.innerHTML = createGemBlockHTML(shape.color);
            }
        }
    });
    lastPreviewRow = row;
    lastPreviewCol = col;
}

function resetPieceElementStyle(el) {
    if (!el) return;
    el.classList.remove('dragging');
    el.style.position = '';
    el.style.left = '';
    el.style.top = '';
    el.style.width = '';
    el.style.height = '';
    el.style.transform = '';
    el.style.transformOrigin = '';
}

function createPieceElement(shape, slotIndex, rotated = false) {
    const slot = document.getElementById(`slot-${slotIndex}`);
    if (!slot) return;
    slot.innerHTML = '';
    
    const pieceEl = document.createElement('div');
    pieceEl.classList.add('piece');
    pieceEl.dataset.slot = slotIndex;
    
    shape.matrix.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.classList.add('piece-row');
        row.forEach(val => {
            const block = document.createElement('div');
            block.classList.add('piece-block');
            if (val) {
                block.innerHTML = createGemBlockHTML(shape.color);
            } else {
                block.style.backgroundColor = 'transparent';
            }
            rowEl.appendChild(block);
        });
        pieceEl.appendChild(rowEl);
    });

    slot.appendChild(pieceEl);

    let startX = 0, startY = 0;
    let lastTap = 0;

    pieceEl.addEventListener('pointerdown', (e) => {
        if (gameOver) return;
        if (e.cancelable) e.preventDefault();

        if (dragState && dragState.element) {
            resetPieceElementStyle(dragState.element);
        }
        dragState = null;
        clearPreview();

        try {
            pieceEl.setPointerCapture(e.pointerId);
        } catch (err) {}

        startX = e.clientX;
        startY = e.clientY;

        const rect = pieceEl.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        dragState = {
            element: pieceEl,
            slotIndex,
            shape,
            offsetX,
            offsetY,
            hasMoved: false,
            startX,
            startY,
            pointerId: e.pointerId
        };

        window.addEventListener('pointermove', onDrag, { passive: false });
        window.addEventListener('pointerup', onPointerUp, { passive: false });
        window.addEventListener('pointercancel', onPointerUp, { passive: false });
    });

    function onPointerUp(e) {
        window.removeEventListener('pointermove', onDrag);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        if (e && e.pointerId !== undefined && pieceEl.hasPointerCapture && pieceEl.hasPointerCapture(e.pointerId)) {
            try {
                pieceEl.releasePointerCapture(e.pointerId);
            } catch (err) {}
        }

        if (!dragState || dragState.element !== pieceEl) return;

        const { element, hasMoved, slotIndex: currentSlot } = dragState;

        if (!hasMoved) {
            dragState = null;
            const now = Date.now();
            const isDoubleTap = (now - lastTap) < 300;
            lastTap = now;

            const pieceData = activePieces.find(p => p.slot === currentSlot);

            // Abilità Shifting Peach 🍑 (Tap singolo PRIMA di posizionare qualsiasi pezzo)
            if (!isDoubleTap && typeof isSkillAvailable === 'function' && isSkillAvailable('shifting_peach')) {
                if (hasPlacedPieceInTurn) {
                    if (skillStatus) skillStatus.textContent = 'Non disponibile dopo il piazzamento!';
                    setTimeout(() => {
                        if (skillStatus && skillStatus.textContent === 'Non disponibile dopo il piazzamento!') {
                            skillStatus.textContent = '';
                        }
                    }, 1800);
                    return;
                }
                if (pieceData) {
                    const newShape = getRandomPieceShape();
                    pieceData.shape = newShape;
                    pieceData.rotated = false;
                    createPieceElement(newShape, currentSlot);
                    useSkill('shifting_peach');
                    if (skillStatus) skillStatus.textContent = 'Shifting Peach 🍑 Usata!';
                    setTimeout(() => {
                        if (skillStatus && skillStatus.textContent === 'Shifting Peach 🍑 Usata!') {
                            skillStatus.textContent = '';
                        }
                    }, 1500);
                    checkGameOver();
                    return;
                }
            }

            // Abilità Curved Banana 🍌 (Doppio tap per ruotare)
            if (isDoubleTap && typeof isSkillAvailable === 'function' && isSkillAvailable('curved_banana') && pieceData) {
                pieceData.shape.matrix = rotateMatrix(pieceData.shape.matrix);
                createPieceElement(pieceData.shape, currentSlot, true);
                useSkill('curved_banana');
                if (skillStatus) skillStatus.textContent = 'Curved Banana 🍌 Usata!';
                setTimeout(() => {
                    if (skillStatus && skillStatus.textContent === 'Curved Banana 🍌 Usata!') {
                        skillStatus.textContent = '';
                    }
                }, 1500);
                checkGameOver();
                return;
            }

            if (isDoubleTap && skillRotateActive && pieceData && !pieceData.rotated) {
                pieceData.shape.matrix = rotateMatrix(pieceData.shape.matrix);
                pieceData.rotated = true;
                createPieceElement(pieceData.shape, currentSlot, true);
                checkGameOver();
                return;
            }

            if (skillDiscardActive && !turnHasDragged && !isDoubleTap) {
                const newShape = getRandomPieceShape();
                if (pieceData) {
                    pieceData.shape = newShape;
                    pieceData.rotated = false;
                    createPieceElement(newShape, currentSlot);
                    skillDiscardActive = false;
                    updateSkillUI();
                    checkGameOver();
                }
                return;
            }
            return;
        }

        turnHasDragged = true;
        updateSkillUI();

        let targetRow = -1;
        let targetCol = -1;
        if (lastPreviewRow !== -1 && lastPreviewCol !== -1 && canPlace(dragState.shape.matrix, lastPreviewRow, lastPreviewCol)) {
            targetRow = lastPreviewRow;
            targetCol = lastPreviewCol;
        } else {
            const scaledRect = element.getBoundingClientRect();
            const boardRect = boardElement.getBoundingClientRect();
            const cellWidth = boardRect.width / BOARD_SIZE;
            const cellHeight = boardRect.height / BOARD_SIZE;

            const dropX = scaledRect.left - boardRect.left;
            const dropY = scaledRect.top - boardRect.top;

            const col = Math.floor((dropX + cellWidth * 0.25) / cellWidth);
            const row = Math.floor((dropY + cellHeight * 0.25) / cellHeight);

            if (canPlace(dragState.shape.matrix, row, col)) {
                targetRow = row;
                targetCol = col;
            }
        }

        clearPreview();
        resetPieceElementStyle(element);

        if (targetRow !== -1 && targetCol !== -1) {
            placePiece(dragState.shape, targetRow, targetCol);
            element.remove();
            activePieces = activePieces.filter(p => p.slot !== currentSlot);
            hasPlacedPieceInTurn = true;
            updateSkillUI();
            
            checkLines();
            spawnPieces();
        }

        dragState = null;
    }
}

function onDrag(e) {
    if (!dragState) return;

    const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
    if (!dragState.hasMoved && dist > 3) {
        dragState.hasMoved = true;
        const el = dragState.element;
        const rect = el.getBoundingClientRect();
        el.style.width = `${rect.width}px`;
        el.style.height = `${rect.height}px`;
        el.classList.add('dragging');
        el.style.position = 'fixed';
        el.style.transformOrigin = `${dragState.offsetX}px ${dragState.offsetY}px`;
    }

    if (dragState.hasMoved) {
        if (e.cancelable) e.preventDefault();
        const boardRect = boardElement.getBoundingClientRect();
        const cellWidth = boardRect.width / BOARD_SIZE;
        const cellHeight = boardRect.height / BOARD_SIZE;
        
        const pieceFirstBlock = dragState.element.querySelector('.piece-block');
        const pieceBlockWidth = pieceFirstBlock ? pieceFirstBlock.offsetWidth : cellWidth;
        const scaleFactor = pieceBlockWidth > 0 ? (cellWidth / pieceBlockWidth) : 1;

        const el = dragState.element;
        el.style.left = `${e.clientX - dragState.offsetX}px`;
        el.style.top = `${e.clientY - dragState.offsetY}px`;
        el.style.transform = `scale(${scaleFactor}) translateY(-70px)`;

        const scaledRect = el.getBoundingClientRect();
        const dropX = scaledRect.left - boardRect.left;
        const dropY = scaledRect.top - boardRect.top;
        
        const col = Math.floor((dropX + cellWidth * 0.25) / cellWidth);
        const row = Math.floor((dropY + cellHeight * 0.25) / cellHeight);

        if (row !== lastPreviewRow || col !== lastPreviewCol) {
            lastPreviewRow = row;
            lastPreviewCol = col;
            if (canPlace(dragState.shape.matrix, row, col)) {
                showPreview(dragState.shape, row, col);
            } else {
                clearPreview();
            }
        }
    }
}

// Confetti System
let particles = [];
let confettiParticles = particles;
const confettiColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#ffffff', '#ff9b3d', '#38d977'];

function shootConfetti(amount = 150) {
    spawnConfetti(amount);
}

function spawnConfetti(amount = 150) {
    particles.length = 0;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    
    for (let i = 0; i < amount; i++) {
        const angle = Math.random() * Math.PI * 2; 
        const velocity = Math.random() * 12 + 8; // randf_range(8.0, 20.0)
        particles.push({
            x: center.x, 
            y: center.y - 50, 
            vx: Math.cos(angle) * velocity, 
            vy: Math.sin(angle) * velocity - 5, 
            size: Math.random() * 8 + 4, // randf_range(4.0, 12.0)
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)], 
            rotation: Math.random() * 360, 
            vRot: Math.random() * 10 - 5 // randf_range(-5.0, 5.0)
        });
    }
    requestAnimationFrame(updateConfetti);
}

function updateConfetti() {
    if (particles.length === 0 || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i]; 
        
        p.vy += 0.25; // Gravità
        p.vx *= 0.99; // Attrito
        p.vy *= 0.99; 
        p.x += p.vx; 
        p.y += p.vy; 
        p.rotation += p.vRot; 

        ctx.save(); 
        ctx.translate(p.x, p.y); 
        ctx.rotate(p.rotation * Math.PI / 180); 
        ctx.fillStyle = p.color; 
        // Rect2(-p.size/2, -p.size/4, p.size, p.size/2) da Godot
        ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2); 
        ctx.restore(); 

        if (p.y > canvas.height + 50) {
            particles.splice(i, 1); 
        }
    }

    if (particles.length > 0) {
        requestAnimationFrame(updateConfetti);
    }
}

function resizeCanvas() {
    if(!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initBoard();
    });
} else {
    initBoard();
}
