/* DOOM Tracker - logica de la interfaz: estado, renderizado de vistas, modal de reseñas y estadisticas.
   Los datos llegan de js/api.js; los efectos visuales viven en js/effects.js. */
// ===== Estado global =====
let users = [];          // [{ id, name }] desde el backend
let contentList = [];    // [{ id, title, type, description, order_number, poster_url? }]
let reviews = [];        // [{ id, user_id, content_id, watched, rating, review, watched_at }]
let currentUserId = null, currentFilter = 'all', searchQuery = '', currentViewMode = 'grid';
let selectedModalRating = 0, lastMarked = null, shownProgress = 0;

// Escapa caracteres HTML para insertar texto del backend de forma segura en innerHTML.
function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Devuelve la reseña de un usuario para un contenido (o undefined si no existe).
function getReview(userId, contentId) {
    return reviews.find(r => r.user_id === userId && r.content_id === contentId);
}

// Indica si el usuario actual ya marcó como visto un contenido.
function seen(contentId) {
    const r = getReview(currentUserId, contentId);
    return !!(r && r.watched);
}

// Genera el póster (img) o, si el contenido no trae imagen, un marcador con la máscara de Doom.
function posterHTML(item, cls) {
    const url = item.poster_url || item.poster;
    if (url) return `<img src="${esc(url)}" alt="${esc(item.title)}" class="${cls}">`;
    return `<div class="${cls} poster-ph" role="img" aria-label="${esc(item.title)}"><svg viewBox="0 0 100 120" aria-hidden="true"><use href="#doom-mask"/></svg></div>`;
}

// Arranque: pide usuarios, contenido y reseñas al backend y pinta toda la interfaz.
async function init() {
    renderStarsContainer();
    try {
        [users, contentList, reviews] = await Promise.all([getUsers(), getContent(), getReviews()]);
        $('api-error').classList.add('hidden');
    } catch (err) {
        showError(err);
    }
    contentList.sort((a, b) => a.order_number - b.order_number);
    if (!users.some(u => u.id === currentUserId)) currentUserId = users.length ? users[0].id : null;
    renderUserSwitcher();
    refreshAll();
}

// Vuelve a pintar contenido, estadísticas, filtros y próximo objetivo.
function refreshAll() {
    renderContent();
    updateStats();
    updateFilterButtons();
    renderNextTarget();
}

// Muestra el aviso de error de conexión con botón para reintentar.
function showError(err) {
    const b = $('api-error');
    b.innerHTML = `No se pudo conectar con el servidor (${esc(err.message)}). <button onclick="init()" class="underline font-bold ml-1">Reintentar</button>`;
    b.classList.remove('hidden');
}

// Dibuja los botones de usuario del header a partir de la lista que llega del backend.
function renderUserSwitcher() {
    $('user-buttons').innerHTML = users.map(u => {
        const on = u.id === currentUserId;
        return `<button id="btn-user-${u.id}" onclick="switchUser(${u.id})" class="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold smooth-transition ${on ? 'bg-doom-greenDark text-white border border-doom-greenMid shadow glow-doom' : 'text-doom-silver hover:text-white'}"><i class="fa-solid fa-user-shield mr-1 ${on ? 'text-doom-gold' : ''}"></i> ${esc(u.name)}</button>`;
    }).join('');
}

// Cambia el usuario activo y refresca la interfaz.
function switchUser(userId) {
    currentUserId = userId;
    renderUserSwitcher();
    refreshAll();
}

// Cambia entre vista de cuadrícula, lista comparativa y línea de tiempo.
function setViewMode(mode) {
    currentViewMode = mode;
    const on = 'flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold bg-doom-greenDark text-white border border-doom-greenMid smooth-transition';
    const off = 'flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-bold text-doom-silver hover:text-white smooth-transition';
    ['grid', 'list'].forEach(m => { $('view-btn-' + m).className = m === mode ? on : off; });
    renderContent();
}

