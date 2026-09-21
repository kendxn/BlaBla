let dragState = null;
        let lastPreviewRow = -1;
        let lastPreviewCol = -1;
        let previewActiveCells = [];

        function clearPreview() {
            if (previewActiveCells.length > 0) {
                previewActiveCells.forEach(({ cell, r, c }) => {
                    if (cell) {
                        cell.classList.remove('preview', 'preview-clear');
                        updateCellGem(cell, boardState[r][c], 1);
                    }
                });
                previewActiveCells = [];
            }
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
                        const targetR = row + r;
                        const targetC = col + c;
                        const cell = boardElement.children[targetR * BOARD_SIZE + targetC];
                        if(cell) {
                            cell.classList.add('preview');
                            updateCellGem(cell, shape.color, 0.4);
                            previewActiveCells.push({ cell, r: targetR, c: targetC });
                        }
                    }
                }
            }

            const clearSet = new Set();
            rowsToClear.forEach(r => {
                for (let c = 0; c < BOARD_SIZE; c++) clearSet.add(`${r},${c}`);
            });
            colsToClear.forEach(c => {
                for (let r = 0; r < BOARD_SIZE; r++) clearSet.add(`${r},${c}`);
            });

            clearSet.forEach(key => {
                const [r, c] = key.split(',').map(Number);
                const cell = boardElement.children[r * BOARD_SIZE + c];
                if(cell) {
                    cell.classList.add('preview-clear');
                    updateCellGem(cell, shape.color, 0.85);
                    previewActiveCells.push({ cell, r, c });
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

        let isDragFramePending = false;

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

            function handlePointerDown(e) {
                if (gameOver) return;
                const targetPiece = slot.querySelector('.piece');
                if (!targetPiece) return;
                if (e.cancelable) e.preventDefault();

                if (dragState && dragState.element) {
                    resetPieceElementStyle(dragState.element);
                }
                dragState = null;
                clearPreview();

                try {
                    slot.setPointerCapture(e.pointerId);
                } catch (err) {}

                startX = e.clientX;
                startY = e.clientY;

                const boardRect = boardElement.getBoundingClientRect();
                const cellWidth = boardRect.width / BOARD_SIZE;
                const cellHeight = boardRect.height / BOARD_SIZE;

                const rect = targetPiece.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;

                const pieceFirstBlock = targetPiece.querySelector('.piece-block');
                const pieceBlockWidth = pieceFirstBlock ? pieceFirstBlock.offsetWidth : cellWidth;
                const scaleFactor = pieceBlockWidth > 0 ? (cellWidth / pieceBlockWidth) : 1;

                dragState = {
                    element: targetPiece,
                    slotIndex,
                    shape,
                    offsetX,
                    offsetY,
                    hasMoved: false,
                    startX,
                    startY,
                    pointerId: e.pointerId,
                    boardRect,
                    cellWidth,
                    cellHeight,
                    scaleFactor,
                    latestX: e.clientX,
                    latestY: e.clientY
                };

                window.addEventListener('pointermove', onDrag, { passive: false });
                window.addEventListener('pointerup', onPointerUp, { passive: false });
                window.addEventListener('pointercancel', onPointerUp, { passive: false });
            }

            slot.onpointerdown = handlePointerDown;

            function onPointerUp(e) {
                window.removeEventListener('pointermove', onDrag);
                window.removeEventListener('pointerup', onPointerUp);
                window.removeEventListener('pointercancel', onPointerUp);

                if (e && e.pointerId !== undefined && slot.hasPointerCapture && slot.hasPointerCapture(e.pointerId)) {
                    try {
                        slot.releasePointerCapture(e.pointerId);
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
                    
                    if (isDoubleTap && pieceData) {
                        if (typeof isSkillAvailable === 'function' && isSkillAvailable('curved_banana') || skillRotateActive) {
                            pieceData.shape.matrix = rotateMatrix(pieceData.shape.matrix);
                            pieceData.rotated = true;
                            createPieceElement(pieceData.shape, currentSlot, true);
                            if (typeof useSkill === 'function') useSkill('curved_banana');
                            
                            const skillStatusEl = document.getElementById('skill-status');
                            if (skillStatusEl) {
                                skillStatusEl.textContent = 'Curved Banana 🍌: Pezzo Ruotato!';
                                setTimeout(() => {
                                    if (skillStatusEl.textContent === 'Curved Banana 🍌: Pezzo Ruotato!') {
                                        skillStatusEl.textContent = '';
                                    }
                                }, 2000);
                            }
                            checkGameOver();
                            return;
                        } else if (typeof SKILLS_CONFIG !== 'undefined' && SKILLS_CONFIG.curved_banana && SKILLS_CONFIG.curved_banana.usedThisTurn) {
                            const skillStatusEl = document.getElementById('skill-status');
                            if (skillStatusEl) {
                                skillStatusEl.textContent = 'Curved Banana già usata in questo turno! 🍌';
                                setTimeout(() => {
                                    if (skillStatusEl.textContent === 'Curved Banana già usata in questo turno! 🍌') {
                                        skillStatusEl.textContent = '';
                                    }
                                }, 2000);
                            }
                        }
                    }

                    if (!isDoubleTap && pieceData) {
                        if (typeof isSkillAvailable === 'function' && isSkillAvailable('shifting_peach')) {
                            if (!hasPlacedPieceInTurn && !turnHasDragged) {
                                const newShape = getRandomPieceShape();
                                pieceData.shape = newShape;
                                pieceData.rotated = false;
                                createPieceElement(newShape, currentSlot);
                                if (typeof useSkill === 'function') useSkill('shifting_peach');

                                const skillStatusEl = document.getElementById('skill-status');
                                if (skillStatusEl) {
                                    skillStatusEl.textContent = 'Shifting Peach 🍑: Pezzo Cambiato!';
                                    setTimeout(() => {
                                        if (skillStatusEl && skillStatusEl.textContent === 'Shifting Peach 🍑: Pezzo Cambiato!') {
                                            skillStatusEl.textContent = '';
                                        }
                                    }, 2000);
                                }

                                updateSkillUI();
                                checkGameOver();
                                return;
                            } else {
                                const skillStatusEl = document.getElementById('skill-status');
                                if (skillStatusEl) {
                                    skillStatusEl.textContent = 'Non disponibile: hai già posizionato un pezzo in questo turno! 🍑';
                                    setTimeout(() => {
                                        if (skillStatusEl && skillStatusEl.textContent === 'Non disponibile: hai già posizionato un pezzo in questo turno! 🍑') {
                                            skillStatusEl.textContent = '';
                                        }
                                    }, 2500);
                                }
                            }
                        } else if (typeof SKILLS_CONFIG !== 'undefined' && SKILLS_CONFIG.shifting_peach && SKILLS_CONFIG.shifting_peach.usedThisTurn) {
                            const skillStatusEl = document.getElementById('skill-status');
                            if (skillStatusEl) {
                                skillStatusEl.textContent = 'Shifting Peach già usata in questo turno! 🍑';
                                setTimeout(() => {
                                    if (skillStatusEl && skillStatusEl.textContent === 'Shifting Peach già usata in questo turno! 🍑') {
                                        skillStatusEl.textContent = '';
                                    }
                                }, 2500);
                            }
                        }
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
                    const { boardRect, cellWidth, cellHeight, offsetX, offsetY, scaleFactor, latestX, latestY } = dragState;
                    const scaledOffsetX = offsetX * scaleFactor;
                    const scaledOffsetY = offsetY * scaleFactor;
                    const scaledLiftY = 70 * scaleFactor;

                    const dropX = (latestX - scaledOffsetX) - boardRect.left;
                    const dropY = (latestY - scaledOffsetY - scaledLiftY) - boardRect.top;

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
                    
                    if (typeof resetTurnSkills === 'function') {
                        resetTurnSkills();
                    }

                    checkLines();
                    spawnPieces();
                }

                dragState = null;
            }
        }

        function onDrag(e) {
            if (!dragState) return;

            if (e.cancelable) e.preventDefault();
            dragState.latestX = e.clientX;
            dragState.latestY = e.clientY;

            const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
            if (!dragState.hasMoved && dist > 3) {
                dragState.hasMoved = true;
                const el = dragState.element;
                el.style.width = `${el.offsetWidth}px`;
                el.style.height = `${el.offsetHeight}px`;
                el.classList.add('dragging');
                el.style.position = 'fixed';
                el.style.transformOrigin = `${dragState.offsetX}px ${dragState.offsetY}px`;
                el.style.willChange = 'transform, left, top';
            }

            if (dragState.hasMoved) {
                if (!isDragFramePending) {
                    isDragFramePending = true;
                    requestAnimationFrame(processDragFrame);
                }
            }
        }

        function processDragFrame() {
            isDragFramePending = false;
            if (!dragState || !dragState.hasMoved) return;

            const { element, offsetX, offsetY, scaleFactor, boardRect, cellWidth, cellHeight, shape } = dragState;
            const clientX = dragState.latestX;
            const clientY = dragState.latestY;

            element.style.left = `${clientX - offsetX}px`;
            element.style.top = `${clientY - offsetY}px`;
            element.style.transform = `scale(${scaleFactor}) translateY(-70px) translateZ(0)`;

            const scaledOffsetX = offsetX * scaleFactor;
            const scaledOffsetY = offsetY * scaleFactor;
            const scaledLiftY = 70 * scaleFactor;

            const dropX = (clientX - scaledOffsetX) - boardRect.left;
            const dropY = (clientY - scaledOffsetY - scaledLiftY) - boardRect.top;

            const col = Math.floor((dropX + cellWidth * 0.25) / cellWidth);
            const row = Math.floor((dropY + cellHeight * 0.25) / cellHeight);

            if (row !== lastPreviewRow || col !== lastPreviewCol) {
                lastPreviewRow = row;
                lastPreviewCol = col;
                if (canPlace(shape.matrix, row, col)) {
                    showPreview(shape, row, col);
                } else {
                    clearPreview();
                }
            }
        }

        function canPlace(matrix, row, col) {
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c]) {
                        const targetRow = row + r;
                        const targetCol = col + c;
                        if (targetRow < 0 || targetRow >= BOARD_SIZE || targetCol < 0 || targetCol >= BOARD_SIZE) {
                            return false;
                        }
                        if (boardState[targetRow][targetCol] !== null) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        function placePiece(shape, row, col) {
            lastPlacedColor = shape.color;
            let blocksPlaced = 0;
            for (let r = 0; r < shape.matrix.length; r++) {
                for (let c = 0; c < shape.matrix[r].length; c++) {
                    if (shape.matrix[r][c]) {
                        boardState[row + r][col + c] = shape.color;
                        blocksPlaced++;
                    }
                }
            }
            updateScore(blocksPlaced);
            renderBoard();
        }

// ==========================================
// VFX ELEMINATION SYSTEM (Particelle, Bagliori e Disintegrazione)
// ==========================================
let particles = [];
let flashes = [];
let disintegrations = [];
let vfxAnimId = null;

function hexToRgba(hex, a) {
  if (!hex) return `rgba(255, 214, 10, ${a})`;
  if (typeof hex === 'object' && hex.center) hex = hex.center;
  if (typeof hex === 'string' && hex.startsWith('rgb')) {
    return hex.replace('rgb', 'rgba').replace(')', `, ${a})`);
  }
  let cleanHex = typeof hex === 'string' ? hex.replace('#', '') : 'ffd60a';
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 214;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 10;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function colorToRgba(colorObj, a) {
  if (!colorObj) return `rgba(255, 214, 10, ${a})`;
  let colorStr = (typeof colorObj === 'object' && colorObj.center) ? colorObj.center : colorObj;
  return hexToRgba(colorStr, a);
}

function drawRoundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y, x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r);
  ctx.arcTo(x, y, x+w, y, r);
  ctx.closePath();
}

class Particle {
  constructor(x, y, color, vx, vy) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.size = 2 + Math.random() * 5;
    this.life = 1;
    this.decay = 0.04 + Math.random() * 0.03;
    this.friction = 0.94;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.life -= this.decay;
  }
  
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    const s = Math.max(0.5, this.size * this.life);
    drawRoundRect(ctx, this.x - s/2, this.y - s/2, s, s, s * 0.10);
    ctx.fill();
    ctx.restore();
  }
}

class Flash {
  constructor(x, y, w, h, color, isVertical) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.color = color;
    this.life = 1;
    this.isVertical = isVertical;
  }
  
  update() {
    this.life -= 0.06;
  }
  
  draw(ctx) {
    if (this.life <= 0) return;
    const cx = this.x + this.w / 2;
    const cy = this.y + this.h / 2;
    const alpha = Math.max(0, this.life * this.life);

    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.w, this.h);
    ctx.clip();

    const r = Math.max(this.w, this.h) * 0.8;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.3, colorToRgba(this.color, alpha * 0.8));
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.globalAlpha = alpha;
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    if (this.isVertical) {
      const barW = 6 + (1 - this.life) * 9; 
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(cx - barW/2, this.y, barW, this.h);
    } else {
      const barH = 6 + (1 - this.life) * 9; 
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillRect(this.x, cy - barH/2, this.w, barH);
    }

    ctx.restore();
  }
}

