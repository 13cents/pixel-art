// DOOM Fire Pixel Art Engine (PSX algorithm)

const canvas = document.getElementById('fireCanvas');
const ctx = canvas.getContext('2d');
const $ = (id) => document.getElementById(id);

const PALETTES = {
  classic: [
    [7,7,7],[31,7,7],[47,15,7],[71,15,7],[87,23,7],[103,31,7],[119,31,7],[143,39,7],
    [159,47,7],[175,63,7],[191,71,7],[199,71,7],[223,79,7],[223,87,7],[223,87,7],[215,95,7],
    [215,95,7],[215,103,15],[207,111,15],[207,119,15],[207,127,15],[207,135,23],[199,135,23],
    [199,143,23],[199,151,31],[191,159,31],[191,159,31],[191,167,39],[191,167,39],[191,175,47],
    [183,175,47],[183,183,47],[183,183,55],[207,207,111],[223,223,159],[239,239,199],[255,255,255]
  ],
  hellfire: [
    [7,7,15],[10,15,35],[12,25,55],[15,35,80],[18,50,110],[20,65,140],[22,80,165],[25,95,185],
    [28,110,200],[30,125,215],[35,145,225],[40,160,230],[45,175,235],[55,190,240],[70,205,245],
    [90,220,250],[120,230,250],[150,238,252],[180,245,253],[210,250,254],[255,255,255]
  ],
  toxic: [
    [5,10,5],[10,25,10],[15,45,15],[20,65,20],[25,90,25],[30,115,30],[35,140,35],[40,165,40],
    [50,190,50],[70,210,70],[100,225,90],[135,235,120],[170,245,150],[210,250,190],[240,255,220],[255,255,255]
  ],
  neon: [
    [10,5,15],[25,10,35],[45,15,60],[70,20,90],[105,25,120],[140,30,145],[175,40,170],
    [205,55,190],[225,80,210],[240,110,225],[250,150,235],[255,190,245],[255,255,255]
  ],
  grayscale: [
    [10,10,10],[25,25,25],[40,40,40],[60,60,60],[80,80,80],[105,105,105],[130,130,130],
    [160,160,160],[190,190,190],[220,220,220],[245,245,245],[255,255,255]
  ]
};

// State
let W = 80, H = 60, N = W * H;
let fire, imgData, buf32;
let palette = PALETTES.classic, lookup = [];
let burning = true, paused = false;
let wind = 0, decay = 3, speed = 60, brush = 4;
let emberOn = true, barrierOn = true, ember = [];
let mouse = { down: false, inside: false, x: 0, y: 0, erase: false };

function pack([r, g, b]) { return (255 << 24) | (b << 16) | (g << 8) | r; }
function rebuildLookup() { lookup = palette.map(pack); }

function resize(w, h) {
  W = w; H = h; N = W * H;
  canvas.width = W; canvas.height = H;
  fire = new Uint8Array(N);
  imgData = ctx.createImageData(W, H);
  buf32 = new Uint32Array(imgData.data.buffer);
  ember = [];
  $('resDisplay').textContent = `${W} × ${H}`;
  seedSource();
}

function seedSource() {
  const row = (H - 1) * W, max = palette.length - 1;
  for (let x = 0; x < W; x++) fire[row + x] = burning ? max : 0;
}

function barrierActive() {
  return barrierOn && mouse.inside && !(mouse.down && !mouse.erase);
}

function isBlocked(x, y) {
  if (!barrierActive()) return false;
  const dx = x - mouse.x, dy = y - mouse.y;
  if (dx * dx + dy * dy <= brush * brush) return true;
  if (y <= mouse.y) {
    const distUp = mouse.y - y;
    const shadowX = mouse.x + distUp * wind;
    if (Math.abs(x - shadowX) <= brush) return true;
  }
  return false;
}

function applyBarrier() {
  if (!barrierActive()) return;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isBlocked(x, y)) fire[y * W + x] = 0;
    }
  }
}

