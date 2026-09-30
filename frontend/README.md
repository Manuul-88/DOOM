# Frontend - DOOM Avengers: Doomsday Tracker

Interfaz web (HTML + CSS + JavaScript sin build) del tracker. No trae datos de ejemplo: todo llega del backend.

## Estructura

```
frontend/
├── index.html            # estructura de la página
├── css/
│   ├── styles.css        # estilos y animaciones (tema DOOM)
│   └── icons.css         # iconos Font Awesome embebidos (sin CDN)
├── js/
│   ├── tailwind-config.js  # colores y fuentes de Tailwind
│   ├── api.js            # peticiones al backend (AQUÍ se ajustan las rutas)
│   ├── effects.js        # efectos visuales (partículas, tilt 3D, portal, modo Latveria)
│   ├── app.js            # estado, vistas, modal de reseñas y estadísticas
│   └── main.js           # arranque (llama a init())
└── assets/doom-logo.png
```

## Cómo probarlo

1. Levantar el backend (`uvicorn app.main:app --reload`, puerto 8000).
2. Abrir `index.html` (o `python -m http.server 5500` dentro de `frontend/`).

Tailwind y las fuentes de Google se cargan por CDN, así que se necesita internet.

## Conexión con el backend

Todo pasa por `js/api.js`. Rutas y formatos que espera:

| Función | Petición | Respuesta |
|---|---|---|
| `getUsers()` | `GET /users/` | `[{ id, name }]` |
| `getContent()` | `GET /content/` | `[{ id, title, type, description, order_number, poster_url? }]` |
| `getReviews()` | `GET /reviews/` | `[{ id, user_id, content_id, watched, rating, review, watched_at }]` |
| `saveReviewApi()` | `POST /reviews/` o `PUT /reviews/{id}` | la reseña guardada |

- `type` debe ser `movie` o `series`.
- Si el contenido no trae `poster_url`, se muestra un marcador con la máscara de Doom.
- Los dos primeros usuarios de la lista son los que se comparan en el panel VS.
- El backend necesita `CORSMiddleware` para aceptar peticiones desde el navegador.
- Si algo falla, la página muestra un aviso con botón "Reintentar".
