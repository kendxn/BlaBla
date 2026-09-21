
function refreshDOMElements() {
    boardElement = document.getElementById('board');
    scoreElement = document.getElementById('currentScoreDisplay') || document.getElementById('score');
    highScoreElement = document.getElementById('maxScoreDisplay') || document.getElementById('high-score');
    skillStatus = document.getElementById('skill-status');
    linesText = document.getElementById('linesClearedText') || document.getElementById('lines-text');
    gameOverScreen = document.getElementById('game-over');
    playBtn = document.getElementById('play-btn');
    canvas = document.getElementById('confetti-canvas');
    if (canvas) ctx = canvas.getContext('2d');
}


        var BOARD_SIZE = 8;
        var boardElement = document.getElementById('board');
        var scoreElement = document.getElementById('currentScoreDisplay') || document.getElementById('score');
        var highScoreElement = document.getElementById('maxScoreDisplay') || document.getElementById('high-score');
        var skillStatus = document.getElementById('skill-status');
        var linesText = document.getElementById('linesClearedText') || document.getElementById('lines-text');
        var gameOverScreen = document.getElementById('game-over');
        var playBtn = document.getElementById('play-btn');
        var canvas = document.getElementById('confetti-canvas');
        var ctx = canvas.getContext('2d');
        
        var boardState = [];
        var lastPlacedColor = null;
        var score = 0;
        var highScore = parseInt(localStorage.getItem('blockBlast3DHighScore8x8')) || 0;
        var userCoins = 0;

        function updateDigitScaling(element, val, baseSizeCqh) {
            if (!element) return;
            const strVal = String(val).replace(/,/g, '').replace(/\./g, '');
            const numDigits = Math.max(1, strVal.length);
            const scaleFactor = Math.pow(0.85, numDigits - 1);
            const finalSize = (baseSizeCqh * scaleFactor).toFixed(2);
            element.style.fontSize = `${finalSize}cqh`;
        }

        function updateCoinsDisplay() {
            const els = document.querySelectorAll('#linesCoinDisplay, #topBarCoinsDisplay, .coin-count-number, .coins-count');
            els.forEach(el => {
                el.textContent = userCoins;
                updateDigitScaling(el, userCoins, 1.88);
            });
        }
        var sessionStartHighScore = highScore;
        var achievedNewRecord = false;
        var hasTriggeredRecordScreen = false;
        var activePieces = [];
        
        var linesEliminated = 0;
        var skillDiscardActive = false;
        var skillRotateActive = false;
        var skillSingleActive = false;
        var turnHasDragged = false;
        var hasPlacedPieceInTurn = false;
        var gameOver = false;

        var SKILLS_CONFIG = {
            shifting_peach: {
                id: 'shifting_peach',
                name: 'Shifting Peach 🍑',
                icon: '🍑',
                description: 'Tap su un pezzo nel vassoio per cambiarlo casualmente prima di posizionarne uno (1 volta per turno)',
                price: 40,
                unlocked: true,
                active: true,
                usedThisTurn: false,
                maxUsesPerTurn: 1
            },
            curved_banana: {
                id: 'curved_banana',
                name: 'Curved Banana 🍌',
                icon: '🍌',
                description: 'Doppio tap su un pezzo nel vassoio per ruotarlo (1 volta per turno)',
                price: 50,
                unlocked: false,
                active: false,
                usedThisTurn: false,
                maxUsesPerTurn: 1
            },
            single_dot: {
                id: 'single_dot',
                name: 'Punto Singolo 🟡',
                icon: '🟡',
                description: 'Aggiunge un pezzo gemma 1x1 nel vassoio',
                price: 40,
                unlocked: false,
                active: false,
                usedThisTurn: false,
                maxUsesPerTurn: 1
            }
        };

        function isSkillAvailable(skillId) {
            const skill = SKILLS_CONFIG[skillId];
            return skill && skill.unlocked && skill.active && !skill.usedThisTurn;
        }

        function useSkill(skillId) {
            const skill = SKILLS_CONFIG[skillId];
            if (skill) {
                skill.usedThisTurn = true;
            }
        }

        function resetTurnSkills() {
            for (const key in SKILLS_CONFIG) {
                if (SKILLS_CONFIG[key]) {
                    SKILLS_CONFIG[key].usedThisTurn = false;
                }
            }
        }

        if (highScoreElement) highScoreElement.textContent = highScore.toLocaleString();
        if (scoreElement) scoreElement.textContent = '0';

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

        var GEM_COLORS = {
            cyan:      { center: 'rgb(68, 192, 233)',  top: 'rgb(130, 212, 237)', left: 'rgb(97, 200, 234)',  right: 'rgb(40, 161, 204)',  bottom: 'rgb(27, 129, 167)' },
            blue:      { center: 'rgb(62, 98, 229)',   top: 'rgb(119, 147, 233)', left: 'rgb(91, 123, 230)',  right: 'rgb(32, 68, 197)',   bottom: 'rgb(21, 49, 162)' },
            purple:    { center: 'rgb(154, 89, 207)',  top: 'rgb(185, 141, 221)', left: 'rgb(167, 114, 213)', right: 'rgb(121, 57, 177)',  bottom: 'rgb(95, 40, 143)' },
            lime:      { center: 'rgb(88, 200, 70)',   top: 'rgb(140, 215, 126)', left: 'rgb(113, 207, 99)',  right: 'rgb(62, 168, 46)',   bottom: 'rgb(47, 135, 33)' },
            yellow:    { center: 'rgb(238, 179, 43)',  top: 'rgb(239, 200, 103)', left: 'rgb(239, 189, 72)',  right: 'rgb(214, 150, 10)',  bottom: 'rgb(176, 121, 3)' },
            red:       { center: 'rgb(225, 61, 61)',   top: 'rgb(230, 121, 121)', left: 'rgb(228, 88, 88)',   right: 'rgb(194, 30, 30)',   bottom: 'rgb(155, 18, 18)' },
            orange:    { center: 'rgb(240, 124, 36)',  top: 'rgb(241, 159, 95)',  left: 'rgb(240, 141, 66)',  right: 'rgb(214, 92, 5)',    bottom: 'rgb(173, 72, 1)' },
            magenta:   { center: 'rgb(226, 70, 145)',  top: 'rgb(232, 125, 179)', left: 'rgb(229, 97, 161)', right: 'rgb(194, 36, 112)',  bottom: 'rgb(158, 21, 87)' },
            teal:      { center: 'rgb(29, 201, 164)',  top: 'rgb(105, 211, 187)', left: 'rgb(72, 203, 175)',  right: 'rgb(19, 164, 133)',  bottom: 'rgb(11, 127, 102)' },
            turquoise: { center: 'rgb(73, 212, 243)',  top: 'rgb(140, 224, 243)', left: 'rgb(103, 218, 244)', right: 'rgb(37, 183, 212)',  bottom: 'rgb(21, 149, 178)' },
            indigo:    { center: 'rgb(108, 92, 224)',  top: 'rgb(158, 147, 230)', left: 'rgb(128, 115, 226)', right: 'rgb(72, 56, 194)',   bottom: 'rgb(52, 38, 161)' }
        };
        var COLORS = Object.values(GEM_COLORS);

        function getGemShades(colorObj) {
            if (!colorObj) return GEM_COLORS.cyan;
            if (typeof colorObj === 'object' && colorObj.center) return colorObj;
            if (typeof colorObj === 'string' && GEM_COLORS[colorObj]) return GEM_COLORS[colorObj];
            if (typeof colorObj === 'string' && (colorObj.startsWith('#') || colorObj.startsWith('rgb'))) {
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

        