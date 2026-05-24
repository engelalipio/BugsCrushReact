import { useState, useEffect, useCallback, useRef } from "react";

const COLS = 7;
const ROWS = 8;
const BUG_TYPES = 6;

// Full rectangular grid — all cells active
const GRID_MASK = Array.from({ length: ROWS }, () => Array(COLS).fill(1));

const BUGS = [
  { emoji: "🕷️", name: "spider",    bg: "#1a1a2e", border: "#555588" },
  { emoji: "🦂", name: "scorpion",  bg: "#2d1200", border: "#885522" },
  { emoji: "🐜", name: "ant",       bg: "#1a0000", border: "#883333" },
  { emoji: "🪲", name: "beetle",    bg: "#002200", border: "#338833" },
  { emoji: "🦟", name: "mosquito",  bg: "#001a1a", border: "#338888" },
  { emoji: "🦗", name: "cricket",   bg: "#1a1500", border: "#887733" },
];

function createBoard() {
  const board = [];
  for (let r = 0; r < ROWS; r++) {
    board.push([]);
    for (let c = 0; c < COLS; c++) {
      board[r].push(GRID_MASK[r][c] ? Math.floor(Math.random() * BUG_TYPES) : -2);
    }
  }
  return board;
}

function findMatches(board) {
  const matched = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 2; c++) {
      const t = board[r][c];
      if (t >= 0 && board[r][c+1] === t && board[r][c+2] === t) {
        matched[r][c] = matched[r][c+1] = matched[r][c+2] = true;
      }
    }
  }
  for (let r = 0; r < ROWS - 2; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = board[r][c];
      if (t >= 0 && board[r+1][c] === t && board[r+2][c] === t) {
        matched[r][c] = matched[r+1][c] = matched[r+2][c] = true;
      }
    }
  }
  return matched;
}

function collapseBoard(board) {
  const nb = board.map(row => [...row]);
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (nb[r][c] === -2) continue;
      if (nb[r][c] !== -1) {
        nb[write][c] = nb[r][c];
        if (write !== r) nb[r][c] = -1;
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      if (GRID_MASK[r][c]) nb[r][c] = Math.floor(Math.random() * BUG_TYPES);
    }
  }
  return nb;
}

function swapCells(board, r1, c1, r2, c2) {
  const nb = board.map(row => [...row]);
  [nb[r1][c1], nb[r2][c2]] = [nb[r2][c2], nb[r1][c1]];
  return nb;
}

function isAdjacent(r1, c1, r2, c2) {
  return (Math.abs(r1-r2)===1 && c1===c2)||(Math.abs(c1-c2)===1 && r1===r2);
}

function findHintMove(board) {
  const neighbors = [[0,1],[1,0]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] < 0) continue;
      for (const [dr, dc] of neighbors) {
        const nr = r + dr, nc = c + dc;
        if (nr >= ROWS || nc >= COLS || board[nr][nc] < 0) continue;
        const swapped = board.map(row => [...row]);
        [swapped[r][c], swapped[nr][nc]] = [swapped[nr][nc], swapped[r][c]];
        const m = findMatches(swapped);
        if (m.some(row => row.some(Boolean))) return { r1:r, c1:c, r2:nr, c2:nc };
      }
    }
  }
  return null;
}

const LEVELS = [
  { target: 1000, moves: 10 },
  { target: 2500, moves: 14 },
  { target: 5000, moves: 18 },
  { target: 9000, moves: 22 },
  { target: 15000, moves: 26 },
];

