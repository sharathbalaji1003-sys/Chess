/**
 * CHRONO-FLUX CHESS ENGINE
 * Features: Full Legal Rules (Castling, En Passant, Promotion),
 * Minimax Alpha-Beta AI, Fog of War, and Tactical Abilities.
 */

const GLYPHS = {
  w: { k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙" },
  b: { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" }
};

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Positional Piece-Square Tables (from White's perspective)
const PST = {
  p: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [ 5,  5, 10, 25, 25, 10,  5,  5],
    [ 0,  0,  0, 20, 20,  0,  0,  0],
    [ 5, -5,-10,  0,  0,-10, -5,  5],
    [ 5, 10, 10,-20,-20, 10, 10,  5],
    [ 0,  0,  0,  0,  0,  0,  0,  0]
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50]
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20]
  ],
  r: [
    [ 0,  0,  0,  0,  0,  0,  0,  0],
    [ 5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [ 0,  0,  0,  5,  5,  0,  0,  0]
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [ -5,  0,  5,  5,  5,  5,  0, -5],
    [  0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20]
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [ 20, 20,  0,  0,  0,  0, 20, 20],
    [ 20, 30, 10,  0,  0, 10, 30, 20]
  ]
};

// Procedural Web Audio Synthesizer
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  play(type) {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === "move") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === "capture") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(170, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === "check") {
        osc.type = "square";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === "ability") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.31);
      }
    } catch (_) {
      // Ignore audio blocks if user hasn't interacted yet
    }
  }
}

const sfx = new SoundEngine();

// Game State
let state = null;
let selectedSq = null;
let legalMovesForSelected = [];
let activeAbility = null; // 'shield' | 'swap' | null
let swapFirstPiece = null;
let pendingPromotion = null;
let aiThinking = false;
let stateSnapshots = [];

function createInitialState() {
  const backRank = ["r", "n", "b", "q", "k", "b", "n", "r"];
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));

  for (let c = 0; c < 8; c++) {
    board[0][c] = { type: backRank[c], color: "b", hasMoved: false };
    board[1][c] = { type: "p", color: "b", hasMoved: false };
    board[6][c] = { type: "p", color: "w", hasMoved: false };
    board[7][c] = { type: backRank[c], color: "w", hasMoved: false };
  }

  return {
    board,
    turn: "w",
    enPassant: null, // { r, c } target square
    shield: null,    // { r, c, owner }
    abilities: {
      w: { shield: 1, swap: 1, rewind: 1 },
      b: { shield: 1, swap: 1, rewind: 1 }
    },
    captured: { w: [], b: [] },
    history: [],
    lastMove: null,
    gameOver: false
  };
}

function cloneState(s) {
  return {
    board: s.board.map(row => row.map(cell => (cell ? { ...cell } : null))),
    turn: s.turn,
    enPassant: s.enPassant ? { ...s.enPassant } : null,
    shield: s.shield ? { ...s.shield } : null,
    abilities: {
      w: { ...s.abilities.w },
      b: { ...s.abilities.b }
    },
    captured: {
      w: [...s.captured.w],
      b: [...s.captured.b]
    },
    history: [...s.history],
    lastMove: s.lastMove ? { from: { ...s.lastMove.from }, to: { ...s.lastMove.to } } : null,
    gameOver: s.gameOver
  };
}

function inBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isShielded(s, r, c) {
  return s.shield && s.shield.r === r && s.shield.c === c;
}

