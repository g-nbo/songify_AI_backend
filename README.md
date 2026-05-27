# Songify AI — Backend

REST API for [Songify AI](https://songifyai.netlify.app). Handles authentication, Spotify track lookup, OpenAI song recommendations, and user favorites.

**[Frontend Repo](https://github.com/g-nbo/Songify_AI)** · [Deployed on Render](https://songify-ai-backend.onrender.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose) |
| Auth | bcryptjs, jsonwebtoken |
| HTTP Logging | morgan |
| AI | OpenAI API (GPT-3.5 Turbo) |
| Music | Spotify Web API |

---

## Project Structure

```
├── server.js              # Entry point — Express app, middleware, routes
├── routes/
│   ├── users.js           # Auth routes
│   └── songify.js         # Song recommendation + favorites routes
├── controllers/
│   ├── users.js           # Auth logic (register, login, refresh, logout)
│   └── songify.js         # OpenAI + Spotify logic, favorites CRUD
├── middleware/
│   └── auth.js            # JWT verification middleware
├── models/
│   └── User.js            # Mongoose user schema
└── config/
    └── db-connection.js   # MongoDB connection
```

---

## API Reference

### Auth — `/users`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/users/register` | None | Create a new account |
| `POST` | `/users/login` | None | Login — sets httpOnly refresh cookie, returns access token |
| `POST` | `/users/refresh` | Refresh cookie | Issue a new access token |
| `POST` | `/users/logout` | Refresh cookie | Clear the refresh cookie |
| `PATCH` | `/users/update` | Bearer | Update display name |

### Songs — `/songify`

All routes require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/songify/song` | Get an AI song recommendation for a given message |
| `GET` | `/songify/track/:id` | Fetch Spotify track metadata (name, artist, album art) |
| `POST` | `/songify/favorite` | Add a track to the user's favorites |
| `DELETE` | `/songify/favorite/delete` | Remove a track from the user's favorites |
| `GET` | `/songify/favorites` | Get the authenticated user's favorites |

---

## Authentication

Token strategy: short-lived **access token** (15 min, returned in JSON) + long-lived **refresh token** (7 days, httpOnly cookie).

- Access token travels in the `Authorization: Bearer` header — never stored in the browser
- Refresh token is set as a `sameSite=none; Secure` httpOnly cookie — required for cross-origin use between Netlify and Render
- `POST /users/refresh` verifies the cookie and issues a new access token
- All protected routes run through `middleware/auth.js`, which sets `req.userId` from the decoded JWT — the request body is never trusted for user identity

---

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB instance (local or Atlas)
- Spotify Developer app (Client ID + Secret)
- OpenAI API key

### Setup

```bash
git clone https://github.com/g-nbo/songify_AI_backend
cd songify_AI_backend
npm install
```

Create a `.env` file in the root:

```env
MONGODB_URI=mongodb://localhost:27017/songify
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
OPENAI_API_KEY=your_openai_key
NODE_ENV=development
```

```bash
npm run dev   # nodemon — restarts on file changes
npm start     # production
```

Server runs on `http://localhost:8000` by default.

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `CLIENT_URL` | Frontend origin used for CORS (`https://songifyai.netlify.app` in prod) |
| `CLIENT_ID` | Spotify app Client ID |
| `CLIENT_SECRET` | Spotify app Client Secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `NODE_ENV` | Set to `production` on Render |
| `PORT` | Optional — defaults to 8000 |

---

## Deployment

Deployed on [Render](https://render.com) as a web service.

- Set all environment variables above in the Render dashboard
- Start command: `node server.js`
- The `CLIENT_URL` must exactly match the Netlify frontend origin — CORS will reject other origins
