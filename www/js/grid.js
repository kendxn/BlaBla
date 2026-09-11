const BOARD_SIZE = 8;
const boardElement = document.getElementById('board');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const skillStatus = document.getElementById('skill-status');
const linesText = document.getElementById('lines-text');
const gameOverScreen = document.getElementById('game-over');
const playBtn = document.getElementById('play-btn');
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

let boardState = [];
let lastPlacedColor = null;
let score = 0;
let highScore = parseInt(localStorage.getItem('blockBlast3DHighScore8x8')) || 0;
let sessionStartHighScore = highScore;
let achievedNewRecord = false;
let hasTriggeredRecordScreen = false;
let activePieces = [];

let linesEliminated = 0;
let skillDiscardActive = false;
let skillRotateActive = false;
let skillSingleActive = false;
let turnHasDragged = false;
let gameOver = false;

if (highScoreElement) highScoreElement.textContent = highScore;

const GEM_COLORS = {
    cyan:      { center: 'rgb(59, 176, 215)',  top: 'rgb(116, 195, 220)', left: 'rgb(87, 185, 217)',  right: 'rgb(43, 145, 180)',  bottom: 'rgb(31, 114, 144)' },
    blue:      { center: 'rgb(55, 87, 209)',   top: 'rgb(108, 134, 216)', left: 'rgb(80, 110, 212)',  right: 'rgb(37, 67, 174)',   bottom: 'rgb(25, 49, 140)' },
    purple:    { center: 'rgb(139, 79, 190)',  top: 'rgb(170, 127, 204)', left: 'rgb(154, 103, 197)', right: 'rgb(110, 58, 156)',  bottom: 'rgb(85, 40, 125)' },
    lime:      { center: 'rgb(78, 181, 62)',   top: 'rgb(127, 199, 114)', left: 'rgb(103, 190, 88)',  right: 'rgb(60, 148, 47)',   bottom: 'rgb(45, 116, 34)' },
    yellow:    { center: 'rgb(218, 163, 35)',  top: 'rgb(222, 185, 91)',  left: 'rgb(220, 173, 62)',  right: 'rgb(186, 133, 17)',  bottom: 'rgb(150, 106, 10)' },
    red:       { center: 'rgb(205, 55, 55)',   top: 'rgb(214, 108, 108)', left: 'rgb(210, 81, 81)',   right: 'rgb(171, 36, 36)',   bottom: 'rgb(136, 22, 22)' },
    orange:    { center: 'rgb(219, 110, 29)',  top: 'rgb(223, 146, 85)',  left: 'rgb(221, 129, 57)',  right: 'rgb(186, 87, 14)',   bottom: 'rgb(150, 66, 8)' },
    magenta:   { center: 'rgb(207, 60, 132)',  top: 'rgb(215, 111, 163)', left: 'rgb(211, 85, 146)',  right: 'rgb(173, 39, 104)',  bottom: 'rgb(138, 24, 79)' },
    teal:      { center: 'rgb(34, 177, 146)',  top: 'rgb(93, 194, 171)',  left: 'rgb(63, 185, 158)',  right: 'rgb(23, 144, 117)',  bottom: 'rgb(15, 111, 90)' },
    turquoise: { center: 'rgb(64, 196, 225)',  top: 'rgb(120, 206, 227)', left: 'rgb(92, 202, 226)',  right: 'rgb(41, 165, 191)',  bottom: 'rgb(25, 132, 156)' },
    indigo:    { center: 'rgb(97, 82, 206)',   top: 'rgb(139, 128, 213)', left: 'rgb(117, 105, 210)', right: 'rgb(72, 58, 175)',   bottom: 'rgb(52, 39, 140)' }
};

const COLORS = Object.values(GEM_COLORS);