// Pinta el contenido según la vista activa, o el estado vacío si no hay resultados.
function renderContent() {
    const container = $('content-container'), filtered = getFilteredContent();
    $('result-summary').textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
    if (!filtered.length) {
        container.innerHTML = `<div class="bg-doom-grayDark border border-doom-steel/30 rounded-2xl p-8 text-center text-doom-silver/60"><i class="fa-solid fa-ghost text-4xl mb-2 text-doom-steel"></i><p class="text-sm font-semibold">${contentList.length ? 'No se encontró contenido con esos filtros.' : 'Aún no hay contenido registrado.'}</p></div>`;
    } else if (currentViewMode === 'grid') renderGridView(container, filtered);
    else if (currentViewMode === 'list') renderListView(container, filtered);
    postRender();
}

// Actualiza progreso global (contador animado y barra), promedio de calificaciones y el panel VS.
function updateStats() {
    const total = contentList.length, cnt = uid => reviews.filter(r => r.user_id === uid && r.watched).length;
    const mine = reviews.filter(r => r.user_id === currentUserId && r.watched), w = mine.length, el = $('stat-progress-text');
    $('stat-progress-bar').style.width = (total ? Math.round(w / total * 100) : 0) + '%';
    if (RM) { shownProgress = w; el.textContent = `${w} / ${total} COMPLETADOS`; }
    else {
        const from = shownProgress, t0 = performance.now(); shownProgress = w;
        (function step(t) { const k = Math.min(1, (t - t0) / 700); el.textContent = `${Math.round(from + (w - from) * k)} / ${total} COMPLETADOS`; if (k < 1) requestAnimationFrame(step); })(t0);
    }
    const rs = mine.filter(r => r.rating !== null && r.rating !== undefined).map(r => Number(r.rating));
    $('stat-avg-rating').innerText = `${rs.length ? (rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1) : '0.0'} / 10`;
    const uA = users[0] || { id: 0, name: '—' }, uB = users[1] || { id: 0, name: '—' };
    const a = cnt(uA.id), b = cnt(uB.id);
    $('vs-name1').textContent = uA.name; $('vs-name2').textContent = uB.name;
    $('vs-user1').innerText = a; $('vs-user2').innerText = b;
    $('vs-bar1').style.width = a / (total || 1) * 100 + '%'; $('vs-bar2').style.width = b / (total || 1) * 100 + '%';
    $('vs-side1').classList.toggle('vs-lead', a > b); $('vs-side2').classList.toggle('vs-lead', b > a);
    $('vs-status').textContent = a === b ? 'Empate en la incursión' : `${a > b ? uA.name : uB.name} domina la incursión por ${Math.abs(a - b)}`;
}

// Abre el modal de reseña con los datos actuales del usuario para ese contenido.
function openModal(contentId) {
    const item = contentList.find(c => c.id === contentId), review = getReview(currentUserId, contentId);
    $('modal-title').innerText = `CALIFICAR: ${item.title.toUpperCase()}`;
    $('modal-content-id').value = contentId;
    const ratingVal = review && review.rating !== null && review.rating !== undefined ? review.rating : '';
    selectedModalRating = ratingVal !== '' ? parseFloat(ratingVal) : 0;
    $('modal-rating').value = ratingVal;
    $('modal-review').value = review ? review.review || '' : '';
    $('modal-watched-at').value = review && review.watched_at ? String(review.watched_at).slice(0, 10) : new Date().toISOString().split('T')[0];
    updateStarColors(selectedModalRating);
    $('review-modal').classList.remove('hidden');
    setTimeout(() => popStars(selectedModalRating), 120);
}