// Generate pseudo-legal moves for a piece at (r, c)
function getPseudoMoves(s, r, c, ignoreCastling = false) {
  const piece = s.board[r][c];
  if (!piece) return [];
  const { type, color } = piece;
  const enemy = color === "w" ? "b" : "w";
  const moves = [];

  const addMove = (tr, tc, extra = {}) => {
    if (!inBounds(tr, tc)) return;
    const target = s.board[tr][tc];
    if (target && target.color === color) return;
    if (target && isShielded(s, tr, tc)) return; // Aegis shield blocks capture!
    moves.push({ from: { r, c }, to: { r: tr, c: tc }, ...extra });
  };

  if (type === "p") {
    const dir = color === "w" ? -1 : 1;
    const startRow = color === "w" ? 6 : 1;
    const promoRow = color === "w" ? 0 : 7;

    // Forward 1
    if (inBounds(r + dir, c) && !s.board[r + dir][c]) {
      moves.push({
        from: { r, c },
        to: { r: r + dir, c },
        isPromotion: r + dir === promoRow
      });
      // Forward 2
      if (r === startRow && !s.board[r + dir * 2][c]) {
        moves.push({
          from: { r, c },
          to: { r: r + dir * 2, c },
          doublePush: true
        });
      }
    }

    // Diagonal captures + En Passant
    for (const dc of [-1, 1]) {
      const nr = r + dir;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const target = s.board[nr][nc];
      if (target && target.color === enemy && !isShielded(s, nr, nc)) {
        moves.push({
          from: { r, c },
          to: { r: nr, c: nc },
          isPromotion: nr === promoRow
        });
      } else if (s.enPassant && s.enPassant.r === nr && s.enPassant.c === nc) {
        const epVictimRow = r;
        if (!isShielded(s, epVictimRow, nc)) {
          moves.push({
            from: { r, c },
            to: { r: nr, c: nc },
            isEnPassant: true
          });
        }
      }
    }
  } else if (type === "n") {
    const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    for (const [dr, dc] of jumps) addMove(r + dr, c + dc);
  } else if (type === "b" || type === "r" || type === "q") {
    const dirs = [];
    if (type === "b" || type === "q") dirs.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if (type === "r" || type === "q") dirs.push([-1,0],[1,0],[0,-1],[0,1]);
    for (const [dr, dc] of dirs) {
      let nr = r + dr;
      let nc = c + dc;
      while (inBounds(nr, nc)) {
        const target = s.board[nr][nc];
        if (!target) {
          addMove(nr, nc);
        } else {
          if (target.color === enemy && !isShielded(s, nr, nc)) addMove(nr, nc);
          break;
        }
        nr += dr;
        nc += dc;
      }
    }
  } else if (type === "k") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr !== 0 || dc !== 0) addMove(r + dr, c + dc);
      }
    }

    // Castling
    if (!ignoreCastling && !piece.hasMoved && !isKingInCheck(s, color)) {
      const homeRow = color === "w" ? 7 : 0;
      if (r === homeRow && c === 4) {
        // Kingside
        const kRook = s.board[homeRow][7];
        if (kRook && kRook.type === "r" && !kRook.hasMoved &&
            !s.board[homeRow][5] && !s.board[homeRow][6] &&
            !isSquareAttacked(s, homeRow, 5, enemy) &&
            !isSquareAttacked(s, homeRow, 6, enemy)) {
          moves.push({ from: { r, c }, to: { r: homeRow, c: 6 }, castle: "K" });
        }
        // Queenside
        const qRook = s.board[homeRow][0];
        if (qRook && qRook.type === "r" && !qRook.hasMoved &&
            !s.board[homeRow][1] && !s.board[homeRow][2] && !s.board[homeRow][3] &&
            !isSquareAttacked(s, homeRow, 3, enemy) &&
            !isSquareAttacked(s, homeRow, 2, enemy)) {
          moves.push({ from: { r, c }, to: { r: homeRow, c: 2 }, castle: "Q" });
        }
      }
    }
  }

  return moves;
}

function isSquareAttacked(s, targetR, targetC, attackerColor) {
  // Check pawn attacks explicitly
  const pawnDir = attackerColor === "w" ? 1 : -1;
  for (const dc of [-1, 1]) {
    const pr = targetR + pawnDir;
    const pc = targetC + dc;
    if (inBounds(pr, pc)) {
      const p = s.board[pr][pc];
      if (p && p.color === attackerColor && p.type === "p") return true;
    }
  }

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = s.board[r][c];
      if (!p || p.color !== attackerColor || p.type === "p") continue;
      const moves = getPseudoMoves(s, r, c, true);
      if (moves.some(m => m.to.r === targetR && m.to.c === targetC)) {
        return true;
      }
    }
  }
  return false;
}

