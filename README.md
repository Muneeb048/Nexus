# Business Nexus

Business Nexus is a comprehensive platform connecting entrepreneurs with investors, facilitating collaboration, funding, and seamless communication.

## Features

- **Role-Based Authentication (Milestone 2)**: Secure JWT login with distinct dashboards for Entrepreneurs and Investors.
- **Profiles & Matchmaking**: Detailed startup pitches and investor portfolios.
- **Collaboration Chamber (Milestone 3)**: Book, accept, and manage meetings with built-in conflict detection using React Big Calendar.
- **Video Calling (Milestone 4)**: Built-in P2P WebRTC video calls powered by Socket.IO for signaling.
- **Document Processing (Milestone 5)**: Upload pitch decks (Multer), view PDFs, and sign legally binding agreements with digital signatures stored securely.
- **Payment Engine (Milestone 6)**: Deposit, withdraw, and transfer funds seamlessly with Stripe integration.
- **Security Defenses (Milestone 7)**: Hardened Express server (Helmet, XSS Clean, Mongo Sanitize, Rate Limiter) and a mock 2FA email flow using Nodemailer.
- **API Documentation (Milestone 8)**: Explore the interactive Swagger UI.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, TailwindCSS, Socket.IO Client, Stripe Elements.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, JWT, Nodemailer, Stripe SDK.
- **Security**: bcryptjs, helmet, express-validator, xss-clean, express-mongo-sanitize, express-rate-limit.

## Setup Instructions

1. **Clone & Install**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/nexus
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   STRIPE_SECRET_KEY=sk_test_your_dummy_key_here
   ```

3. **Start Development Servers**
   ```bash
   # Terminal 1 (Backend)
   cd backend
   npm run dev

   # Terminal 2 (Frontend)
   cd frontend
   npm run dev
   ```

4. **API Documentation**
   Navigate to `http://localhost:5000/api-docs` once the backend is running.

## Deployment Instructions

### Frontend (Vercel)
The frontend is configured for deployment on Vercel via the `vercel.json` file which handles Single Page Application routing rewrites.
Simply import the `frontend` directory into Vercel and set the build command to `npm run build`.

### Backend (Render)
The backend is configured via `render.yaml`. Connect your repository to Render to automatically provision the Node.js web service and provide the required environment variables.
