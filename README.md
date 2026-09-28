# DOOM

## Avengers: Doomsday Tracker

Aplicación web privada para Manuel y Jovan que permite llevar el seguimiento de las películas y series necesarias para prepararse para **Avengers: Doomsday**.

La aplicación permitirá que cada usuario:

* Marque contenido como visto.
* Califique cada película o serie del 1 al 10.
* Escriba una reseña personal.
* Consulte su progreso.
* Compare estadísticas con el otro usuario.
* Lleve un orden de visualización.

> El proyecto está pensado como un tracker personal para dos usuarios.

---

## Arquitectura

El proyecto está dividido en backend y frontend:

```text
DOOM/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .gitignore
│
├── frontend/
│
├── README.md
└── .gitignore
```

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic

### Frontend

Por desarrollar.

---

## Base de datos

Actualmente se utilizan tres entidades principales:

### Users

Representa a los usuarios del tracker.

* `id`
* `name`

### Content

Representa una película o serie.

* `id`
* `title`
* `type`
* `description`
* `order_number`

Las series se manejan como un solo contenido. **No se registran episodios individualmente.**

### Reviews

Relaciona a un usuario con un contenido.

* `id`
* `user_id`
* `content_id`
* `watched`
* `rating`
* `review`
* `watched_at`

Cada usuario puede tener una sola reseña por contenido.

---

## Estado del proyecto

### Backend

* [x] FastAPI configurado
* [x] PostgreSQL conectado
* [x] SQLAlchemy configurado
* [x] Modelo de usuarios
* [x] Modelo de contenido
* [x] Modelo de reseñas
* [x] CRUD básico de usuarios
* [x] CRUD básico de contenido
* [x] Registro y actualización de reseñas
* [x] Documentación automática con Swagger

### Próximamente

* [ ] Carga automática del contenido
* [ ] Mejorar endpoints
* [ ] Estadísticas de progreso
* [ ] Sistema de autenticación
* [ ] Frontend
* [ ] Conexión frontend ↔ backend
* [ ] Diseño responsive
* [ ] Deploy

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd DOOM
```

### 2. Crear entorno virtual

```bash
cd backend
python -m venv venv
```

Activar en Windows:

```powershell
.\venv\Scripts\Activate.ps1
```

### 3. Instalar dependencias

```powershell
pip install -r requirements.txt
```

### 4. Configurar variables de entorno

Crear un archivo `.env` dentro de `backend/`:

```env
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/doom
```

> El archivo `.env` no se incluye en Git.

### 5. Ejecutar el backend

Desde `backend/`:

```powershell
uvicorn app.main:app --reload
```

API:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

---

## 👥utores

**Manuel**
**Jovan**

Proyecto personal / académico
---

## Objetivo

Crear una experiencia sencilla para que dos personas puedan seguir su preparación para **Avengers: Doomsday**, registrar sus opiniones y visualizar cuánto han avanzado en el recorrido.
