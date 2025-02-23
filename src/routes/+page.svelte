<script lang="ts">
  import { onMount } from 'svelte';

  // スコアの型定義
  interface Score {
    id: number;
    score: number;
    createdAt: string;
  }

  // ゲームの状態
  let highScores: Score[] = [];
  let board: number[][] = Array(4).fill(null).map(() => Array(4).fill(0));
  let score = 0;
  let gameOver = false;
  let gameWon = false;
  let canContinue = false;
  let gameContainer: HTMLDivElement;

  // 新しいゲームの初期化
  function initGame() {
    try {
      board = Array(4).fill(null).map(() => Array(4).fill(0));
      score = 0;
      gameOver = false;
      gameWon = false;
      canContinue = false;
      addNewTile();
      addNewTile();
      if (gameContainer) {
        gameContainer.focus();
      }
    } catch (error) {
      console.error('Game initialization error:', error);
    }
  }

  // ランダムな位置に新しいタイルを追加
  function addNewTile() {
    try {
      const emptyCells = [];
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (board[i][j] === 0) {
            emptyCells.push({ x: i, y: j });
          }
        }
      }
      
      if (emptyCells.length > 0) {
        const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[x][y] = Math.random() < 0.9 ? 2 : 4;
        board = [...board]; // Svelteの反応性のため
      }
    } catch (error) {
      console.error('Add new tile error:', error);
    }
  }

  // 行の移動と合体
  function mergeLine(line: number[]): number[] {
    try {
      // 0を除去して詰める
      let merged = line.filter(num => num !== 0);
      
      // 隣接する同じ数字を合体
      for (let i = 0; i < merged.length - 1; i++) {
        if (merged[i] === merged[i + 1]) {
          merged[i] *= 2;
          score += merged[i];
          if (merged[i] === 2048 && !canContinue) {
            gameWon = true;
          }
          merged.splice(i + 1, 1);
        }
      }
      
      // 必要な分だけ0を追加
      while (merged.length < 4) {
        merged.push(0);
      }
      
      return merged;
    } catch (error) {
      console.error('Merge line error:', error);
      return line;
    }
  }

  // ボードの移動処理
  function move(direction: 'up' | 'down' | 'left' | 'right'): boolean {
    try {
      if (gameOver || (gameWon && !canContinue)) return false;

      const oldBoard = JSON.stringify(board);
      
      if (direction === 'left' || direction === 'right') {
        for (let i = 0; i < 4; i++) {
          let line = [...board[i]];
          if (direction === 'right') {
            line.reverse();
          }
          line = mergeLine(line);
          if (direction === 'right') {
            line.reverse();
          }
          board[i] = line;
        }
      } else {
        for (let j = 0; j < 4; j++) {
          let line = board.map(row => row[j]);
          if (direction === 'down') {
            line.reverse();
          }
          line = mergeLine(line);
          if (direction === 'down') {
            line.reverse();
          }
          for (let i = 0; i < 4; i++) {
            board[i][j] = line[i];
          }
        }
      }
      
      const moved = oldBoard !== JSON.stringify(board);
      if (moved) {
        board = [...board];
        addNewTile();
        checkGameOver();
      }
      return moved;
    } catch (error) {
      console.error('Move error:', error);
      return false;
    }
  }

  // ゲームオーバーチェック
  function checkGameOver() {
    try {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (board[i][j] === 0) return;
          if (i < 3 && board[i][j] === board[i + 1][j]) return;
          if (j < 3 && board[i][j] === board[i][j + 1]) return;
        }
      }
      gameOver = true;
    } catch (error) {
      console.error('Game over check error:', error);
    }
  }

  // キーボードイベントの処理
  function handleKeydown(event: KeyboardEvent) {
    try {
      const directions = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
      } as const;

      const direction = directions[event.key as keyof typeof directions];
      if (direction) {
        event.preventDefault();
        move(direction);
      }
    } catch (error) {
      console.error('Keyboard event error:', error);
    }
  }

  // タッチイベントの処理
  let touchStartX: number | null = null;
  let touchStartY: number | null = null;

  function handleTouchStart(event: TouchEvent) {
    try {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    } catch (error) {
      console.error('Touch start error:', error);
    }
  }

  function handleTouchEnd(event: TouchEvent) {
    try {
      if (!touchStartX || !touchStartY) return;

      const touchEndX = event.changedTouches[0].clientX;
      const touchEndY = event.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
          move('right');
        } else {
          move('left');
        }
      } else {
        if (deltaY > 0) {
          move('down');
        } else {
          move('up');
        }
      }

      touchStartX = null;
      touchStartY = null;
    } catch (error) {
      console.error('Touch end error:', error);
    }
  }

  // ゲーム継続
  function continueGame() {
    try {
      canContinue = true;
      gameWon = false;
    } catch (error) {
      console.error('Continue game error:', error);
    }
  }

  // スコアの保存
  async function saveScore(finalScore: number) {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: finalScore })
      });
      if (!response.ok) throw new Error('Failed to save score');
      await loadHighScores();
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  // ハイスコアの読み込み
  async function loadHighScores() {
    try {
      const response = await fetch('/api/scores');
      if (!response.ok) throw new Error('Failed to fetch scores');
      highScores = await response.json();
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
  }

  // ゲームオーバー時にスコアを保存
  function handleGameOver() {
    if (gameOver) {
      saveScore(score);
    }
  }

  // コンポーネントのマウント時に初期化
  onMount(async () => {
    try {
      await loadHighScores();
      initGame();
      if (gameContainer) {
        gameContainer.focus();
      }
    } catch (error) {
      console.error('Mount error:', error);
    }
  });

  $: if (gameOver) handleGameOver();
</script>

<svelte:head>
  <title>2048 Game</title>
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

<div class="game-container"
     bind:this={gameContainer}
     on:touchstart={handleTouchStart}
     on:touchend={handleTouchEnd}
     on:click={() => gameContainer?.focus()}
     tabindex="0"
     role="button"
     aria-label="2048 game board">
  <div class="header">
    <div class="scores">
      <div class="score-box">
        <div class="score-label">SCORE</div>
        <div class="score-value">{score}</div>
      </div>
    </div>
    <button class="new-game" on:click={initGame}>New Game</button>
  </div>

  <div class="board">
    {#each board as row, i}
      {#each row as cell, j}
        <div class="cell tile-{cell}">
          {cell || ''}
        </div>
      {/each}
    {/each}
  </div>

  {#if gameOver}
    <div class="overlay">
      <div class="message">
        <h2>Game Over!</h2>
        <p>Score: {score}</p>
        <div class="high-scores">
          <h3>High Scores</h3>
          <ul>
            {#each highScores as {score}, i}
              <li>{i + 1}. {score}</li>
            {/each}
          </ul>
        </div>
        <button on:click={initGame}>Try Again</button>
      </div>
    </div>
  {/if}

  {#if gameWon && !canContinue}
    <div class="overlay">
      <div class="message">
        <h2>You Won!</h2>
        <p>Score: {score}</p>
        <button on:click={continueGame}>Continue Playing</button>
        <button on:click={initGame}>New Game</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px;
    font-family: Arial, sans-serif;
    outline: none;
    cursor: default;
  }

  .game-container:focus-visible {
    outline: 2px solid #8f7a66;
    border-radius: 6px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .scores {
    display: flex;
    gap: 20px;
  }

  .score-box {
    background: #bbada0;
    padding: 10px 20px;
    border-radius: 3px;
    color: white;
  }

  .score-label {
    font-size: 13px;
    color: #eee4da;
  }

  .score-value {
    font-size: 20px;
    font-weight: bold;
  }

  .new-game {
    background: #8f7a66;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 3px;
    cursor: pointer;
    font-weight: bold;
  }

  .board {
    background: #bbada0;
    padding: 15px;
    border-radius: 6px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    touch-action: none;
  }

  .cell {
    background: #cdc1b4;
    aspect-ratio: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 35px;
    font-weight: bold;
    border-radius: 3px;
    color: #776e65;
    transition: background-color 0.15s ease;
  }

  .tile-2 { background: #eee4da; }
  .tile-4 { background: #ede0c8; }
  .tile-8 { background: #f2b179; color: white; }
  .tile-16 { background: #f59563; color: white; }
  .tile-32 { background: #f67c5f; color: white; }
  .tile-64 { background: #f65e3b; color: white; }
  .tile-128 { background: #edcf72; color: white; font-size: 30px; }
  .tile-256 { background: #edcc61; color: white; font-size: 30px; }
  .tile-512 { background: #edc850; color: white; font-size: 30px; }
  .tile-1024 { background: #edc53f; color: white; font-size: 25px; }
  .tile-2048 { background: #edc22e; color: white; font-size: 25px; }

  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(238, 228, 218, 0.73);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .message {
    background: white;
    padding: 30px;
    border-radius: 6px;
    text-align: center;
  }

  .message h2 {
    font-size: 30px;
    margin: 0 0 20px;
    color: #776e65;
  }

  .message p {
    font-size: 20px;
    color: #776e65;
    margin: 0 0 30px;
  }

  .message button {
    background: #8f7a66;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 3px;
    cursor: pointer;
    font-weight: bold;
    margin: 0 10px;
  }

  .high-scores {
    margin: 20px 0;
    text-align: left;
  }

  .high-scores h3 {
    color: #776e65;
    margin-bottom: 10px;
  }

  .high-scores ul {
    list-style: none;
    padding: 0;
  }

  .high-scores li {
    color: #776e65;
    margin: 5px 0;
    font-size: 16px;
  }

  @media (max-width: 500px) {
    .game-container {
      padding: 10px;
    }

    .board {
      gap: 10px;
      padding: 10px;
    }

    .cell {
      font-size: 25px;
    }

    .tile-128, .tile-256, .tile-512 {
      font-size: 20px;
    }

    .tile-1024, .tile-2048 {
      font-size: 18px;
    }
  }
</style>