function isKingInCheck(s, color) {
  let kr = -1, kc = -1;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = s.board[r][c];
      if (p && p.color === color && p.type === "k") {
        kr = r;
        kc = c;
        break;
      }
    }
  }
  if (kr === -1) return true;
  const enemy = color === "w" ? "b" : "w";
  return isSquareAttacked(s, kr, kc, enemy);
}

function applyMoveToState(s, move, promoType = "q") {
  const next = cloneState(s);
  const { from, to } = move;
  const piece = next.board[from.r][from.c];
  const capturedPiece = next.board[to.r][to.c];

  if (capturedPiece) {
    next.captured[piece.color].push(capturedPiece.type);
  }

  // En passant capture
  if (move.isEnPassant) {
    const victimR = from.r;
    const victim = next.board[victimR][to.c];
    if (victim) next.captured[piece.color].push(victim.type);
    next.board[victimR][to.c] = null;
  }

  // Move piece
  next.board[to.r][to.c] = piece;
  next.board[from.r][from.c] = null;
  piece.hasMoved = true;

  // Pawn promotion
  if (move.isPromotion) {
    piece.type = move.promoChoice || promoType;
  }

  // Castling rook movement
  if (move.castle === "K") {
    const rook = next.board[from.r][7];
    next.board[from.r][5] = rook;
    next.board[from.r][7] = null;
    if (rook) rook.hasMoved = true;
  } else if (move.castle === "Q") {
    const rook = next.board[from.r][0];
    next.board[from.r][3] = rook;
    next.board[from.r][0] = null;
    if (rook) rook.hasMoved = true;
  }

  // Update En Passant target
  next.enPassant = move.doublePush
    ? { r: (from.r + to.r) / 2, c: from.c }
    : null;

  // If the shielded piece itself moved, update shield coordinates
  if (next.shield && next.shield.r === from.r && next.shield.c === from.c) {
    next.shield.r = to.r;
    next.shield.c = to.c;
  }

  // Advance turn & expire opponent's shield once their protection turn ends
  const nextTurn = s.turn === "w" ? "b" : "w";
  if (next.shield && next.shield.owner === nextTurn) {
    next.shield = null;
  }

  next.turn = nextTurn;
  next.lastMove = { from, to };
  return next;
}

function getLegalMoves(s, color) {
  const legal = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = s.board[r][c];
      if (!p || p.color !== color) continue;
      const pseudo = getPseudoMoves(s, r, c);
      for (const m of pseudo) {
        const sim = applyMoveToState(s, m);
        if (!isKingInCheck(sim, color)) {
          legal.push(m);
        }
      }
    }
  }
  return legal;
}

// Fog of War Visibility Calculation
function getVisibleSquares(s, viewerColor) {
  const visible = new Set();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = s.board[r][c];
      if (p && p.color === viewerColor) {
        visible.add(`${r},${c}`);
        // Adjacent 1-tile awareness around every friendly unit
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (inBounds(r + dr, c + dc)) visible.add(`${r + dr},${c + dc}`);
          }
        }
        // All pseudo-legal target squares
        const moves = getPseudoMoves(s, r, c, true);
        for (const m of moves) {
          visible.add(`${m.to.r},${m.to.c}`);
        }
      }
    }
  }
  return visible;
}

// Position Evaluation (Positive = White advantage, Negative = Black advantage)
function evaluateBoard(s) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = s.board[r][c];
      if (!p) continue;
      const base = PIECE_VALUES[p.type];
      const tableRow = p.color === "w" ? r : 7 - r;
      const posBonus = PST[p.type][tableRow][c];
      const shieldBonus = isShielded(s, r, c) ? 45 : 0;
      const total = base + posBonus + shieldBonus;
      score += p.color === "w" ? total : -total;
    }
  }
  return score;
}

