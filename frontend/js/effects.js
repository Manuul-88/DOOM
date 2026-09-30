/* DOOM Tracker - efectos visuales (particulas, inclinacion 3D, celebracion, modo Latveria, portal de entrada).
   Solo presentacion: no toca datos. */
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches; // respeta la preferencia de menos movimiento
const $ = id => document.getElementById(id); // atajo para getElementById

// --- Inclinacion 3D de las tarjetas + brillo que sigue el cursor ---
const cc = $('content-container');
cc.addEventListener('mousemove', e => {
    const c = e.target.closest('.movie-card'); if (!c || RM) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
    c.style.transform = `perspective(800px) rotateX(${(.5 - y) * 8}deg) rotateY(${(x - .5) * 8}deg) translateY(-6px)`;
});
cc.addEventListener('mouseout', e => { const c = e.target.closest('.movie-card'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });

// Efecto al marcar algo como visto: chispas, destello verde y, si se completó todo, lluvia de chispas.
function celebrate(id) {
    const el = document.querySelector(`[data-id="${id}"]`), r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    burst(r.left + r.width / 2, r.top + r.height / 2, 36);
    if (!RM) $('flash').animate([{ opacity: 0 }, { opacity: .35 }, { opacity: 0 }], { duration: 700 });
    if (contentList.every(i => seen(i.id))) for (let k = 0; k < 6; k++) setTimeout(() => burst(Math.random() * innerWidth, Math.random() * innerHeight * .6, 50), k * 220);
}

// Anima las estrellas seleccionadas con un pequeño "pop" escalonado.
function popStars(v) { if (RM) return; document.querySelectorAll('#star-rating-container i').forEach((s, i) => { if (i < Math.ceil(v)) s.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6) rotate(15deg)' }, { transform: 'scale(1)' }], { duration: 320, delay: i * 40 }); }); }

// --- Particulas: motas de energia de fondo + chispas ---
const cv = $('fx'), cx = cv.getContext('2d'); let P = [], M = [];
// Ajusta el canvas de particulas al tamano de la ventana.
const fit = () => { cv.width = innerWidth; cv.height = innerHeight; }; fit(); addEventListener('resize', fit);
for (let i = 0; !RM && i < 40; i++) M.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 1.8 + .6, v: Math.random() * .25 + .1, a: Math.random() * 6, g: Math.random() < .25 });
// Lanza una ráfaga de chispas desde un punto de la pantalla.
function burst(x, y, n) { if (RM) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = Math.random() * 6 + 2; P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 3, l: 1, g: Math.random() < .4 }); } }
// Bucle de animacion: dibuja motas de energia de fondo y las chispas activas.
(function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    M.forEach(m => { m.y -= m.v; m.a += .02; if (m.y < -5) { m.y = cv.height + 5; m.x = Math.random() * cv.width; }
        cx.globalAlpha = .25 + .2 * Math.sin(m.a); cx.fillStyle = m.g ? '#c49a3a' : '#5fa66a'; cx.beginPath(); cx.arc(m.x, m.y, m.r, 0, 6.28); cx.fill(); });
    P = P.filter(p => p.l > 0);
    P.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .18; p.vx *= .98; p.l -= .016; cx.globalAlpha = Math.max(p.l, 0); cx.fillStyle = p.g ? '#c49a3a' : '#5fa66a'; cx.fillRect(p.x, p.y, 3, 3); });
    requestAnimationFrame(loop);
})();

// --- Modo Latveria + portal de entrada ---
$('latveria-toggle').onclick = () => document.body.classList.toggle('latveria');
const pt = $('portal'); setTimeout(() => { pt.classList.add('open'); pt.addEventListener('animationend', () => pt.remove()); }, RM ? 0 : 1300);
