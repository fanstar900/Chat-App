# Quick Chat

A real-time one-to-one chat app built with the MERN stack and Socket.IO. Users can sign up, see who is online, send text and image messages that arrive instantly, track unread messages, and edit their profile.

**Live demo:** https://chat-app-frontend-2m7z.onrender.com

## Features

- **Authentication** – sign up / log in with email and password (bcrypt-hashed), JWT sessions that expire after 7 days
- **Real-time messaging** – messages are pushed to the receiver instantly over Socket.IO
- **Online status** – see which users are currently online
- **Image messages** – send images, stored on Cloudinary; a shared-media gallery per chat
- **Unread counts** – badge per contact, cleared when the chat is opened
- **Profile** – update name, bio and profile picture
- **User search** – filter the contact list by name
- **Responsive layout** – three-column layout on desktop, single view on mobile

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, React Router 7, Axios, socket.io-client, react-hot-toast |
| Backend  | Node.js, Express 5, Socket.IO 4, Mongoose 8, JSON Web Tokens, bcryptjs |
| Services | MongoDB (e.g. Atlas), Cloudinary (image storage) |

## Project Structure

```
Chat-App/
├── backend/
│   ├── controllers/      # userController (auth, profile), messageController
│   ├── lib/              # db connection, cloudinary config, JWT helpers
│   ├── middleware/       # protectRoute – verifies the JWT
│   ├── models/           # User, Message (Mongoose schemas)
│   ├── routes/           # /api/auth, /api/messages
│   └── server.js         # Express + Socket.IO server
└── frontend/
    ├── context/          # AuthContext (auth + socket), ChatContext (users + messages)
    ├── public/
    └── src/
        ├── components/   # Sidebar, ChatContainer, RightSidebar
        ├── pages/        # LoginPage, HomePage, ProfilePage
        └── lib/          # helpers
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com) account (free tier is enough)

### 1. Clone

```bash
git clone https://github.com/fanstar900/Chat-App.git
cd Chat-App
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
JWT_SECRET=<a long random string>
CLOUDINARY_CLOUD_NAME=<your cloud name>
CLOUDINARY_API_KEY=<your api key>
CLOUDINARY_API_SECRET=<your api secret>
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm start
```

You should see `MongoDB Connected` and `Server is running on PORT :5000`. Check it at http://localhost:5000/api/status.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173.

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string. The server exits if it can't connect. |
| `JWT_SECRET` | Yes | Secret used to sign tokens. The server refuses to start without it. |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `PORT` | No | Port to listen on (default `5000`) |
| `CLIENT_URL` | No | Allowed frontend origin(s) for CORS and Socket.IO, comma-separated, no trailing slash. Default `http://localhost:5173`. |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_BACKEND_URL` | Yes | URL of the backend, e.g. `http://localhost:5000` |

Never commit `.env` files – they are already listed in `.gitignore`.

## API Reference

All protected routes expect the JWT in a `token` request header. Responses have the shape `{ success, message?, ... }` with a matching HTTP status code (`400` bad input, `401` not authorized, `404` not found, `409` conflict, `500` server error).

### Auth – `/api/auth`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/signup` | – | `fullName, email, password, bio` | Create an account (password ≥ 6 chars). Returns `userData` and `token`. `409` if the email is taken. |
| POST | `/login` | – | `email, password` | Log in. Returns `userData` and `token`. |
| GET | `/check` | ✓ | – | Returns the logged-in `user`. |
| PUT | `/update-profile` | ✓ | `fullName, bio, profilePic?` | Update profile. `profilePic` is a base64 data URL. |

### Messages – `/api/messages`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| GET | `/users` | ✓ | – | All other users plus `unseenMessages` (`{ userId: count }`). |
| GET | `/:id` | ✓ | – | Conversation with user `:id`; marks their messages to you as seen. |
| POST | `/send/:id` | ✓ | `text?, image?` | Send a message to user `:id`. `image` is a base64 data URL. |
| PUT | `/mark/:id` | ✓ | – | Mark message `:id` as seen (receiver only). |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Health check – returns `Server is Live`. |

## Socket.IO Events

The client connects with its JWT: `io(BACKEND_URL, { auth: { token } })`. Connections without a valid token are rejected.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `getOnlineUsers` | server → client | `string[]` of user ids | Sent to everyone when a user connects or disconnects. |
| `newMessage` | server → client | message object | Sent to the receiver when a message is sent to them. |

## Deployment

The live demo runs on [Render](https://render.com) as two services:

- **Backend** – Web Service, root directory `backend`, build command `npm install`, start command `npm start`. Add all backend environment variables in the dashboard, with `CLIENT_URL` set to the deployed frontend URL.
- **Frontend** – Static Site, root directory `frontend`, build command `npm install && npm run build`, publish directory `dist`. Set `VITE_BACKEND_URL` to the deployed backend URL. Add a rewrite rule `/*` → `/index.html` so routes like `/profile` work on refresh.

`.env` files are not deployed – set the variables in the hosting dashboard.

## Scripts

| Location | Command | Description |
|----------|---------|-------------|
| `backend` | `npm start` | Start the API and socket server |
| `frontend` | `npm run dev` | Start the Vite dev server |
| `frontend` | `npm run build` | Production build into `dist/` |
| `frontend` | `npm run preview` | Preview the production build |
| `frontend` | `npm run lint` | Run ESLint |