class Disintegration {
  constructor(x, y, size, color, isVertical) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.life = 1;
    this.pixels = [];
    
    const n = 2;
    const pSize = size / n;
    
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        this.pixels.push({
          ox: (i - 0.5) * pSize,
          oy: (j - 0.5) * pSize,
          vx: isVertical ? (Math.random() - 0.5) * 1.5 : (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3),
          vy: isVertical ? (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3) : (Math.random() - 0.5) * 1.5,
          size: pSize * (0.3 + Math.random() * 0.7)
        });
      }
    }
  }
  
  update() {
    this.life -= 0.035;
    for (const p of this.pixels) {
      p.ox += p.vx;
      p.oy += p.vy;
      p.vx *= 0.93;
      p.vy *= 0.93;
    }
  }
  
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    for (const p of this.pixels) {
      drawRoundRect(ctx, this.x + p.ox - p.size/2, this.y + p.oy - p.size/2, p.size, p.size, p.size * 0.10);
      ctx.fill();
    }
    ctx.restore();
  }
}

function getVfxContext() {
    let vfxCanvas = document.getElementById('vfx-canvas');
    if (!vfxCanvas && boardElement) {
        vfxCanvas = document.createElement('canvas');
        vfxCanvas.id = 'vfx-canvas';
        boardElement.appendChild(vfxCanvas);
    }
    if (!vfxCanvas || !boardElement) return { canvas: null, ctx: null };
    const rect = boardElement.getBoundingClientRect();
    if (vfxCanvas.width !== Math.round(rect.width) || vfxCanvas.height !== Math.round(rect.height)) {
        vfxCanvas.width = Math.round(rect.width);
        vfxCanvas.height = Math.round(rect.height);
    }
    return { canvas: vfxCanvas, ctx: vfxCanvas.getContext('2d') };
}

