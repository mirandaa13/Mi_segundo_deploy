const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;
const GROUND_H = 70;
const GROUND_Y = H - GROUND_H;

const GRAVITY = 0.75;
const JUMP_FORCE = -14.5;
const BASE_SPEED = 6.5;
const MAX_SPEED = 14;

const player = {
  x: 140,
  y: 0,
  vy: 0,
  grounded: true,
  width: 34,
  height: 62
};

let obstacles = [];
let spawnTimer = 0;
let nextSpawnIn = randRange(65, 105);
let score = 0;
let frame = 0;
let running = true;
let gameOver = false;

function randRange(min, max) {
  return Math.floor(min + Math.random() * (max - min));
}

function currentSpeed() {
  return Math.min(MAX_SPEED, BASE_SPEED + score * 0.06);
}

function playerBox() {
  const feetY = GROUND_Y + player.y;
  const top = feetY - player.height;
  return { left: player.x - player.width / 2, top, right: player.x + player.width / 2, bottom: feetY + 6 };
}

function jump() {
  if (!running) return;
  if (player.grounded) {
    player.vy = JUMP_FORCE;
    player.grounded = false;
  }
}

function resetGame() {
  obstacles = [];
  spawnTimer = 0;
  nextSpawnIn = randRange(65, 105);
  score = 0;
  frame = 0;
  player.y = 0;
  player.vy = 0;
  player.grounded = true;
  gameOver = false;
  running = true;
}

function handleAction() {
  if (gameOver) {
    resetGame();
  } else {
    jump();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleAction();
  }
});
canvas.addEventListener('mousedown', handleAction);
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleAction();
}, { passive: false });

function spawnObstacle() {
  const h = randRange(32, 58);
  const w = randRange(18, 26);
  obstacles.push({ x: W + w, w, h, passed: false });
}

function update() {
  frame++;
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= 0) {
    player.y = 0;
    player.vy = 0;
    player.grounded = true;
  }

  const speed = currentSpeed();

  spawnTimer++;
  if (spawnTimer >= nextSpawnIn) {
    spawnObstacle();
    spawnTimer = 0;
    nextSpawnIn = Math.max(48, randRange(65, 105) - Math.floor(score / 4));
  }

  const box = playerBox();

  for (const ob of obstacles) {
    ob.x -= speed;

    const obLeft = ob.x;
    const obRight = ob.x + ob.w;
    const obTop = GROUND_Y - ob.h;
    const obBottom = GROUND_Y;

    const overlap = box.right > obLeft && box.left < obRight && box.bottom > obTop && box.top < obBottom;
    if (overlap) {
      gameOver = true;
      running = false;
    }

    if (!ob.passed && obRight < box.left) {
      ob.passed = true;
      score++;
    }
  }

  obstacles = obstacles.filter(ob => ob.x + ob.w > -5);
}

function drawBall(cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#d4f34a';
  ctx.fill();
  ctx.strokeStyle = '#a9c72e';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.75, 0.5, 2.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.75, Math.PI + 0.5, Math.PI + 2.3);
  ctx.stroke();
}

function drawPlayer() {
  const feetY = GROUND_Y + player.y;
  const legY = feetY - 8;
  const torsoY = feetY - 30;
  const headY = feetY - 55;

  const running_ = player.grounded;
  const swing = running_ ? Math.sin(frame * 0.35) * 9 : 0;

  drawBall(player.x - 8 + swing, legY, 8);
  drawBall(player.x + 8 - swing, legY, 8);

  drawBall(player.x - 17, torsoY - 4 - swing * 0.4, 6.5);
  drawBall(player.x + 17, torsoY - 4 + swing * 0.4, 6.5);

  drawBall(player.x, torsoY, 14);
  drawBall(player.x, headY, 11);

  ctx.fillStyle = '#1a2b32';
  ctx.beginPath();
  ctx.arc(player.x - 3.5, headY - 1, 1.4, 0, Math.PI * 2);
  ctx.arc(player.x + 3.5, headY - 1, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawCone(ob) {
  const baseY = GROUND_Y;
  const topY = GROUND_Y - ob.h;
  const cx = ob.x + ob.w / 2;

  ctx.fillStyle = '#e0611f';
  ctx.fillRect(ob.x - 3, baseY - 6, ob.w + 6, 6);

  ctx.fillStyle = '#ff7a3c';
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(ob.x + ob.w, baseY - 6);
  ctx.lineTo(ob.x, baseY - 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  const stripeY = topY + ob.h * 0.55;
  const stripeHalfW = (ob.w / 2) * ((baseY - 6 - stripeY) / ob.h) * 0.9;
  ctx.fillRect(cx - stripeHalfW, stripeY, stripeHalfW * 2, ob.h * 0.14);
}

function drawCourt() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, '#8fd9f2');
  sky.addColorStop(1, '#d9f3fb');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);

  ctx.fillStyle = '#fff9';
  ctx.beginPath();
  ctx.arc(90, 60, 22, 0, Math.PI * 2);
  ctx.arc(115, 55, 26, 0, Math.PI * 2);
  ctx.arc(140, 62, 20, 0, Math.PI * 2);
  ctx.fill();

  const court = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  court.addColorStop(0, '#2f9e44');
  court.addColorStop(1, '#237a35');
  ctx.fillStyle = court;
  ctx.fillRect(0, GROUND_Y, W, GROUND_H);

  ctx.strokeStyle = 'rgba(255,255,255,.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 6);
  ctx.lineTo(W, GROUND_Y + 6);
  ctx.stroke();

  const scrollOffset = (frame * (currentSpeed() * 0.4)) % 60;
  ctx.strokeStyle = 'rgba(255,255,255,.35)';
  ctx.lineWidth = 2;
  for (let x = -scrollOffset; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, GROUND_Y + 30);
    ctx.lineTo(x + 24, GROUND_Y + 30);
    ctx.stroke();
  }
}

function drawScore() {
  ctx.font = '700 22px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(26,43,50,.55)';
  ctx.fillText(String(score), W - 22 + 2, 40 + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(score), W - 22, 40);
  ctx.textAlign = 'left';
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(26,43,50,.55)';
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 40px -apple-system, sans-serif';
  ctx.fillText('¡Juego Terminado!', W / 2, H / 2 - 26);

  ctx.font = '600 20px -apple-system, sans-serif';
  ctx.fillText('Puntaje: ' + score, W / 2, H / 2 + 12);

  ctx.font = '500 15px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillText('Presiona espacio o toca para reiniciar', W / 2, H / 2 + 44);
  ctx.textAlign = 'left';
}

function loop() {
  if (running) update();

  drawCourt();
  for (const ob of obstacles) drawCone(ob);
  drawPlayer();
  drawScore();
  if (gameOver) drawGameOver();

  requestAnimationFrame(loop);
}

loop();
