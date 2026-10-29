# 🎬 iMovies — Prime Movie Ticket Booking Platform

A full-stack, production-ready Movie Ticket Booking Web Application featuring a sleek, dark **Amazon Prime Video aesthetic** (`#0f171e` and `#1a242f` surfaces, crisp typography, Prime vibrant cyan accents `#00a8e1`, horizontal movie carousels with smooth card scaling, and real-time tier-based seat locking with TTL expiration).

---

## 🌟 Key Highlights & Amazon Prime Aesthetic

- **Live Market Movies via TMDB API**: Connected directly to **The Movie Database (TMDB) API v3** (`/movie/now_playing`, `/movie/popular`, `/movie/upcoming`, `/search/movie`, `/movie/{id}`) to display real-time blockbuster releases currently screening in cinemas worldwide.
- **Deep Dark Blue-Black Surfaces**: Styled with `#0f171e` background, `#1a242f` card surfaces, `#253342` hover elevation, and `#2a3b4c` subtle borders.
- **Prime Signature Accents**: Vibrant Prime Blue `#00a8e1` highlights, hover states `#1b9ce2`, and glowing cyan focus rings.
- **Cinematic Hero Carousels**: Full-bleed backdrop hero carousels with gradient overlays, official trailer modal player, Prime exclusive badges (`4K UHD`, `Dolby Atmos`, `IMDb 8.9`), and instant booking CTAs.
- **Horizontal Movie Carousels**: Smooth scrolling rows ("Trending Now", "Sci-Fi & Spectacle", "Action & High Stakes", "Critically Acclaimed Dramas") with card hover scaling.
- **Interactive Tier-Based Seat Map**: Realistic curved cinema screen visual with distinct auditorium classes:
  - **Balcony Class**: Premium Recliners (Top row elevation, premium price)
  - **Middle Class**: Prime Center View (Optimal sound & sightlines)
  - **Lower Class**: Value Front (Value price)
- **Real-Time Seat Locking with TTL Expiration**: Prevents double-booking by locking chosen seats with a 5-minute countdown timer. If checkout is not completed in time or the user navigates away, seats automatically unlock and become available for other customers.
- **Interactive Checkout Gateway**: Order summary with base ticket prices, 5% convenience fee, 3% integrated entertainment tax, support for Card, UPI/QR, Net Banking, and Amazon Pay, complete with celebration confetti.
- **Digital Boarding Pass Passes**: Prime-styled tickets with dynamically generated QR codes, barcodes, printable ticket mode, and instant cancellation with automatic seat release.
- **Full Admin Console**: Analytics dashboard with live platform revenue, active movie catalogs, theatre registrations, showtime schedulers, and reservation moderation tools.
- **Dual Database Resilience**: Mongoose ODM with MongoDB connection, and an automatic fallback to an in-memory/file-synced ODM store so the application runs immediately without requiring manual MongoDB database setup!

---

## 🏗️ Architecture & Tech Stack

### Client (Frontend)
- **Framework**: React.js 18 with Vite bundle
- **Routing**: React Router DOM (with lazy loading and code splitting)
- **Styling**: Tailwind CSS with custom Prime color palette & glow effects
- **Icons**: Lucide React
- **Notifications**: React-Toastify
- **HTTP Client**: Axios with automatic JWT interceptors
- **Visuals**: QRCode generator (`qrcode`), Canvas Confetti (`canvas-confetti`)

### Server (Backend)
- **Runtime**: Node.js & Express.js REST API
- **Payment Gateway**: **Razorpay (Test Mode)** with HMAC SHA256 signature verification & order management
- **Authentication**: JWT (JSON Web Tokens) with 7-day expiration & `bcryptjs` password hashing
- **Database**: MongoDB (Mongoose ODM) with schemas for Users, Admins, Movies, Theatres, Shows, Bookings, Watchlist, and Reviews
- **Reliability Engine**: Dual-mode database layer supporting local/remote MongoDB clusters and automatic fallback store.
- **Concurrency & TTL Engine**: Background sweeper and transactional checks for seat lock expiration (5-minute TTL).

---

## 🗄️ Database Schemas (Mongoose ODM)

1. **User Schema (`models/userModel.js`)**:
   - `username`: String, min 3, max 20, unique, required
   - `email`: String, unique, required, lowercase
   - `password`: String, min 6, hashed with bcryptjs
   - `role`: String ('user')

2. **Admin Schema (`models/adminModel.js`)**:
   - `username`: String, unique, required
   - `email`: String, unique, required
   - `password`: String, hashed with bcryptjs
   - `role`: String ('admin')

3. **Movie Schema (`models/movieModel.js`)**:
   - `movieName`: String, required, trim
   - `description`: String, required
   - `genres`: Array of Strings
   - `releaseDate`: Date, required
   - `language`: String, required
   - `duration`: String (e.g., "2h 45m")
   - `certification`: String (e.g., "U/A 16+", "A 18+")
   - `posterUrl`: String
   - `backdropUrl`: String
   - `trailerUrl`: String
   - `director`: String
   - `cast`: Array of Strings
   - `imdbRating`: Number (0-10)
   - `featured`: Boolean