function animateVFX() {
    const { canvas: vfxCanvas, ctx: vfxCtx } = getVfxContext();
    if (!vfxCtx || !vfxCanvas) return;

    vfxCtx.clearRect(0, 0, vfxCanvas.width, vfxCanvas.height);

    for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.update();
        f.draw(vfxCtx);
        if (f.life <= 0) flashes.splice(i, 1);
    }

    for (let i = disintegrations.length - 1; i >= 0; i--) {
        const d = disintegrations[i];
        d.update();
        d.draw(vfxCtx);
        if (d.life <= 0) disintegrations.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw(vfxCtx);
        if (p.life <= 0) particles.splice(i, 1);
    }

    if (flashes.length > 0 || disintegrations.length > 0 || particles.length > 0) {
        vfxAnimId = requestAnimationFrame(animateVFX);
    } else {
        vfxAnimId = null;
    }
}

function startVFXLoop() {
    if (!vfxAnimId) {
        vfxAnimId = requestAnimationFrame(animateVFX);
    }
}

function spawnParticles(x, y, color, isVertical) {
  let count = Math.random() < 0.4 ? 2 : 1;
  for (let i = 0; i < count; i++) {
    let vx, vy;
    if (isVertical) {
      vx = (Math.random() - 0.5) * 4;
      vy = (Math.random() - 0.5) * 1;
    } else {
      vx = (Math.random() - 0.5) * 1;
      vy = (Math.random() - 0.5) * 4;
    }
    particles.push(new Particle(x, y, color, vx, vy));
  }
}

