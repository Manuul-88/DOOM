/* DOOM Tracker - capa de comunicacion con el backend (FastAPI).
   Las rutas son una suposicion segun el README: si el backend usa otras, solo hay que cambiarlas aqui. */
const API_BASE_URL = 'http://localhost:8000'; // URL del backend (el backend debe permitir CORS para este origen)

// Hace una petición al backend y devuelve el JSON; lanza un error si la respuesta no es correcta.
async function apiRequest(path, options = {}) {
    const res = await fetch(API_BASE_URL + path, { headers: { 'Content-Type': 'application/json' }, ...options });
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}`);
    return res.status === 204 ? null : res.json();
}

// GET de todos los usuarios.
function getUsers() { return apiRequest('/users/'); } // -> [{ id, name }]

// GET de todo el contenido (películas y series).
function getContent() { return apiRequest('/content/'); } // -> [{ id, title, type ('movie'|'series'), description, order_number, poster_url? }]

// GET de todas las reseñas de todos los usuarios.
function getReviews() { return apiRequest('/reviews/'); } // -> [{ id, user_id, content_id, watched, rating, review, watched_at }]

// Crea (POST) o actualiza (PUT) una reseña; si viene existingId se actualiza.
function saveReviewApi(payload, existingId) {
    return existingId
        ? apiRequest(`/reviews/${existingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : apiRequest('/reviews/', { method: 'POST', body: JSON.stringify(payload) });
}