function hexToHsl(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getGemShades(colorObj) {
    if (!colorObj) return GEM_COLORS.cyan;
    if (typeof colorObj === 'object' && colorObj.center) return colorObj;
    if (typeof colorObj === 'string' && GEM_COLORS[colorObj]) return GEM_COLORS[colorObj];
    if (typeof colorObj === 'string' && colorObj.startsWith('#')) {
        let [h, s, l] = hexToHsl(colorObj);
        s = Math.min(100, Math.round(s * 1.25));
        return {
            center: `hsl(${h}, ${s}%, ${l}%)`,
            top: `hsl(${h}, ${Math.min(100, s + 10)}%, ${Math.min(90, l + 18)}%)`,
            left: `hsl(${h}, ${Math.min(100, s + 5)}%, ${Math.min(82, l + 9)}%)`,
            right: `hsl(${h}, ${s}%, ${Math.max(10, l - 12)}%)`,
            bottom: `hsl(${h}, ${s}%, ${Math.max(5, l - 22)}%)`
        };
    }
    return GEM_COLORS.cyan;
}

function createGemBlockHTML(colorObj) {
    const shades = getGemShades(colorObj);
    const style = `--c-center: ${shades.center}; --c-top: ${shades.top}; --c-left: ${shades.left}; --c-right: ${shades.right}; --c-bottom: ${shades.bottom};`;
    return `<div class="block-cell" style="${style}"><div class="facet top"></div><div class="facet left"></div><div class="facet right"></div><div class="facet bottom"></div><div class="center-face"></div></div>`;
}

function createGemBlock(colorObj) {
    const cell = document.createElement('div');
    cell.className = 'block-cell';
    const shades = getGemShades(colorObj);
    cell.style.setProperty('--c-top', shades.top);
    cell.style.setProperty('--c-left', shades.left);
    cell.style.setProperty('--c-right', shades.right);
    cell.style.setProperty('--c-bottom', shades.bottom);
    cell.style.setProperty('--c-center', shades.center);
    cell.innerHTML = `<div class="facet top"></div><div class="facet left"></div><div class="facet right"></div><div class="facet bottom"></div><div class="center-face"></div>`;
    return cell;
}

function initBoard() {
    if(!boardElement) return;
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
    highScore = parseInt(localStorage.getItem('blockBlast3DHighScore8x8')) || 0;
    if(highScoreElement) highScoreElement.textContent = highScore;
    sessionStartHighScore = highScore;
    achievedNewRecord = false;
    hasTriggeredRecordScreen = false;
    updateScore(0);
    updateSkillUI();
    if(skillStatus) skillStatus.textContent = '';
    const goBestText = document.getElementById('go-best-text');
    if(goBestText) goBestText.style.display = 'none';
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

function renderBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const cell = boardElement.children[r * BOARD_SIZE + c];
            const color = boardState[r][c];
            cell.className = 'cell';
            if (color) {
                cell.innerHTML = createGemBlockHTML(color);
            } else {
                cell.innerHTML = '';
            }
        }
    }
}

function updateScore(points) {
    const prevScore = score;
    score += points;
    if(scoreElement) animateNumberValue(scoreElement, prevScore, score, 400);
    if (score > sessionStartHighScore) {
        const prevHigh = highScore;
        achievedNewRecord = true;
        highScore = score;
        localStorage.setItem('blockBlast3DHighScore8x8', highScore);
        if(highScoreElement) animateNumberValue(highScoreElement, prevHigh, highScore, 400);
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

function checkLines() {
    let rowsToClear = [];
    let colsToClear = [];

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
    renderBoard();
}

function checkGameOver() {
    if (activePieces.length === 0) return;
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
}

function triggerGameOver() {
    let delay = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (boardState[r][c]) {
                setTimeout(() => {
                    const cell = boardElement.children[r * BOARD_SIZE + c];
                    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
                    cell.innerHTML = createGemBlockHTML(randomColor);
                }, delay);
                delay += 15;
            }
        }
    }

    setTimeout(() => {
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
        }
    }, delay + 500);
}

if(playBtn) {
    playBtn.addEventListener('click', () => {
        gameOverScreen.classList.remove('visible');
        gameOverScreen.classList.remove('new-high-score');
        if(ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(typeof particles !== 'undefined') particles = [];
        if(typeof confettiParticles !== 'undefined') confettiParticles = [];
        if (gameOver) {
            initBoard();
        } else {
            checkGameOver();
        }
    });
}

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

function animateBouncer() {
    const gameOverScreen = document.getElementById('game-over');
    if (gameOverScreen && gameOverScreen.classList.contains('visible') && !gameOverScreen.classList.contains('new-high-score')) {
        updateBouncer();
        drawBouncer();
    }
    requestAnimationFrame(animateBouncer);
}

document.addEventListener('DOMContentLoaded', () => {
    initBouncer();
    animateBouncer();
});

window.addEventListener('resize', () => {
    if (bouncerX + bouncerW > window.innerWidth) bouncerX = window.innerWidth - bouncerW - 50;
    if (bouncerY + bouncerH > window.innerHeight) bouncerY = window.innerHeight - bouncerH - 50;
});