function triggerClearVFX(index, isVertical, grid, cellSize, cols, rows) {
  let lineColor = 'rgb(218, 163, 35)';
  let colorFound = false;
  
  if (lastPlacedColor) {
    lineColor = (typeof lastPlacedColor === 'object' && lastPlacedColor.center) ? lastPlacedColor.center : (lastPlacedColor.color || lastPlacedColor);
    colorFound = true;
  } else if (isVertical) {
    for (let r = 0; r < rows; r++) {
      if (grid[r][index]) {
        const val = grid[r][index];
        lineColor = (typeof val === 'object' && val.center) ? val.center : (val.color || val);
        colorFound = true;
        break;
      }
    }
  } else {
    for (let c = 0; c < cols; c++) {
      if (grid[index][c]) {
        const val = grid[index][c];
        lineColor = (typeof val === 'object' && val.center) ? val.center : (val.color || val);
        colorFound = true;
        break;
      }
    }
  }

  if (!colorFound) return;

  const blockColor = lineColor;

  if (isVertical) {
    const centerX = (index + 0.5) * cellSize;
    for (let r = 0; r < rows; r++) {
      if (grid[r][index]) {
        const py = (r + 0.5) * cellSize;
        disintegrations.push(new Disintegration(centerX, py, cellSize * 0.8, blockColor, true));
        spawnParticles(centerX, py, blockColor, true);
      }
    }
    flashes.push(new Flash(index * cellSize, 0, cellSize, rows * cellSize, lineColor, true));
  } else {
    const centerY = (index + 0.5) * cellSize;
    for (let c = 0; c < cols; c++) {
      if (grid[index][c]) {
        const px = (c + 0.5) * cellSize;
        disintegrations.push(new Disintegration(px, centerY, cellSize * 0.8, blockColor, false));
        spawnParticles(px, centerY, blockColor, false);
      }
    }
    flashes.push(new Flash(0, index * cellSize, cols * cellSize, cellSize, lineColor, false));
  }

  startVFXLoop();
}

        const RAINBOW_COLORS = [
  '#cc1236',
  '#cc552a',
  '#ccab08',
  '#2dcc10',
  '#00c0cc',
  '#2945bc',
  '#6e22b4',
  '#8337cc'
];