function step() {
  seedSource();
  applyBarrier();
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x, p = fire[i];
      const dx = Math.floor(Math.random() * 3) - 1 + wind;
      let nx = x + dx;
      if (nx < 0) nx += W; else if (nx >= W) nx -= W; // wrap horizontally
      if (p === 0) {
        fire[(y - 1) * W + nx] = 0;
        fire[i - W] = 0;
        continue;
      }
      const d = Math.floor(Math.random() * decay) & 1;
      const nextVal = p > d ? p - d : 0;
      if (isBlocked(nx, y - 1)) {
        if (y - 1 >= mouse.y - brush) {
          const side = x < mouse.x ? -1 : x > mouse.x ? 1 : (wind >= 0 ? 1 : -1);
          const defX = (x + side * 2 + W) % W;
          if (!isBlocked(defX, y - 1)) {
            fire[(y - 1) * W + defX] = nextVal;
          }
        }
      } else {
        fire[(y - 1) * W + nx] = nextVal;
      }
    }
  }
  applyBarrier();
  if (emberOn && burning) updateEmbers();
  if (mouse.down) paint();
}

function paint() {
  const max = palette.length - 1;
  for (let dy = -brush; dy <= brush; dy++) {
    for (let dx = -brush; dx <= brush; dx++) {
      if (dx * dx + dy * dy > brush * brush) continue;
      const x = mouse.x + dx, y = mouse.y + dy;
      if (x < 0 || x >= W || y < 0 || y >= H - 1) continue;
      fire[y * W + x] = mouse.erase ? 0 : max;
    }
  }
}

function updateEmbers() {
  if (Math.random() < 0.4) {
    // spawn from a hot pixel near the top of the flame
    const x = Math.floor(Math.random() * W);
    for (let y = 0; y < H; y++) {
      if (fire[y * W + x] > palette.length * 0.5) {
        ember.push({ x, y, vx: (Math.random() - 0.5) * 0.4 + wind * 0.2, vy: -(0.3 + Math.random() * 0.6), life: 30 + Math.random() * 40 });
        break;
      }
    }
  }
  for (const e of ember) { e.x += e.vx; e.y += e.vy; e.life--; }
  ember = ember.filter((e) => e.life > 0 && e.y >= 0 && e.x >= 0 && e.x < W && !isBlocked(e.x | 0, e.y | 0));
}