4. **Theatre Schema (`models/theatreModel.js`)**:
   - `theatreName`: String, required
   - `location`: String, required
   - `balconySeatPrice`: Number, required
   - `middleSeatPrice`: Number, required
   - `lowerSeatPrice`: Number, required
   - `balconySeats`: Object (`{ rows: ['A', 'B'], seatsPerRow: 10 }`)
   - `middleSeats`: Object (`{ rows: ['C', 'D', 'E'], seatsPerRow: 12 }`)
   - `lowerSeats`: Object (`{ rows: ['F', 'G'], seatsPerRow: 12 }`)
   - `facilities`: Array of Strings

5. **Show Schema (`models/showModel.js`)**:
   - `adminEmail`: String, required
   - `showId`: String, required, unique
   - `movieId`: String, required
   - `theatreName`: String, required
   - `showDate`: Date, required
   - `showTime`: String, required
   - `tickets`: Object map (`{ [seatId]: { status, tier, price, lockedBy, lockExpiresAt, bookedBy } }`)

6. **Booking Schema (`models/bookingModel.js`)**:
   - `bookingId`: String, unique (e.g. `IMV-2026-48417`)
   - `userEmail`: String, required
   - `showId`: String, required
   - `selectedSeats`: Array of Strings
   - `seatDetails`: Array of Objects (`seatId`, `tier`, `price`)
   - `totalAmount`: Number
   - `convenienceFee`: Number
   - `taxes`: Number
   - `paymentStatus`: String ('Completed', 'Pending', 'Cancelled')
   - `paymentMethod`: String
   - `transactionId`: String

7. **Watchlist & Reviews (`favoriteModel.js` & `reviewModel.js`)**:
   - `Favorite`: `userEmail`, `movieId`
   - `Review`: `userEmail`, `username`, `movieId`, `rating` (1-5), `reviewText`

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- (Optional) MongoDB running locally or a MongoDB Atlas URI

### 1. Installation
Dependencies are already installed in both `server/` and `client/`. To re-install if needed:
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Environment Configuration (Optional)
The server works out-of-the-box with built-in fallbacks. You can optionally create `server/.env`:
```env
PORT=5000
JWT_SECRET=imovies_super_secret_jwt_key_2026
MONGO_URI=mongodb://127.0.0.1:27017/imovies
TMDB_API_KEY=f9e6f30f4548a45cc24820d273e12ec9
```

### 3. Launching the Application
Open two terminal windows:

**Terminal 1 — Backend REST API:**
```bash
cd server
npm start
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Demo Accounts

Use these pre-configured credentials or use the 1-click **"Fill Demo User"** / **"Fill Demo Admin"** buttons on the sign-in page:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Customer User** | `user@imovies.com` | `password123` | Browse catalog, stream trailers, lock seats, book tickets, view QR passes, manage watchlist, post reviews |
| **Administrator** | `admin@imovies.com` | `admin123` | Access Admin Console, view platform revenue, add movies, register theatres, schedule shows, audit all reservations |

---

## 📡 API Reference Overview

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Public | Health status & active database mode |
| `/api/auth/register` | POST | Public | Register new customer account |
| `/api/auth/login` | POST | Public | Customer authentication & JWT generation |
| `/api/auth/admin/login` | POST | Public | Administrator authentication |
| `/api/auth/me` | GET | User/Admin | Verify current session and fetch profile |
| `/api/movie` | GET | Public | List movies with genre, language, search filters |
| `/api/movie/:id` | GET | Public | Movie details and metadata |
| `/api/movie` | POST | Admin | Add new movie to catalog |
| `/api/theatre` | GET | Public | List all multiplex venues |
| `/api/theatre` | POST | Admin | Register theatre with tier seat pricing |
| `/api/shows/movie/:movieId` | GET | Public | Get show schedules filtered by date |
| `/api/shows/:showId` | GET | Public | Live auditorium seating map with status |
| `/api/shows` | POST | Admin | Schedule new show and generate seat layout |
| `/api/bookings/lock-seats` | POST | User | Place 5-minute TTL lock on chosen seats |
| `/api/bookings/unlock-seats` | POST | User | Release locked seats |
| `/api/bookings/confirm` | POST | User | Confirm payment and finalize ticket reservation |
| `/api/bookings/my-bookings` | GET | User | Retrieve digital ticket pass history |
| `/api/bookings/admin/all` | GET | Admin | View all platform bookings & revenue |
| `/api/bookings/cancel/:bookingId`| PUT | User/Admin | Cancel booking and release seats |
| `/api/favorite` | GET | User | View saved watchlist movies |
| `/api/favorite/toggle` | POST | User | Add / remove movie from watchlist |
| `/api/review/:movieId` | GET | Public | Fetch audience reviews for a movie |
| `/api/review` | POST | User | Submit 1-5 star movie review |
| `/api/payment/create-order` | POST | User | Create Razorpay order (amount in paise, receipt, notes) |
| `/api/payment/verify` | POST | User | Verify HMAC SHA256 signature, mark booked, generate ticket |

---

## 🎨 Design System Specifications
- **Amazon Prime Dark Palette**:
  - `#0f171e`: Prime cinematic background
  - `#1a242f`: Elevated container card
  - `#253342`: Hover card elevation
  - `#2a3b4c`: Structural border
  - `#00a8e1`: Vibrant Prime Blue highlight
  - `#1b9ce2`: Active action state
  - `#8197a4`: Muted secondary text
  - `#f59e0b`: IMDb & Balcony gold accent
- **Responsive Breakpoints**: Seamless mobile, tablet, and desktop layout with custom Prime horizontal carousel touch navigation and print-friendly styles.
