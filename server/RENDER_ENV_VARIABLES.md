# 🚀 Render Deployment & Environment Variables Guide

To deploy **iMovies** on [Render](https://render.com), configure the following environment variables in your Render Web Service dashboard under **Environment**:

---

## 🔑 Backend Web Service Environment Variables (`imovies-api`)

| Key | Recommended Value | Notes |
|---|---|---|
| `NODE_ENV` | `production` | Production optimizations |
| `PORT` | `10000` | Render default web service port |
| `JWT_SECRET` | `your_jwt_secret_here` | Secure random secret for JWT sessions |
| `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/imovies` | MongoDB Atlas cluster connection string |
| `TMDB_API_KEY` | `f9e6f30f4548a45cc24820d273e12ec9` | Real-time market cinema catalog integration |
| `RAZORPAY_KEY_ID` | `rzp_test_TpQ7mg5jyDRTt0` | Test Mode Razorpay Key ID |
| `RAZORPAY_KEY_SECRET` | `your_razorpay_secret_here` | Test Mode Razorpay Secret |
| `BREVO_API_KEY` | `your_brevo_api_key_here` | Brevo Transactional Email API Key |
| `SENDER_EMAIL` | `sandeepnayak998182@gmail.com` | **CRITICAL:** Must be the validated Brevo sender address |
| `SENDER_NAME` | `iMovies` | Display name on outgoing emails |
| `CLIENT_URL` | `https://your-frontend-subdomain.onrender.com` | Frontend origin for activation links & CORS |

---

## 🎨 Frontend Static Site Environment Variables (`imovies-client`)

| Key | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://your-backend-subdomain.onrender.com/api` | Directs client Axios calls to the live backend |

---

## ⚡ Quick Render Setup Instructions

1. **Backend Service**:
   - **Type**: Web Service
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: Add all keys from the backend table above.

2. **Frontend Service**:
   - **Type**: Static Site
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Redirects/Rewrites**:
     - Source: `/*`
     - Destination: `/index.html`
     - Action: `Rewrite`