// Minimax with Alpha-Beta Pruning
function minimax(s, depth, alpha, beta, maximizing) {
  const currentColor = maximizing ? "w" : "b";
  const moves = getLegalMoves(s, currentColor);

  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (isKingInCheck(s, currentColor)) {
        return maximizing ? -99999 - depth : 99999 + depth;
      }
      return 0; // Stalemate
    }
    return evaluateBoard(s);
  }

  // Move ordering: captures first for stronger alpha-beta cutoffs
  moves.sort((a, b) => {
    const capA = s.board[a.to.r][a.to.c] ? 10 : 0;
    const capB = s.board[b.to.r][b.to.c] ? 10 : 0;
    return capB - capA;
  });

  if (maximizing) {
    let maxEval = -Infinity;
    for (const m of moves) {
      const next = applyMoveToState(s, m, "q");
      const ev = minimax(next, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const m of moves) {
      const next = applyMoveToState(s, m, "q");
      const ev = minimax(next, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function triggerAIMove() {
  const mode = document.getElementById("game-mode").value;
  if (mode === "pvp" || state.turn !== "b" || state.gameOver) return;

  aiThinking = true;
  updateStatusBanner("AI is calculating...");

  setTimeout(() => {
    const depth = mode === "ai-easy" ? 2 : 3;
    const moves = getLegalMoves(state, "b");
    if (moves.length === 0) {
      aiThinking = false;
      checkEndConditions();
      return;
    }

    let bestMove = moves[0];
    let bestScore = Infinity;

    // Shuffle slightly so identical evaluations vary naturally
    moves.sort(() => Math.random() - 0.5);

    for (const m of moves) {
      const next = applyMoveToState(state, m, "q");
      const score = minimax(next, depth - 1, -Infinity, Infinity, true);
      if (score < bestScore) {
        bestScore = score;
        bestMove = m;
      }
    }

    executeMove(bestMove, "q");
    aiThinking = false;
  }, 60);
}

// Algebraic Notation Helper
function formatNotation(prevState, move, nextState) {
  if (move.castle === "K") return "O-O";
  if (move.castle === "Q") return "O-O-O";

  const files = "abcdefgh";
  const piece = prevState.board[move.from.r][move.from.c];
  const captured = prevState.board[move.to.r][move.to.c] || move.isEnPassant;
  const pChar = piece.type === "p" ? (captured ? files[move.from.c] : "") : piece.type.toUpperCase();
  const capChar = captured ? "x" : "";
  const dest = `${files[move.to.c]}${8 - move.to.r}`;
  const promo = move.isPromotion ? `=${(move.promoChoice || "Q").toUpperCase()}` : "";
  const check = isKingInCheck(nextState, nextState.turn) ? "+" : "";

  return `${pChar}${capChar}${dest}${promo}${check}`;
}

function executeMove(move, promoChoice = "q") {
  stateSnapshots.push(cloneState(state));
  move.promoChoice = promoChoice;

  const hadCapture = Boolean(state.board[move.to.r][move.to.c] || move.isEnPassant);
  const next = applyMoveToState(state, move, promoChoice);
  const notation = formatNotation(state, move, next);

  next.history.push({ color: state.turn, text: notation });
  state = next;
  selectedSq = null;
  legalMovesForSelected = [];
  activeAbility = null;
  swapFirstPiece = null;

  if (isKingInCheck(state, state.turn)) {
    sfx.play("check");
  } else if (hadCapture) {
    sfx.play("capture");
  } else {
    sfx.play("move");
  }

  renderAll();
  if (!checkEndConditions()) {
    triggerAIMove();
  }
}

function checkEndConditions() {
  const moves = getLegalMoves(state, state.turn);
  const inCheck = isKingInCheck(state, state.turn);

  if (moves.length === 0) {
    state.gameOver = true;
    const modal = document.getElementById("gameover-modal");
    const title = document.getElementById("gameover-title");
    const msg = document.getElementById("gameover-message");

    if (inCheck) {
      const winner = state.turn === "w" ? "Black" : "White";
      title.textContent = "Checkmate!";
      msg.textContent = `${winner} claims victory!`;
      updateStatusBanner(`Checkmate — ${winner} Wins!`);
    } else {
      title.textContent = "Stalemate!";
      msg.textContent = "The match ends in a draw.";
      updateStatusBanner("Draw by Stalemate");
    }
    modal.classList.remove("hidden");
    return true;
  }

  const turnName = state.turn === "w" ? "White" : "Black";
  updateStatusBanner(inCheck ? `${turnName} is in CHECK!` : `${turnName}'s Turn`, inCheck);
  return false;
}

// Square Click Handler (Standard Moves + Tactical Abilities)
function handleSquareClick(r, c) {
  if (state.gameOver || aiThinking) return;
  const mode = document.getElementById("game-mode").value;
  if (mode !== "pvp" && state.turn === "b") return;

  const clickedPiece = state.board[r][c];

  // 1. Handle Tactical Ability: Aegis Shield
  if (activeAbility === "shield") {
    if (clickedPiece && clickedPiece.color === state.turn && clickedPiece.type !== "k") {
      stateSnapshots.push(cloneState(state));
      state.shield = { r, c, owner: state.turn };
      state.abilities[state.turn].shield--;
      state.history.push({ color: state.turn, text: "🛡️ Shield", special: true });
      activeAbility = null;
      sfx.play("ability");
      renderAll();
    } else {
      setAbilityHint("Select one of your non-King pieces to shield!");
    }
    return;
  }

  // 2. Handle Tactical Ability: Phase Shift (Swap 2 friendly non-King pieces)
  if (activeAbility === "swap") {
    if (!clickedPiece || clickedPiece.color !== state.turn || clickedPiece.type === "k") {
      setAbilityHint("Select two of your own non-King pieces to swap.");
      return;
    }

    if (!swapFirstPiece) {
      swapFirstPiece = { r, c };
      setAbilityHint("Now select your second piece to complete Phase Shift.");
      renderBoard();
      return;
    }

    if (swapFirstPiece.r === r && swapFirstPiece.c === c) {
      swapFirstPiece = null;
      setAbilityHint("Selection cleared. Pick your first piece.");
      renderBoard();
      return;
    }

    // Test swap to ensure it doesn't leave own King in check
    const testState = cloneState(state);
    const p1 = testState.board[swapFirstPiece.r][swapFirstPiece.c];
    const p2 = testState.board[r][c];
    testState.board[swapFirstPiece.r][swapFirstPiece.c] = p2;
    testState.board[r][c] = p1;

    if (isKingInCheck(testState, state.turn)) {
      setAbilityHint("Illegal swap: Your King would be left in check!");
      swapFirstPiece = null;
      renderBoard();
      return;
    }

    // Commit Phase Shift (uses turn)
    stateSnapshots.push(cloneState(state));
    state.board = testState.board;
    state.abilities[state.turn].swap--;
    state.history.push({ color: state.turn, text: "🌀 Phase Shift", special: true });
    state.lastMove = { from: swapFirstPiece, to: { r, c } };

    const nextTurn = state.turn === "w" ? "b" : "w";
    if (state.shield && state.shield.owner === nextTurn) state.shield = null;
    state.turn = nextTurn;

    activeAbility = null;
    swapFirstPiece = null;
    sfx.play("ability");
    renderAll();
    if (!checkEndConditions()) triggerAIMove();
    return;
  }

  // 3. Check if clicking a legal destination square
  const chosenMove = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
  if (chosenMove) {
    if (chosenMove.isPromotion) {
      pendingPromotion = chosenMove;
      document.getElementById("promotion-modal").classList.remove("hidden");
    } else {
      executeMove(chosenMove);
    }
    return;
  }

  // 4. Select friendly piece
  if (clickedPiece && clickedPiece.color === state.turn) {
    selectedSq = { r, c };
    const allLegal = getLegalMoves(state, state.turn);
    legalMovesForSelected = allLegal.filter(m => m.from.r === r && m.from.c === c);
  } else {
    selectedSq = null;
    legalMovesForSelected = [];
  }

  renderBoard();
}

// UI Rendering
function renderAll() {
  renderBoard();
  renderAbilities();
  renderCapturedAndHistory();
  updateEvalBar();
}

function renderBoard() {
  const boardEl = document.getElementById("chessboard");
  boardEl.innerHTML = "";

  const fogEnabled = document.getElementById("fog-toggle").checked;
  const mode = document.getElementById("game-mode").value;
  const fogViewer = mode === "pvp" ? state.turn : "w";
  const visibleSet = fogEnabled ? getVisibleSquares(state, fogViewer) : null;

  const files = "abcdefgh";
  const kingInCheck = isKingInCheck(state, state.turn);

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = document.createElement("div");
      const isLight = (r + c) % 2 === 0;
      sq.className = `square ${isLight ? "light" : "dark"}`;

      const isVisible = !fogEnabled || visibleSet.has(`${r},${c}`);
      if (!isVisible) {
        sq.classList.add("fogged");
      }

      if (state.lastMove && isVisible) {
        if ((state.lastMove.from.r === r && state.lastMove.from.c === c) ||
            (state.lastMove.to.r === r && state.lastMove.to.c === c)) {
          sq.classList.add("last-move");
        }
      }

      if (selectedSq && selectedSq.r === r && selectedSq.c === c) {
        sq.classList.add("selected");
      }

      if (swapFirstPiece && swapFirstPiece.r === r && swapFirstPiece.c === c) {
        sq.classList.add("swap-target");
      }

      const legalTarget = legalMovesForSelected.find(m => m.to.r === r && m.to.c === c);
      if (legalTarget) {
        const hasTarget = state.board[r][c] || legalTarget.isEnPassant;
        sq.classList.add(hasTarget ? "legal-capture" : "legal-move");
      }

      // Coordinates
      if (c === 0) {
        const rankSpan = document.createElement("span");
        rankSpan.className = "coord-rank";
        rankSpan.textContent = 8 - r;
        sq.appendChild(rankSpan);
      }
      if (r === 7) {
        const fileSpan = document.createElement("span");
        fileSpan.className = "coord-file";
        fileSpan.textContent = files[c];
        sq.appendChild(fileSpan);
      }

      const piece = state.board[r][c];
      if (piece && isVisible) {
        if (kingInCheck && piece.type === "k" && piece.color === state.turn) {
          sq.classList.add("in-check");
        }

        const pSpan = document.createElement("span");
        pSpan.className = `piece ${piece.color === "w" ? "white" : "black"}`;
        pSpan.textContent = GLYPHS[piece.color][piece.type];

        if (isShielded(state, r, c)) {
          pSpan.classList.add("shielded");
          const ring = document.createElement("div");
          ring.className = "shield-ring";
          sq.appendChild(ring);
        }

        sq.appendChild(pSpan);
      }

      sq.addEventListener("click", () => handleSquareClick(r, c));
      boardEl.appendChild(sq);
    }
  }
}

function renderAbilities() {
  const mode = document.getElementById("game-mode").value;
  const activeColor = mode === "pvp" ? state.turn : "w";
  const charges = state.abilities[activeColor];

  document.getElementById("ability-owner-badge").textContent =
    activeColor === "w" ? "White" : "Black";

  document.getElementById("charge-shield").textContent = charges.shield;
  document.getElementById("charge-swap").textContent = charges.swap;
  document.getElementById("charge-rewind").textContent = charges.rewind;

  const btnShield = document.getElementById("btn-shield");
  const btnSwap = document.getElementById("btn-swap");
  const btnRewind = document.getElementById("btn-rewind");

  btnShield.disabled = charges.shield <= 0 || state.gameOver || aiThinking;
  btnSwap.disabled = charges.swap <= 0 || state.gameOver || aiThinking;
  btnRewind.disabled = charges.rewind <= 0 || stateSnapshots.length === 0 || state.gameOver || aiThinking;

  btnShield.classList.toggle("active", activeAbility === "shield");
  btnSwap.classList.toggle("active", activeAbility === "swap");

  if (!activeAbility) {
    setAbilityHint("1 charge per match. Select a power below:");
  }
}

function setAbilityHint(text) {
  document.getElementById("ability-hint").textContent = text;
}

function renderCapturedAndHistory() {
  const capW = document.getElementById("captured-by-white");
  const capB = document.getElementById("captured-by-black");
  capW.innerHTML = state.captured.w.map(t => `<span>${GLYPHS.b[t]}</span>`).join("");
  capB.innerHTML = state.captured.b.map(t => `<span>${GLYPHS.w[t]}</span>`).join("");

  const histEl = document.getElementById("move-history");
  histEl.innerHTML = "";
  for (let i = 0; i < state.history.length; i += 2) {
    const wMove = state.history[i];
    const bMove = state.history[i + 1];
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span>${Math.floor(i / 2) + 1}.</span>
      <span class="${wMove?.special ? "special-log" : ""}">${wMove ? wMove.text : ""}</span>
      <span class="${bMove?.special ? "special-log" : ""}">${bMove ? bMove.text : ""}</span>
    `;
    histEl.appendChild(row);
  }
  histEl.scrollTop = histEl.scrollHeight;
}

function updateEvalBar() {
  const rawScore = evaluateBoard(state);
  const pawns = (rawScore / 100).toFixed(1);
  // Sigmoid-style clamping between 5% and 95%
  const pct = Math.max(5, Math.min(95, 50 + (rawScore / 1200) * 45));
  document.getElementById("eval-bar-fill").style.height = `${pct}%`;
  document.getElementById("eval-score").textContent = rawScore > 0 ? `+${pawns}` : pawns;
}

function updateStatusBanner(text, isCheck = false) {
  const banner = document.getElementById("status-banner");
  banner.textContent = text;
  banner.classList.toggle("check-alert", isCheck);
}

// Button & Event Bindings
document.getElementById("btn-shield").addEventListener("click", () => {
  activeAbility = activeAbility === "shield" ? null : "shield";
  swapFirstPiece = null;
  selectedSq = null;
  legalMovesForSelected = [];
  if (activeAbility) setAbilityHint("Click any of your non-King pieces to shield it.");
  renderAll();
});

document.getElementById("btn-swap").addEventListener("click", () => {
  activeAbility = activeAbility === "swap" ? null : "swap";
  swapFirstPiece = null;
  selectedSq = null;
  legalMovesForSelected = [];
  if (activeAbility) setAbilityHint("Click your first non-King piece to swap.");
  renderAll();
});

document.getElementById("btn-rewind").addEventListener("click", () => {
  const mode = document.getElementById("game-mode").value;
  const userColor = mode === "pvp" ? state.turn : "w";
  if (state.abilities[userColor].rewind <= 0 || stateSnapshots.length === 0) return;

  // In AI mode, rewind 2 plies (AI's move + Player's move) if available
  const stepsBack = mode !== "pvp" && stateSnapshots.length >= 2 ? 2 : 1;
  let restored = null;
  for (let i = 0; i < stepsBack; i++) {
    restored = stateSnapshots.pop();
  }

  if (restored) {
    restored.abilities[userColor].rewind = 0;
    restored.history.push({ color: userColor, text: "⏳ Rewind", special: true });
    state = restored;
    selectedSq = null;
    legalMovesForSelected = [];
    activeAbility = null;
    swapFirstPiece = null;
    sfx.play("ability");
    renderAll();
    updateStatusBanner(`${state.turn === "w" ? "White" : "Black"}'s Turn (Time Rewound)`);
  }
});

document.querySelectorAll("#promo-choices button").forEach(btn => {
  btn.addEventListener("click", () => {
    const pieceType = btn.getAttribute("data-piece");
    document.getElementById("promotion-modal").classList.add("hidden");
    if (pendingPromotion) {
      const move = pendingPromotion;
      pendingPromotion = null;
      executeMove(move, pieceType);
    }
  });
});

function resetGame() {
  state = createInitialState();
  stateSnapshots = [];
  selectedSq = null;
  legalMovesForSelected = [];
  activeAbility = null;
  swapFirstPiece = null;
  pendingPromotion = null;
  aiThinking = false;
  document.getElementById("gameover-modal").classList.add("hidden");
  document.getElementById("promotion-modal").classList.add("hidden");
  updateStatusBanner("White's Turn");
  renderAll();
}

document.getElementById("btn-reset").addEventListener("click", resetGame);
document.getElementById("btn-modal-reset").addEventListener("click", resetGame);
document.getElementById("fog-toggle").addEventListener("change", renderBoard);
document.getElementById("sound-toggle").addEventListener("change", e => {
  sfx.enabled = e.target.checked;
});
document.getElementById("game-mode").addEventListener("change", resetGame);

// Initialize Match
resetGame();