function render() {
  const max = palette.length - 1;
  for (let i = 0; i < N; i++) buf32[i] = lookup[Math.min(fire[i], max)];
  for (const e of ember) {
    const i = (e.y | 0) * W + (e.x | 0);
    if (i >= 0 && i < N) buf32[i] = lookup[max];
  }
  if (barrierActive()) {
    const rim = pack([55, 40, 38]);
    const rMax = brush * brush;
    const rMin = (brush - 1) * (brush - 1);
    for (let dy = -brush; dy <= brush; dy++) {
      const y = mouse.y + dy;
      if (y < 0 || y >= H) continue;
      for (let dx = -brush; dx <= brush; dx++) {
        const x = mouse.x + dx;
        if (x < 0 || x >= W) continue;
        const distSq = dx * dx + dy * dy;
        if (distSq <= rMax && distSq >= rMin) {
          buf32[y * W + x] = rim;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

// Loop with speed cap
let last = performance.now(), acc = 0, fpsT = last, frames = 0;
function loop(t) {
  const dt = t - last; last = t;
  if (!paused) {
    acc += dt;
    const interval = 1000 / speed;
    let guard = 0;
    while (acc >= interval && guard++ < 4) { step(); acc -= interval; }
    if (guard === 4) acc = 0;
  }
  render();
  frames++;
  if (t - fpsT >= 500) {
    $('fpsDisplay').textContent = Math.round(frames * 1000 / (t - fpsT));
    frames = 0; fpsT = t;
  }
  requestAnimationFrame(loop);
}

// Controls
function bindToggle(btnId, onclick) { $(btnId).addEventListener('click', onclick); }

bindToggle('toggleFire', () => {
  burning = !burning;
  $('toggleFire').textContent = burning ? 'Kill Fire' : 'Ignite Fire';
  $('toggleFire').classList.toggle('active', burning);
  seedSource();
});
bindToggle('pauseBtn', () => {
  paused = !paused;
  $('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
  $('pauseBtn').classList.toggle('active', paused);
});
bindToggle('stepBtn', () => { if (paused) step(); });
bindToggle('resetBtn', () => { fire.fill(0); ember = []; seedSource(); });
bindToggle('embersBtn', () => {
  emberOn = !emberOn; ember = [];
  $('embersBtn').classList.toggle('active', emberOn);
});
bindToggle('barrierBtn', () => {
  barrierOn = !barrierOn;
  $('barrierBtn').classList.toggle('active', barrierOn);
});
bindToggle('scanBtn', () => {
  const on = $('scanBtn').classList.toggle('active');
  document.querySelector('.canvas-wrapper').classList.toggle('scanlines', on);
});
bindToggle('saveBtn', () => {
  const c = document.createElement('canvas');
  c.width = W * 8; c.height = H * 8;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(canvas, 0, 0, c.width, c.height);
  const a = document.createElement('a');
  a.download = 'doom-fire.png';
  a.href = c.toDataURL('image/png');
  a.click();
});

const windBtns = { '-1': $('windLeft'), '0': $('windCalm'), '1': $('windRight') };
for (const [v, btn] of Object.entries(windBtns)) {
  btn.addEventListener('click', () => {
    wind = +v;
    Object.values(windBtns).forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

$('decayRange').addEventListener('input', (e) => { decay = +e.target.value; $('decayValue').textContent = decay; });
$('speedRange').addEventListener('input', (e) => { speed = +e.target.value; $('speedValue').textContent = speed; });
$('brushRange').addEventListener('input', (e) => { brush = +e.target.value; $('brushValue').textContent = brush; });
$('paletteSelect').addEventListener('change', (e) => {
  palette = PALETTES[e.target.value]; rebuildLookup(); seedSource();
});
$('resSelect').addEventListener('change', (e) => {
  const [w, h] = e.target.value.split('x').map(Number); resize(w, h);
});

// Mouse / touch painting: left = ignite, right = extinguish
function pos(ev) {
  const r = canvas.getBoundingClientRect();
  const p = ev.touches ? ev.touches[0] : ev;
  mouse.x = Math.floor((p.clientX - r.left) / r.width * W);
  mouse.y = Math.floor((p.clientY - r.top) / r.height * H);
}
canvas.addEventListener('mouseenter', (e) => { mouse.inside = true; pos(e); });
canvas.addEventListener('mousedown', (e) => { mouse.down = true; mouse.inside = true; mouse.erase = e.button === 2 || e.shiftKey; pos(e); });
canvas.addEventListener('mousemove', (e) => { mouse.inside = true; pos(e); });
canvas.addEventListener('mouseleave', () => { mouse.inside = false; });
window.addEventListener('mouseup', () => (mouse.down = false));
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('touchstart', (e) => { mouse.down = true; mouse.inside = true; mouse.erase = false; pos(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { mouse.inside = true; pos(e); e.preventDefault(); }, { passive: false });
canvas.addEventListener('touchend', () => { mouse.down = false; mouse.inside = false; });

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT') return;
  if (e.code === 'Space') { e.preventDefault(); $('pauseBtn').click(); }
  else if (e.key === 'b') $('barrierBtn').click();
  else if (e.key === 'r') $('resetBtn').click();
  else if (e.key === 'k') $('toggleFire').click();
  else if (e.key === 's') $('saveBtn').click();
  else if (e.key === 'ArrowLeft') $('windLeft').click();
  else if (e.key === 'ArrowRight') $('windRight').click();
  else if (e.key === 'ArrowDown') $('windCalm').click();
});

rebuildLookup();
resize(80, 60);
requestAnimationFrame(loop);