// Crea o actualiza la reseña del usuario actual en el backend y en la lista local.
async function upsertReview(contentId, changes) {
    const existing = getReview(currentUserId, contentId);
    const payload = { user_id: currentUserId, content_id: contentId, watched: true, rating: null, review: '', watched_at: new Date().toISOString().split('T')[0], ...(existing || {}), ...changes };
    delete payload.id;
    const saved = await saveReviewApi(payload, existing && existing.id);
    const merged = { ...payload, ...(saved || {}) };
    if (existing) Object.assign(existing, merged); else reviews.push(merged);
}

// Marca o desmarca un contenido como visto para el usuario actual.
async function toggleWatched(contentId) {
    if (currentUserId === null) return;
    const was = seen(contentId);
    try { await upsertReview(contentId, { watched: !was }); } catch (err) { showError(err); return; }
    afterChange(contentId, !was);
}

// Guarda calificación, fecha y reseña del modal en el backend y refresca la interfaz.
async function saveReview(e) {
    e.preventDefault();
    if (currentUserId === null) return;
    const id = Number($('modal-content-id').value), was = seen(id);
    try {
        await upsertReview(id, { watched: true, rating: parseFloat($('modal-rating').value), review: $('modal-review').value, watched_at: $('modal-watched-at').value });
    } catch (err) { showError(err); return; }
    closeModal();
    afterChange(id, !was);
}

// Refresca la interfaz tras un cambio y lanza la celebración si algo se marcó como visto.
function afterChange(contentId, becameWatched) {
    lastMarked = becameWatched ? contentId : null;
    refreshAll();
    lastMarked = null;
    if (becameWatched) celebrate(contentId);
}

// Guarda el texto del buscador y vuelve a filtrar.
function handleSearch(val) {
    searchQuery = val.toLowerCase().trim();
    renderContent();
}

// Aplica búsqueda y filtro activo (todos / películas / series / pendientes) al contenido.
function getFilteredContent() {
    return contentList.filter(item => {
        const userReview = reviews.find(r => r.user_id === currentUserId && r.content_id === item.id);
        const isWatched = userReview ? userReview.watched : false;

        const matchesSearch = item.title.toLowerCase().includes(searchQuery);
        
        let matchesFilter = true;
        if (currentFilter === 'movie') matchesFilter = item.type === 'movie';
        if (currentFilter === 'series') matchesFilter = item.type === 'series';
        if (currentFilter === 'pending') matchesFilter = !isWatched;

        return matchesSearch && matchesFilter;
    });
}

// Cambia el filtro activo y refresca la lista.
function filterContent(type) {
    currentFilter = type;
    renderContent();
    updateFilterButtons();
}