function triggerRainbowSweep(clearedRows, clearedCols) {
  const { canvas: vfxCanvas } = getVfxContext();
  const cellSize = (vfxCanvas ? vfxCanvas.width : boardElement.clientWidth) / BOARD_SIZE;

  // FASE 1: COLORAZIONE ARCOBALENO
  clearedRows.forEach(rowIndex => {
    let blockIndex = 0;
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (boardState[rowIndex][c]) {
        boardState[rowIndex][c] = RAINBOW_COLORS[blockIndex % RAINBOW_COLORS.length];
        blockIndex++;
      }
    }
  });

  clearedCols.forEach(colIndex => {
    let blockIndex = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (boardState[r][colIndex]) {
        boardState[r][colIndex] = RAINBOW_COLORS[blockIndex % RAINBOW_COLORS.length];
        blockIndex++;
      }
    }
  });

  clearedRows.forEach(r => {
    flashes.push(new Flash(0, r * cellSize, BOARD_SIZE * cellSize, cellSize, RAINBOW_COLORS[0], false));
  });
  clearedCols.forEach(c => {
    flashes.push(new Flash(c * cellSize, 0, cellSize, BOARD_SIZE * cellSize, RAINBOW_COLORS[4], true));
  });

  renderBoard();
  startVFXLoop();

  // FASE 2: ANIMAZIONE DI PULIZIA SEQUENZIALE (SWEEP)
  setTimeout(() => {
    const SWEEP_DELAY = 20; 

    // Pulizia RIGHE (da sinistra a destra)
    clearedRows.forEach(rowIndex => {
      for (let c = 0; c < BOARD_SIZE; c++) {
        setTimeout(() => {
          if (boardState[rowIndex] && boardState[rowIndex][c] !== null) {
            const val = boardState[rowIndex][c];
            const blockColor = (typeof val === 'object' && val.center) ? val.center : (val.color || val);
            const px = (c + 0.5) * cellSize;
            const py = (rowIndex + 0.5) * cellSize;

            disintegrations.push(new Disintegration(px, py, cellSize * 0.8, blockColor, false));
            spawnParticles(px, py, blockColor, false);
            startVFXLoop();

            boardState[rowIndex][c] = null;
            renderBoard();
          }
        }, c * SWEEP_DELAY);
      }
    });

    // Pulizia COLONNE (dall'alto verso il basso)
    clearedCols.forEach(colIndex => {
      for (let r = 0; r < BOARD_SIZE; r++) {
        setTimeout(() => {
          if (boardState[r] && boardState[r][colIndex] !== null) {
            const val = boardState[r][colIndex];
            const blockColor = (typeof val === 'object' && val.center) ? val.center : (val.color || val);
            const px = (colIndex + 0.5) * cellSize;
            const py = (r + 0.5) * cellSize;

            disintegrations.push(new Disintegration(px, py, cellSize * 0.8, blockColor, true));
            spawnParticles(px, py, blockColor, true);
            startVFXLoop();

            boardState[r][colIndex] = null;
            renderBoard();
          }
        }, r * SWEEP_DELAY);
      }
    });
  }, 150);
}

        function checkLines() {
            let rowsToClear = [];
            let colsToClear = [];

            for (let r = 0; r < BOARD_SIZE; r++) {
                let full = true;
                for (let c = 0; c < BOARD_SIZE; c++) {
                    if (!boardState[r][c]) full = false;
                }
                if (full) rowsToClear.push(r);
            }

            for (let c = 0; c < BOARD_SIZE; c++) {
                let full = true;
                for (let r = 0; r < BOARD_SIZE; r++) {
                    if (!boardState[r][c]) full = false;
                }
                if (full) colsToClear.push(c);
            }

            if (rowsToClear.length === 0 && colsToClear.length === 0) return;

            if (boardElement) {
                boardElement.classList.remove('shaking');
                void boardElement.offsetWidth;
                boardElement.classList.add('shaking');
            }

            const linesCleared = rowsToClear.length + colsToClear.length;
            let points = linesCleared * 10;
            if (linesCleared > 1) points += linesCleared * 5;
            updateScore(points);
            
            for(let i=0; i<linesCleared; i++){
                linesEliminated++;
                if(linesEliminated % 6 === 0){
                    grantSkill();
                }
            }
            updateSkillUI();

            if (linesCleared > 1) {
                triggerRainbowSweep(rowsToClear, colsToClear);
            } else {
                const { canvas: vfxCanvas } = getVfxContext();
                const cellSize = (vfxCanvas ? vfxCanvas.width : boardElement.clientWidth) / BOARD_SIZE;

                rowsToClear.forEach(r => {
                    triggerClearVFX(r, false, boardState, cellSize, BOARD_SIZE, BOARD_SIZE);
                });

                colsToClear.forEach(c => {
                    triggerClearVFX(c, true, boardState, cellSize, BOARD_SIZE, BOARD_SIZE);
                });

                rowsToClear.forEach(r => {
                    for (let c = 0; c < BOARD_SIZE; c++) boardState[r][c] = null;
                });
                colsToClear.forEach(c => {
                    for (let r = 0; r < BOARD_SIZE; r++) boardState[r][c] = null;
                });

                renderBoard();
            }
        }

        let gameOverCheckTimeout = null;

        function getOrCreateNoSpaceOverlay() {
            let overlay = document.getElementById('no-space-overlay');
            const trayElement = document.getElementById('tray');
            if (!overlay && trayElement) {
                overlay = document.createElement('div');
                overlay.id = 'no-space-overlay';
                overlay.innerHTML = '<div class="no-space-text">No space left</div>';
                trayElement.appendChild(overlay);
            } else if (overlay && overlay.parentElement !== trayElement && trayElement) {
                trayElement.appendChild(overlay);
            }
            return overlay;
        }

        function checkGameOver() {
            if (gameOverCheckTimeout) clearTimeout(gameOverCheckTimeout);

            gameOverCheckTimeout = setTimeout(() => {
                gameOverCheckTimeout = null;
                if (activePieces.length === 0 || gameOver) return;

                let canPlay = false;
                for (const piece of activePieces) {
                    for (let r = 0; r < BOARD_SIZE; r++) {
                        for (let c = 0; c < BOARD_SIZE; c++) {
                            if (canPlace(piece.shape.matrix, r, c)) {
                                canPlay = true;
                                break;
                            }
                        }
                        if (canPlay) break;
                    }
                    if (canPlay) break;
                }

                if (!canPlay && !gameOver) {
                    gameOver = true;
                    triggerGameOver();
                }
            }, 500);
        }

        function triggerGameOver() {
            const overlay = getOrCreateNoSpaceOverlay();
            if (overlay) {
                overlay.classList.add('visible');
            }

            setTimeout(() => {
                let delay = 0;
                for (let r = 0; r < BOARD_SIZE; r++) {
                    for (let c = 0; c < BOARD_SIZE; c++) {
                        if (boardState[r][c]) {
                            setTimeout(() => {
                                const cell = boardElement.children[r * BOARD_SIZE + c];
                                if (cell) {
                                    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                                    cell.innerHTML = createGemBlockHTML(randomColor);
                                }
                            }, delay);
                            delay += 15;
                        }
                    }
                }

                setTimeout(() => {
                    if (overlay) {
                        overlay.classList.remove('visible');
                    }

                    const goScoreText = document.getElementById('go-score-text');
                    if(goScoreText) animateNumberValue(goScoreText, 0, score, 800);

                    const isNewRecord = achievedNewRecord || (score > sessionStartHighScore);

                    if (isNewRecord) {
                        const prevHigh = highScore;
                        highScore = Math.max(highScore, score);
                        localStorage.setItem('blockBlast3DHighScore8x8', highScore);
                        if(highScoreElement) animateNumberValue(highScoreElement, prevHigh, highScore, 400);
                        if(gameOverScreen) gameOverScreen.classList.add('new-high-score');
                        setTimeout(() => {
                            if(typeof shootConfetti === 'function') shootConfetti();
                            else if(typeof spawnConfetti === 'function') spawnConfetti();
                        }, 100);
                    } else {
                        if(gameOverScreen) gameOverScreen.classList.remove('new-high-score');
                    }
                    
                    if(gameOverScreen) {
                        gameOverScreen.classList.remove('visible');
                        void gameOverScreen.offsetWidth;
                        gameOverScreen.classList.add('visible');
                        if (!isNewRecord && typeof startBouncerAnimation === 'function') {
                            startBouncerAnimation();
                        }
                    }
                }, delay + 500);
            }, 1000);
        }

        playBtn.addEventListener('click', () => {
            gameOverScreen.classList.remove('visible');
            gameOverScreen.classList.remove('new-high-score');
            if (typeof bouncerAnimId !== 'undefined' && bouncerAnimId) {
                cancelAnimationFrame(bouncerAnimId);
                bouncerAnimId = null;
            }
            if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            if(typeof particles !== 'undefined') particles = [];
            if(typeof confettiParticles !== 'undefined') confettiParticles = [];
            if (gameOver) {
                initBoard();
            } else {
                checkGameOver();
            }
        });

        let confettiParticles = [];
        const confettiColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#ffffff', '#ff9b3d', '#38d977'];

        function shootConfetti() {
            confettiParticles = [];
            if (!canvas) return;
            const W = canvas.width = window.innerWidth;
            const H = canvas.height = window.innerHeight;
            const numberOfConfetti = 150; 
            for (let i = 0; i < numberOfConfetti; i++) {
                const angle = Math.random() * Math.PI * 2; 
                const velocity = Math.random() * 12 + 8; 
                confettiParticles.push({
                    x: W / 2, 
                    y: H / 2 - 50, 
                    vx: Math.cos(angle) * velocity, 
                    vy: Math.sin(angle) * velocity - 5, 
                    size: Math.random() * 8 + 4, 
                    color: confettiColors[Math.floor(Math.random() * confettiColors.length)], 
                    rotation: Math.random() * 360, 
                    vRot: Math.random() * 10 - 5, 
                    gravity: 0.25, 
                    friction: 0.99 
                });
            }
            requestAnimationFrame(animateConfetti);
        }

        function animateConfetti() {
            if (confettiParticles.length === 0 || !ctx) return;
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            for (let i = confettiParticles.length - 1; i >= 0; i--) {
                let p = confettiParticles[i]; 
                
                p.vy += p.gravity; 
                p.vx *= p.friction; 
                p.vy *= p.friction; 
                p.x += p.vx; 
                p.y += p.vy; 
                p.rotation += p.vRot; 

                ctx.save(); 
                ctx.translate(p.x, p.y); 
                ctx.rotate(p.rotation * Math.PI / 180); 
                ctx.fillStyle = p.color; 
                ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2); 
                ctx.restore(); 

                if (p.y > H + 50) {
                    confettiParticles.splice(i, 1); 
                }
            }

            if (confettiParticles.length > 0) {
                requestAnimationFrame(animateConfetti);
            }
        }

        function spawnConfetti() { shootConfetti(); }

        // --- ANIMAZIONE SFONDO DINAMICO TETRIS 3D (BOUNCER) FOR GAME OVER ---
        const bouncerColorKeys = Object.keys(GEM_COLORS);
        const tetrominoes = [
            [[1, 1, 1, 1]],             // I
            [[1, 0, 0], [1, 1, 1]],     // L
            [[0, 0, 1], [1, 1, 1]],     // J
            [[1, 1], [1, 1]],           // O
            [[0, 1, 1], [1, 1, 0]],     // S
            [[1, 1, 0], [0, 1, 1]],     // Z
            [[0, 1, 0], [1, 1, 1]]      // T
        ];

        let bouncerCurrentMatrix = tetrominoes[0];
        let bouncerCurrentColor = GEM_COLORS.cyan;
        let bouncerX = 0, bouncerY = 0;
        const bouncerSpeed = 2.5;
        let bouncerVx = -bouncerSpeed;
        let bouncerVy = bouncerSpeed;
        let bouncerW = 0, bouncerH = 0;

        function changeBouncerShapeAndColor() {
            const bouncer = document.getElementById('bouncer');
            if (!bouncer) return;
            let newMatrix;
            do {
                newMatrix = tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
            } while (newMatrix === bouncerCurrentMatrix);
            bouncerCurrentMatrix = newMatrix;

            let newColorKey;
            do {
                newColorKey = bouncerColorKeys[Math.floor(Math.random() * bouncerColorKeys.length)];
            } while (GEM_COLORS[newColorKey] === bouncerCurrentColor);
            bouncerCurrentColor = GEM_COLORS[newColorKey];

            renderBouncerShape();
        }

        function renderBouncerShape() {
            const bouncer = document.getElementById('bouncer');
            if (!bouncer) return;
            bouncer.innerHTML = '';
            const blockSize = 36; 
            const gapSize = 2; 
            
            bouncer.style.gridTemplateColumns = `repeat(${bouncerCurrentMatrix[0].length}, ${blockSize}px)`;
            bouncer.style.gridTemplateRows = `repeat(${bouncerCurrentMatrix.length}, ${blockSize}px)`;
            bouncer.style.gap = `${gapSize}px`; 

            bouncerCurrentMatrix.forEach(row => {
                row.forEach(val => {
                    const wrapper = document.createElement('div');
                    if (val === 1) {
                        wrapper.appendChild(createGemBlock(bouncerCurrentColor));
                    }
                    bouncer.appendChild(wrapper);
                });
            });

            bouncer.style.transform = 'none';
            bouncerW = bouncer.offsetWidth;
            bouncerH = bouncer.offsetHeight;
        }

        function initBouncer() {
            renderBouncerShape();
            bouncerX = window.innerWidth - bouncerW - 50; 
            bouncerY = 50;
        }

        function updateBouncer() {
            bouncerX += bouncerVx;
            bouncerY += bouncerVy;

            const cx = bouncerX + bouncerW / 2;
            const cy = bouncerY + bouncerH / 2;
            const halfBound = (bouncerW + bouncerH) * Math.SQRT1_2 / 2; 

            let bounced = false;

            if (cx - halfBound < 0) {
                bouncerX = halfBound - bouncerW / 2;
                bouncerVx = Math.abs(bouncerVx);
                bounced = true;
            } else if (cx + halfBound > window.innerWidth) {
                bouncerX = window.innerWidth - halfBound - bouncerW / 2;
                bouncerVx = -Math.abs(bouncerVx);
                bounced = true;
            }

            if (cy - halfBound < 0) {
                bouncerY = halfBound - bouncerH / 2;
                bouncerVy = Math.abs(bouncerVy);
                bounced = true;
            } else if (cy + halfBound > window.innerHeight) {
                bouncerY = window.innerHeight - halfBound - bouncerH / 2;
                bouncerVy = -Math.abs(bouncerVy);
                bounced = true;
            }

            if (bounced) {
                changeBouncerShapeAndColor();
            }
        }

        function drawBouncer() {
            const bouncer = document.getElementById('bouncer');
            if (bouncer) {
                bouncer.style.transform = `translate(${bouncerX}px, ${bouncerY}px) rotate(45deg)`;
            }
        }

        let bouncerAnimId = null;

        function animateBouncer() {
            const gameOverScreen = document.getElementById('game-over');
            if (gameOverScreen && gameOverScreen.classList.contains('visible') && !gameOverScreen.classList.contains('new-high-score')) {
                updateBouncer();
                drawBouncer();
                bouncerAnimId = requestAnimationFrame(animateBouncer);
            } else {
                bouncerAnimId = null;
            }
        }

        function startBouncerAnimation() {
            if (!bouncerAnimId) {
                initBouncer();
                bouncerAnimId = requestAnimationFrame(animateBouncer);
            }
        }

        const btnSettings = document.getElementById('btnSettings');
        const btnSkills = document.getElementById('btnSkills');
        const btnShop = document.getElementById('btnShop');

        const gameModal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalCloseBtn = document.getElementById('modalCloseBtn');

        function openGameModal(title, contentHTML) {
            if (!gameModal) return;
            if (modalTitle) modalTitle.textContent = title;
            if (modalBody) modalBody.innerHTML = contentHTML;
            gameModal.classList.remove('hidden');
        }

        function closeGameModal() {
            if (gameModal) {
                gameModal.classList.add('hidden');
            }
        }

        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', closeGameModal);
        }

        if (gameModal) {
            gameModal.addEventListener('click', (e) => {
                if (e.target === gameModal) {
                    closeGameModal();
                }
            });
        }

        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                const isCRT = window.isCRTEffectEnabled ? window.isCRTEffectEnabled() : false;
                const crtText = isCRT ? 'FILTRO CRT: ATTIVO' : 'FILTRO CRT: DISATTIVATO';
                const crtClass = isCRT ? 'custom-modal-btn' : 'custom-modal-btn btn-warning';

                openGameModal('IMPOSTAZIONI', `
                    <button id="modalToggleCRT" class="${crtClass}">${crtText}</button>
                    <button id="modalRestartGame" class="custom-modal-btn btn-danger">RICOMINCIA PARTITA</button>
                `);

                const toggleBtn = document.getElementById('modalToggleCRT');
                if (toggleBtn) {
                    toggleBtn.addEventListener('click', () => {
                        const newState = window.toggleCRTEffect ? window.toggleCRTEffect() : true;
                        toggleBtn.textContent = newState ? 'FILTRO CRT: ATTIVO' : 'FILTRO CRT: DISATTIVATO';
                        toggleBtn.className = newState ? 'custom-modal-btn' : 'custom-modal-btn btn-warning';
                    });
                }

                const restartBtn = document.getElementById('modalRestartGame');
                if (restartBtn) {
                    restartBtn.addEventListener('click', () => {
                        closeGameModal();
                        initBoard();
                    });
                }
            });
        }

        if (btnSkills) {
            btnSkills.addEventListener('click', () => {
                let html = '<div style="text-align:left; font-size:0.75rem; color:#e2e8f0; line-height:1.6;">';
                if (typeof SKILLS_CONFIG !== 'undefined') {
                    for (const key in SKILLS_CONFIG) {
                        const s = SKILLS_CONFIG[key];
                        if (s.unlocked) {
                            html += `<div style="margin-bottom:8px;"><strong>${s.name}</strong>: ${s.description}</div>`;
                        }
                    }
                }
                html += '</div>';
                openGameModal('ABILITÀ ATTIVE', html);
            });
        }

        if (btnShop) {
            btnShop.addEventListener('click', () => {
                let skillsHTML = '<div style="text-align:left; font-size:0.75rem; color:#e2e8f0; line-height:1.5;">';
                if (typeof SKILLS_CONFIG !== 'undefined') {
                    for (const key in SKILLS_CONFIG) {
                        const s = SKILLS_CONFIG[key];
                        const isUnlocked = s.unlocked;
                        const btnLabel = isUnlocked ? 'ATTIVO (TEST)' : `SBLOCCA (${s.price} 🪙)`;
                        const btnClass = isUnlocked ? 'custom-modal-btn' : 'custom-modal-btn btn-warning';
                        skillsHTML += `
                            <div style="margin-bottom:12px; border-bottom:1px solid #334155; padding-bottom:10px;">
                                <div style="font-weight:bold; color:#f8fafc; font-size:0.8rem; margin-bottom:4px;">${s.name}</div>
                                <div style="color:#94a3b8; font-size:0.7rem; margin-bottom:6px;">${s.description}</div>
                                <button id="shop-skill-${s.id}" class="${btnClass}" style="width:100%; font-size:0.7rem; padding:8px 10px;">
                                    ${btnLabel}
                                </button>
                            </div>
                        `;
                    }
                }
                skillsHTML += '</div>';

                openGameModal('NEGOZIO ABILITÀ', skillsHTML);

                if (typeof SKILLS_CONFIG !== 'undefined') {
                    for (const key in SKILLS_CONFIG) {
                        const s = SKILLS_CONFIG[key];
                        const btn = document.getElementById(`shop-skill-${s.id}`);
                        if (btn) {
                            btn.addEventListener('click', () => {
                                s.unlocked = !s.unlocked;
                                s.active = s.unlocked;
                                btn.textContent = s.unlocked ? 'ATTIVO (TEST)' : `SBLOCCA (${s.price} 🪙)`;
                                btn.className = s.unlocked ? 'custom-modal-btn' : 'custom-modal-btn btn-warning';
                                const skillStatusEl = document.getElementById('skill-status');
                                if (skillStatusEl) {
                                    skillStatusEl.textContent = s.unlocked ? `${s.name} Attivata!` : `${s.name} Disattivata`;
                                    setTimeout(() => { if (skillStatusEl) skillStatusEl.textContent = ''; }, 2000);
                                }
                            });
                        }
                    }
                }
            });
        }

        initBoard();

        