export default function BugBlast() {
  const [board, setBoard] = useState(createBoard);
  const [selected, setSelected] = useState(null);
  const [matched, setMatched] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [moves, setMoves] = useState(LEVELS[0].moves);
  const [animating, setAnimating] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboShow, setComboShow] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const [shake, setShake] = useState(false);
  const [particles, setParticles] = useState([]);
  const [hint, setHint] = useState(null);
  const pidRef = useRef(0);
  const idleTimerRef = useRef(null);
  const boardRef = useRef(board);
  useEffect(() => { boardRef.current = board; }, [board]);

  // ── Idle hint: show a valid move after 10 s of no interaction ──
  const resetIdle = useCallback(() => {
    setHint(null);
    clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setHint(findHintMove(boardRef.current));
    }, 10000);
  }, []);

  useEffect(() => {
    if (animating || gameOver || victory) { clearTimeout(idleTimerRef.current); return; }
    resetIdle();
    return () => clearTimeout(idleTimerRef.current);
  }, [board, animating, gameOver, victory, resetIdle]);
  // ────────────────────────────────────────────────────────────────

  const spawnParticles = useCallback((cells) => {
    const ps = cells.map(({ r, c, type }) => ({
      id: pidRef.current++, r, c, type,
      dx: (Math.random()-0.5)*70,
      dy: -(Math.random()*50+20),
    }));
    setParticles(p => [...p, ...ps]);
    setTimeout(() => setParticles(p => p.filter(x => !ps.find(n => n.id===x.id))), 800);
  }, []);

  const processMatches = useCallback((b, comboN = 0) => {
    const m = findMatches(b);
    const any = m.some(row => row.some(Boolean));
    if (!any) {
      setAnimating(false);
      if (comboN > 1) { setComboShow(comboN); setTimeout(()=>setComboShow(null),1400); }
      setCombo(0);
      return;
    }
    setMatched(m);
    let count = 0;
    const cells = [];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      if (m[r][c]) { count++; cells.push({r,c,type:b[r][c]}); }
    }
    spawnParticles(cells);

    setTimeout(() => {
      const mult = comboN + 1;
      const gained = count * 12 * mult;
      setScore(s => {
        const ns = s + gained;
        const lv = level;
        if (ns >= LEVELS[lv].target) {
          if (lv >= LEVELS.length - 1) { setTimeout(()=>setVictory(true), 500); }
          else {
            setLevelUp(true);
            setTimeout(()=>setLevelUp(false), 2000);
            setLevel(lv+1);
            setMoves(LEVELS[lv+1].moves);
          }
        }
        return ns;
      });
      setMatched(null);
      const cleared = b.map((row,r) => row.map((v,c) => m[r][c] ? -1 : v));
      const collapsed = collapseBoard(cleared);
      setBoard(collapsed);
      setCombo(comboN+1);
      setTimeout(() => processMatches(collapsed, comboN+1), 380);
    }, 320);
  }, [level, spawnParticles]);

  const handleClick = useCallback((r, c) => {
    if (animating || gameOver || victory) return;
    if (board[r][c] === -2) return;
    setHint(null);
    resetIdle();
    if (!selected) { setSelected({r,c}); return; }
    if (selected.r===r && selected.c===c) { setSelected(null); return; }
    if (!isAdjacent(selected.r, selected.c, r, c)) { setSelected({r,c}); return; }

    const swapped = swapCells(board, selected.r, selected.c, r, c);
    const m = findMatches(swapped);
    if (!m.some(row => row.some(Boolean))) {
      setShake(true); setTimeout(()=>setShake(false), 400);
      setSelected(null); return;
    }
    setSelected(null);
    setAnimating(true);
    setMoves(mv => {
      const nv = mv - 1;
      if (nv <= 0 && score < LEVELS[level].target) setTimeout(()=>setGameOver(true), 900);
      return nv;
    });
    setBoard(swapped);
    setTimeout(() => processMatches(swapped), 80);
  }, [animating, gameOver, victory, selected, board, score, level, processMatches, resetIdle]);

  const restart = () => {
    setBoard(createBoard());
    setScore(0); setLevel(0); setMoves(LEVELS[0].moves);
    setSelected(null); setMatched(null); setAnimating(false);
    setCombo(0); setComboShow(null); setGameOver(false);
    setVictory(false); setLevelUp(false); setShake(false); setParticles([]);
    setHint(null); clearTimeout(idleTimerRef.current);
  };

  const target = LEVELS[level].target;
  const progress = Math.min((score / target) * 100, 100);
  const cellSize = "clamp(38px, 11vw, 52px)";

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #0a2e0a 0%, #1a4a0a 30%, #0d3320 60%, #061a08 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "flex-start",
      fontFamily: "'Fredoka One', cursive",
      padding: "12px 8px 20px",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap');
        * { box-sizing: border-box; }
        .cell { cursor: pointer; transition: transform 0.12s, filter 0.12s; position: relative; }
        .cell:hover { transform: scale(1.1); filter: brightness(1.2); }
        .cell.sel { transform: scale(1.15); filter: brightness(1.4) drop-shadow(0 0 6px #aaff66); }
        .cell.popping { animation: bugpop 0.32s ease forwards; }
        @keyframes bugpop {
          0% { transform: scale(1); opacity: 1; }
          40% { transform: scale(1.5) rotate(20deg); opacity: 0.6; }
          100% { transform: scale(0) rotate(45deg); opacity: 0; }
        }
        @keyframes bugin {
          0% { transform: translateY(-30px) scale(0.6); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .cell.dropping { animation: bugin 0.28s ease; }
        @keyframes float-out {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx),var(--dy)) scale(0); opacity: 0; }
        }
        .particle { animation: float-out 0.8s ease-out forwards; pointer-events: none; position: absolute; }
        @keyframes combo-anim {
          0% { transform: translate(-50%,-50%) scale(0.3) rotate(-15deg); opacity: 0; }
          50% { transform: translate(-50%,-50%) scale(1.2) rotate(5deg); opacity: 1; }
          80% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) scale(0.8); opacity: 0; }
        }
        .combo-pop { animation: combo-anim 1.4s ease forwards; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .shake { animation: shake 0.4s ease; }
        @keyframes lvup { 0%{transform:translate(-50%,-50%) scale(0.5);opacity:0} 60%{transform:translate(-50%,-50%) scale(1.1);opacity:1} 100%{transform:translate(-50%,-50%) scale(1);opacity:1} }
        .lvup-pop { animation: lvup 0.5s ease forwards; }
        .leaf-bg { position:fixed; pointer-events:none; opacity:0.06; font-size:80px; }
        @keyframes sway { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        .sway { animation: sway 6s ease-in-out infinite; }
        @keyframes hint-pulse {
          0%,100% { box-shadow: 0 0 0 2px #FFD700, 0 0 10px #FFD700; transform: scale(1); }
          50%      { box-shadow: 0 0 0 3px #FFD700, 0 0 22px #FFD700, 0 0 40px rgba(255,215,0,0.4); transform: scale(1.14); }
        }
        .hint-cell { animation: hint-pulse 0.9s ease-in-out infinite; }
        @keyframes hint-arrow {
          0%,100% { opacity: 0.7; transform: translate(-50%,-50%) scale(0.9); }
          50%      { opacity: 1;   transform: translate(-50%,-50%) scale(1.15); }
        }
        .hint-label {
          position: fixed; z-index: 150; pointer-events: none;
          font-size: 13px; color: #FFD700; font-weight: 900;
          text-shadow: 0 0 8px #000, 0 0 4px #000;
          background: rgba(0,0,0,0.55); border-radius: 8px; padding: 2px 7px;
          animation: hint-arrow 0.9s ease-in-out infinite;
          top: 0; left: 0;
        }
      `}</style>

      {/* Leaf decorations */}
      {["5%","20%","70%","88%"].map((l,i) => (
        <div key={i} className="leaf-bg sway" style={{
          top: `${[10,60,20,70][i]}%`, left: l,
          animationDelay: `${i*1.5}s`,
          animationDuration: `${5+i}s`,
        }}>🌿</div>
      ))}

      {/* Header stats */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        width: "100%", maxWidth: 400, marginBottom: 8, padding: "0 4px",
        zIndex: 10,
      }}>
        {[
          { label: "Target:", value: target.toLocaleString(), color: "#FF6633" },
          { label: "Moves:", value: moves, color: moves <= 3 ? "#FF3333" : "#FF9900" },
          { label: "Score:", value: score.toLocaleString(), color: "#FF6633" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: label==="Moves:" ? "center" : label==="Score:" ? "right" : "left" }}>
            <div style={{ color: "#44AAFF", fontSize: 18, lineHeight: 1 }}>{label}</div>
            <div style={{ color, fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Mascot beetle */}
      <div style={{ fontSize: 36, marginBottom: 4, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.6))", zIndex: 10 }}>🪲</div>

      {/* Progress bar */}
      <div style={{ width: "100%", maxWidth: 400, marginBottom: 10, zIndex: 10 }}>
        <div style={{ height: 8, background: "rgba(0,0,0,0.4)", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(100,200,50,0.2)" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, #22aa22, #88ff44)",
            borderRadius: 999, transition: "width 0.5s ease",
            boxShadow: "0 0 8px rgba(100,255,50,0.5)",
          }} />
        </div>
      </div>

      {/* Board */}
      <div className={shake ? "shake" : ""} style={{
        position: "relative",
        background: "rgba(0,20,0,0.45)",
        borderRadius: 16,
        padding: 6,
        border: "1px solid rgba(100,200,50,0.25)",
        boxShadow: "0 0 30px rgba(0,80,0,0.5), inset 0 0 20px rgba(0,0,0,0.4)",
        zIndex: 10,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${cellSize})`, gap: 3 }}>
          {board.map((row, r) => row.map((type, c) => {
            const isSel = selected?.r===r && selected?.c===c;
            const isPop = matched?.[r]?.[c];
            const isInactive = type === -2;
            const isHint = hint && ((hint.r1===r && hint.c1===c) || (hint.r2===r && hint.c2===c));
            const bug = type >= 0 ? BUGS[type] : null;

            return (
              <div
                key={`${r}-${c}`}
                className={`cell ${isSel?"sel":""} ${isPop?"popping":""} ${isHint?"hint-cell":""}`}
                onClick={() => !isInactive && handleClick(r, c)}
                style={{
                  width: cellSize, height: cellSize,
                  borderRadius: 10,
                  background: isInactive ? "transparent"
                    : bug ? `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.1), ${bug.bg})`
                    : "rgba(0,30,0,0.3)",
                  border: isInactive ? "none"
                    : isSel ? "2px solid #aaff66"
                    : isHint ? "2px solid #FFD700"
                    : bug ? `1px solid ${bug.border}`
                    : "1px solid rgba(100,200,50,0.2)",
                  boxShadow: isSel
                    ? `0 0 12px #88ff44, inset 0 0 6px rgba(180,255,100,0.2)`
                    : isInactive ? "none"
                    : "0 2px 5px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "clamp(20px, 5.5vw, 30px)",
                  userSelect: "none",
                  cursor: isInactive ? "default" : "pointer",
                  opacity: isInactive ? 0 : 1,
                  transition: "box-shadow 0.15s, transform 0.12s",
                }}
              >
                {bug?.emoji}
              </div>
            );
          }))}
        </div>

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} className="particle" style={{
            left: `calc(${p.c} * (${cellSize} + 3px) + 6px + calc(${cellSize}/2))`,
            top: `calc(${p.r} * (${cellSize} + 3px) + 6px + calc(${cellSize}/2))`,
            "--dx": `${p.dx}px`, "--dy": `${p.dy}px`,
            fontSize: "clamp(14px,4vw,20px)",
          }}>
            {BUGS[p.type]?.emoji}
          </div>
        ))}
      </div>

      {/* Level */}
      <div style={{ color: "rgba(180,255,120,0.5)", fontSize: 13, marginTop: 8, zIndex: 10, display: "flex", alignItems: "center", gap: 8 }}>
        Level {level + 1} of {LEVELS.length}
        {hint && (
          <span style={{
            background: "rgba(255,215,0,0.15)", border: "1px solid #FFD700",
            color: "#FFD700", borderRadius: 8, fontSize: 11, padding: "2px 8px",
            animation: "hint-arrow 0.9s ease-in-out infinite",
          }}>
            💡 Try the glowing bugs!
          </span>
        )}
      </div>

      {/* Combo popup */}
      {comboShow && (
        <div className="combo-pop" style={{
          position: "fixed", top: "45%", left: "50%",
          zIndex: 200, pointerEvents: "none", textAlign: "center",
        }}>
          <div style={{ fontSize: 50 }}>🦂</div>
          <div style={{
            fontSize: 34, color: "#FFD700", fontWeight: 900,
            textShadow: "0 0 16px #FF8800, 0 3px 6px rgba(0,0,0,0.7)",
          }}>{comboShow}× COMBO!</div>
        </div>
      )}

      {/* Level Up */}
      {levelUp && (
        <div className="lvup-pop" style={{
          position: "fixed", top: "50%", left: "50%",
          zIndex: 200, pointerEvents: "none", textAlign: "center",
          background: "rgba(0,30,0,0.85)", padding: "22px 36px", borderRadius: 20,
          border: "2px solid #88ff44", boxShadow: "0 0 40px rgba(100,255,50,0.4)",
        }}>
          <div style={{ fontSize: 44 }}>🌿</div>
          <div style={{ fontSize: 28, color: "#88FF44", fontWeight: 900 }}>LEVEL UP!</div>
          <div style={{ color: "rgba(200,255,180,0.7)", fontSize: 16 }}>Level {level + 1}</div>
        </div>
      )}

      {/* Game Over */}
      {(gameOver || victory) && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,10,0,0.82)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 300, backdropFilter: "blur(8px)",
        }}>
          <div className="lvup-pop" style={{
            background: "linear-gradient(160deg, #071a07, #0d300d)",
            border: `2px solid ${victory ? "#88ff44" : "#885533"}`,
            borderRadius: 24, padding: "36px 44px", textAlign: "center",
            boxShadow: `0 0 50px ${victory ? "rgba(100,255,50,0.4)" : "rgba(150,80,20,0.4)"}`,
          }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>{victory ? "🏆" : "💀"}</div>
            <div style={{ fontSize: 30, color: victory ? "#88FF44" : "#FF6633", fontWeight: 900, marginBottom: 4 }}>
              {victory ? "YOU WIN!" : "Game Over"}
            </div>
            <div style={{ fontSize: 16, color: "rgba(200,255,180,0.6)", marginBottom: 24 }}>
              Final Score: <span style={{ color: "#FFD700", fontWeight: 900 }}>{score.toLocaleString()}</span>
            </div>
            <button onClick={restart} style={{
              background: "linear-gradient(135deg, #226622, #44bb22)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: "12px 30px", fontSize: 18, fontFamily: "inherit",
              fontWeight: 900, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(50,180,30,0.4)",
            }}>
              Play Again 🪲
            </button>
          </div>
        </div>
      )}

      <p style={{ color: "rgba(180,255,120,0.3)", fontSize: 11, marginTop: 10, zIndex: 10, fontFamily: "Nunito, sans-serif", textAlign: "center" }}>
        Tap two adjacent bugs to swap • Match 3+ to squash them
      </p>
    </div>
  );
}