// Vista 1: tarjetas con póster, estado de visto, calificación y botones.
function renderGridView(container, items) {
    let html = `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">`;

    items.forEach(item => {
        const userReview = reviews.find(r => r.user_id === currentUserId && r.content_id === item.id);
        const isWatched = userReview ? userReview.watched : false;
        const rating = userReview && userReview.rating ? userReview.rating : null;
        const reviewText = userReview && userReview.review ? userReview.review : '';
        const watchedAt = userReview && userReview.watched_at ? userReview.watched_at : null;

        html += `
            <div class="movie-card ${isWatched ? 'watched-poster border-doom-greenMid shadow-lg glow-doom' : 'border-doom-steel/30'} bg-doom-grayDark border rounded-2xl overflow-hidden flex flex-col justify-between hover:border-doom-gold/60 smooth-transition">
                <div>
                    <div class="relative h-56 sm:h-60 w-full overflow-hidden bg-doom-dark">
                        ${posterHTML(item, 'poster w-full h-full object-cover opacity-80 smooth-transition')}
                        <div class="absolute inset-0 bg-gradient-to-t from-doom-grayDark via-doom-grayDark/30 to-transparent"></div>
                        
                        <div class="absolute top-3 left-3 flex gap-2">
                            <span class="text-xs font-black px-2.5 py-1 rounded-lg bg-doom-dark/90 text-doom-gold border border-doom-gold/40 shadow">
                                #${item.order_number}
                            </span>
                        </div>

                        <div class="absolute top-3 right-3">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.type === 'series' ? 'bg-doom-brown text-white border border-doom-gold/30' : 'bg-doom-greenDark text-white border border-doom-greenMid'}">
                                ${item.type}
                            </span>
                        </div>

                        <div class="absolute bottom-2 left-4 right-4">
                            <h4 class="font-marvel-title text-2xl text-white leading-none tracking-wide">${esc(item.title)}</h4>${isWatched ? `<span class="watched-stamp inline-flex mt-2 items-center gap-1 px-2 py-1 rounded-full bg-doom-greenDark/90 border border-doom-greenMid text-[9px] font-black uppercase tracking-wider text-white"><i class="fa-solid fa-check text-doom-gold"></i> Visto</span>` : ``}
                        </div>
                    </div>

                    <div class="p-4 pt-1">
                        <p class="text-xs text-doom-silver/80 line-clamp-2">${esc(item.description)}</p>
                    </div>
                </div>

                <div class="p-4 pt-0 space-y-3">
                    ${isWatched ? `
                        <div class="bg-doom-dark/90 p-3 rounded-xl border border-doom-greenMid/50 text-xs space-y-1">
                            <div class="flex justify-between items-center">
                                <span class="font-bold text-doom-greenMid flex items-center gap-1">
                                    <i class="fa-solid fa-circle-check text-doom-gold"></i> Visto
                                </span>
                                <span class="font-marvel-title text-lg text-doom-gold">
                                    <i class="fa-solid fa-star mr-1 text-xs"></i>${rating ? rating : 'S/C'}/10
                                </span>
                            </div>
                            <p class="text-doom-silver/90 italic text-[11px] line-clamp-2">"${esc(reviewText) || 'Sin reseña redactada.'}"</p>
                            ${watchedAt ? `<div class="text-[10px] text-doom-steel text-right pt-1"><i class="fa-regular fa-calendar-check mr-1"></i>Visto el ${watchedAt}</div>` : ''}
                        </div>
                    ` : `
                        <div class="text-[11px] text-doom-silver/50 italic bg-doom-dark/40 p-2 rounded-lg border border-doom-steel/20 text-center">
                            Pendiente en tu lista.
                        </div>
                    `}

                    <div class="flex gap-2">
                        <button onclick="toggleWatched(${item.id})" class="flex-1 py-2 rounded-xl text-xs font-bold border smooth-transition flex items-center justify-center gap-2 ${isWatched ? 'bg-doom-greenDark/60 border-doom-greenMid text-white hover:bg-doom-greenDark' : 'bg-doom-dark border-doom-steel/40 text-doom-silver hover:text-white hover:border-doom-gold'}">
                            <i class="fa-solid ${isWatched ? 'fa-circle-check text-doom-gold' : 'fa-circle text-doom-steel/40'} text-xs"></i>
                            ${isWatched ? 'Visto' : 'Marcar Visto'}
                        </button>
                        <button onclick="openModal(${item.id})" class="px-3.5 py-2 rounded-xl bg-doom-dark border border-doom-steel/40 text-doom-gold hover:border-doom-gold smooth-transition">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
    container.classList.remove("content-fade");
    void container.offsetWidth;
    container.classList.add("content-fade");
}

// Vista 2: tabla comparativa (escritorio) y tarjetas compactas (móvil) con el avance de los dos usuarios.
function renderListView(container, items) {
    const uA = users[0] || { id: 0, name: '—' }, uB = users[1] || { id: 0, name: '—' };
    let html = `
        <div class="bg-doom-grayDark border border-doom-steel/30 rounded-2xl overflow-hidden shadow-xl p-3 sm:p-0">
            
            <!-- VISTA TABLA PARA PANTALLAS MD+ -->
            <div class="hidden sm:block overflow-x-auto">
                <table class="w-full text-left text-xs text-doom-silver">
                    <thead class="bg-doom-dark border-b border-doom-steel/30 text-doom-gold font-marvel-title text-base tracking-wider uppercase">
                        <tr>
                            <th class="p-4">#</th>
                            <th class="p-4">Contenido</th>
                            <th class="p-4">Tipo</th>
                            <th class="p-4 text-center">${esc(uA.name)}</th>
                            <th class="p-4 text-center">${esc(uB.name)}</th>
                            <th class="p-4 text-center">Tu Estado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-doom-steel/20">
    `;

    items.forEach(item => {
        const u1 = reviews.find(r => r.user_id === uA.id && r.content_id === item.id && r.watched);
        const u2 = reviews.find(r => r.user_id === uB.id && r.content_id === item.id && r.watched);
        
        const myReview = reviews.find(r => r.user_id === currentUserId && r.content_id === item.id);
        const isWatched = myReview ? myReview.watched : false;

        // Fila de Tabla Escritorio
        html += `
            <tr class="hover:bg-doom-dark/40 smooth-transition">
                <td class="p-4 font-bold text-doom-gold">#${item.order_number}</td>
                <td class="p-4 flex items-center gap-3">
                    ${posterHTML(item, 'w-10 h-14 object-cover rounded-lg border border-doom-steel/40')}
                    <div>
                        <h5 class="font-bold text-white text-sm">${esc(item.title)}</h5>
                        <p class="text-[11px] text-doom-silver/60 line-clamp-1 max-w-xs">${esc(item.description)}</p>
                    </div>
                </td>
                <td class="p-4 uppercase">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'series' ? 'bg-doom-brown text-white' : 'bg-doom-greenDark text-white'}">
                        ${item.type}
                    </span>
                </td>
                <td class="p-4 text-center">
                    ${u1 ? `<span class="px-2.5 py-1 rounded-full bg-doom-greenDark/40 border border-doom-greenMid text-white font-bold"><i class="fa-solid fa-check text-doom-gold mr-1"></i>${u1.rating ? u1.rating : 'Visto'}</span>` : `<span class="text-doom-steel/40 italic">Pendiente</span>`}
                </td>
                <td class="p-4 text-center">
                    ${u2 ? `<span class="px-2.5 py-1 rounded-full bg-doom-greenDark/40 border border-doom-greenMid text-white font-bold"><i class="fa-solid fa-check text-doom-gold mr-1"></i>${u2.rating ? u2.rating : 'Visto'}</span>` : `<span class="text-doom-steel/40 italic">Pendiente</span>`}
                </td>
                <td class="p-4 text-center">
                    <button onclick="toggleWatched(${item.id})" class="px-3 py-1.5 rounded-lg border text-xs font-bold smooth-transition ${isWatched ? 'bg-doom-greenDark border-doom-greenMid text-white' : 'bg-doom-dark border-doom-steel/40 text-doom-silver hover:text-white'}">
                        <i class="fa-solid ${isWatched ? 'fa-check' : 'fa-plus'} mr-1"></i> ${isWatched ? 'Visto' : 'Marcar'}
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>

            <!-- VISTA TARJETAS COMPACTAS PARA MÓVIL (PANTALLAS PEQUEÑAS) -->
            <div class="block sm:hidden space-y-3">
    `;

    items.forEach(item => {
        const u1 = reviews.find(r => r.user_id === uA.id && r.content_id === item.id && r.watched);
        const u2 = reviews.find(r => r.user_id === uB.id && r.content_id === item.id && r.watched);
        
        const myReview = reviews.find(r => r.user_id === currentUserId && r.content_id === item.id);
        const isWatched = myReview ? myReview.watched : false;

        html += `
            <div class="bg-doom-dark p-3 rounded-xl border border-doom-steel/30 space-y-2">
                <div class="flex items-center gap-3">
                    ${posterHTML(item, 'w-12 h-16 object-cover rounded-lg border border-doom-steel/40 shrink-0')}
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-start">
                            <span class="text-[10px] font-black text-doom-gold">#${item.order_number}</span>
                            <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${item.type === 'series' ? 'bg-doom-brown text-white' : 'bg-doom-greenDark text-white'}">${item.type}</span>
                        </div>
                        <h5 class="font-bold text-white text-xs truncate">${esc(item.title)}</h5>
                    </div>
                </div>

                <!-- Estado Comparativo en Celular -->
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-doom-steel/20 text-[11px]">
                    <div class="bg-doom-grayDark p-1.5 rounded text-center">
                        <span class="block text-[9px] font-bold text-doom-gold uppercase">${esc(uA.name)}</span>
                        <span class="font-bold text-white">${u1 ? `<i class="fa-solid fa-check text-doom-gold"></i> ${u1.rating || 'Visto'}` : 'Pendiente'}</span>
                    </div>
                    <div class="bg-doom-grayDark p-1.5 rounded text-center">
                        <span class="block text-[9px] font-bold text-doom-silver uppercase">${esc(uB.name)}</span>
                        <span class="font-bold text-white">${u2 ? `<i class="fa-solid fa-check text-doom-gold"></i> ${u2.rating || 'Visto'}` : 'Pendiente'}</span>
                    </div>
                </div>

                <button onclick="toggleWatched(${item.id})" class="w-full py-1.5 rounded-lg border text-xs font-bold smooth-transition ${isWatched ? 'bg-doom-greenDark border-doom-greenMid text-white' : 'bg-doom-grayDark border-doom-steel/40 text-doom-silver'}">
                    <i class="fa-solid ${isWatched ? 'fa-check' : 'fa-plus'} mr-1"></i> ${isWatched ? 'Visto' : 'Marcar como Visto'}
                </button>
            </div>
        `;
    });

    html += `
            </div>
        </div>
    `;

    container.innerHTML = html;
    container.classList.remove("content-fade");
    void container.offsetWidth;
    container.classList.add("content-fade");
}

// Tras pintar: asigna id y retraso de entrada a cada tarjeta, sella lo pendiente como CLASIFICADO y activa la animación de la línea de tiempo.
function postRender() {
    const c = $('content-container');
    c.querySelectorAll('.movie-card').forEach((card, i) => {
        card.style.setProperty('--i', i);
        const id = +((card.querySelector('[onclick*="("]').getAttribute('onclick').match(/\((\d+)\)/) || [])[1]);
        card.dataset.id = id;
        if (!card.classList.contains('watched-poster'))
            card.querySelector('.poster').insertAdjacentHTML('afterend', '<div class="classified-ov"><i class="fa-solid fa-lock"></i><span>CLASIFICADO</span></div>');
        if (id === lastMarked) card.classList.add('just-marked');
    });
}

// Muestra el siguiente contenido pendiente del usuario (próximo objetivo).
function renderNextTarget() {
    const target = document.getElementById('next-target');
    if (!target) return;

    const next = contentList.find(item => {
        const r = reviews.find(x => x.user_id === currentUserId && x.content_id === item.id);
        return !r || !r.watched;
    });

    if (!contentList.length) {
        target.innerHTML = '<p class="text-xs text-doom-silver/60 text-center">Aún no hay contenido registrado.</p>';
        return;
    }

    if (!next) {
        target.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-11 h-11 rounded-xl bg-doom-greenDark/50 border border-doom-greenMid flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-crown text-doom-gold"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black uppercase tracking-[.2em] text-doom-greenMid">Protocolo completado</p>
                    <h3 class="font-marvel-title text-xl text-white">TODO EL ARCHIVO HA SIDO VISTO</h3>
                </div>
            </div>`;
        return;
    }

    target.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            ${posterHTML(next, 'w-16 h-24 object-cover rounded-xl border border-doom-steel/40 shadow-lg shrink-0')}
            <div class="flex-1 min-w-0">
                <p class="text-[10px] font-black uppercase tracking-[.2em] text-doom-gold mb-1">Próximo objetivo • #${next.order_number}</p>
                <h3 class="font-marvel-title text-2xl sm:text-3xl text-white truncate">${esc(next.title)}</h3>
                <p class="text-xs text-doom-silver/65 mt-1 line-clamp-2">${esc(next.description)}</p>
            </div>
            <button onclick="toggleWatched(${next.id})" class="shrink-0 px-4 py-2.5 rounded-xl bg-doom-greenDark border border-doom-greenMid text-white text-xs font-black hover:bg-doom-greenMid smooth-transition">
                <i class="fa-solid fa-check text-doom-gold mr-1"></i> Marcar visto
            </button>
        </div>`;
}

// Fija la calificación al hacer clic en una estrella.
function handleStarClick(e, starIndex) {
    const rating = getRatingFromEvent(e, starIndex);
    selectedModalRating = rating;
    document.getElementById('modal-rating').value = rating;
    updateStarColors(rating);
    popStars(rating);
}

// Actualiza los contadores de los filtros y marca el filtro activo.
function updateFilterButtons() {
    const total = contentList.length;
    const movies = contentList.filter(x => x.type === 'movie').length;
    const series = contentList.filter(x => x.type === 'series').length;
    const pending = contentList.filter(item => {
        const r = reviews.find(x => x.user_id === currentUserId && x.content_id === item.id);
        return !r || !r.watched;
    }).length;

    document.getElementById('count-all').textContent = total;
    document.getElementById('count-movie').textContent = movies;
    document.getElementById('count-series').textContent = series;
    document.getElementById('count-pending').textContent = pending;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        const active = btn.dataset.filter === currentFilter;
        btn.classList.toggle('active', active);
    });
}

// Crea las 10 estrellas del modal de calificación.
function renderStarsContainer() {
    const container = document.getElementById('star-rating-container');
    container.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        container.innerHTML += `
            <i class="fa-solid fa-star smooth-transition hover:scale-125 p-0.5" 
               data-star="${i}" 
               onmousemove="handleStarHover(event, ${i})" 
               onclick="handleStarClick(event, ${i})"></i>`;
    }
}

// Calcula la calificación según la posición del mouse (mitad izquierda = media estrella).
function getRatingFromEvent(e, starIndex) {
    const rect = e.target.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const isHalf = hoverX < (rect.width / 2);
    return isHalf ? starIndex - 0.5 : starIndex;
}

// Previsualiza la calificación al pasar el mouse sobre las estrellas.
function handleStarHover(e, starIndex) {
    const rating = getRatingFromEvent(e, starIndex);
    updateStarColors(rating);
}

// Regresa las estrellas a la calificación elegida al quitar el mouse.
function resetStarsToSelected() {
    updateStarColors(selectedModalRating);
}

// Sincroniza las estrellas cuando se escribe el puntaje en el campo numérico.
function syncStarsFromInput(val) {
    const num = parseFloat(val) || 0;
    selectedModalRating = num;
    updateStarColors(num);
}

// Pinta las estrellas llenas, medias o vacías según la calificación.
function updateStarColors(rating) {
    const stars = document.querySelectorAll('#star-rating-container i');
    stars.forEach((star, index) => {
        const starVal = index + 1;
        if (rating >= starVal) {
            star.className = "fa-solid fa-star text-doom-gold smooth-transition hover:scale-125 p-0.5";
        } else if (rating >= starVal - 0.5) {
            star.className = "fa-solid fa-star-half-stroke text-doom-gold smooth-transition hover:scale-125 p-0.5";
        } else {
            star.className = "fa-solid fa-star text-doom-steel/30 smooth-transition hover:scale-125 p-0.5";
        }
    });
}

// Cierra el modal de reseña.
function closeModal() {
    document.getElementById('review-modal').classList.add('hidden');
}
