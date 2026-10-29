import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UserProtection from './components/UserProtection';
import AdminProtection from './components/AdminProtection';

// Lazy-loaded Views
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const MovieDetailsPage = lazy(() => import('./pages/MovieDetailsPage'));
const MovieShowsPage = lazy(() => import('./pages/MovieShowsPage'));
const SeatSelectionPage = lazy(() => import('./pages/SeatSelectionPage'));
const UserBookingsPage = lazy(() => import('./pages/UserBookingsPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));

// Admin Views
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AddMoviePage = lazy(() => import('./pages/admin/AddMoviePage'));
const AddTheatrePage = lazy(() => import('./pages/admin/AddTheatrePage'));
const AddShowPage = lazy(() => import('./pages/admin/AddShowPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen bg-[#0f171e] flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-4 border-[#00a8e1] border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-[#8197a4] text-xs font-semibold uppercase tracking-wider">
      Loading Prime Experience...
    </p>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0f171e] flex flex-col justify-between selection:bg-[#00a8e1] selection:text-white">
      <Navbar />

      <main className="flex-grow">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Root Redirect */}
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? '/home' : '/landing'} replace />}
            />

            {/* Public Routes */}
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* User Protected Routes */}
            <Route
              path="/home"
              element={
                <UserProtection>
                  <HomePage />
                </UserProtection>
              }
            />
            <Route
              path="/moviedetails/:movieId"
              element={
                <UserProtection>
                  <MovieDetailsPage />
                </UserProtection>
              }
            />
            <Route
              path="/movieshows/:movieId"
              element={
                <UserProtection>
                  <MovieShowsPage />
                </UserProtection>
              }
            />
            <Route
              path="/seatslug/:showId"
              element={
                <UserProtection>
                  <SeatSelectionPage />
                </UserProtection>
              }
            />
            <Route
              path="/bookings"
              element={
                <UserProtection>
                  <UserBookingsPage />
                </UserProtection>
              }
            />
            <Route
              path="/watchlist"
              element={
                <UserProtection>
                  <WatchlistPage />
                </UserProtection>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <AdminProtection>
                  <AdminDashboard />
                </AdminProtection>
              }
            />
            <Route
              path="/addmovie"
              element={
                <AdminProtection>
                  <AddMoviePage />
                </AdminProtection>
              }
            />
            <Route
              path="/addtheatre"
              element={
                <AdminProtection>
                  <AddTheatrePage />
                </AdminProtection>
              }
            />
            <Route
              path="/addshow"
              element={
                <AdminProtection>
                  <AddShowPage />
                </AdminProtection>
              }
            />
            <Route
              path="/adminbookings"
              element={
                <AdminProtection>
                  <AdminBookingsPage />
                </AdminProtection>
              }
            />

            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      {/* Prime Dark Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="!bg-[#1a242f] !text-white !border !border-[#2a3b4c] !rounded-xl !shadow-2xl text-xs sm:text-sm font-medium"
      />
    </div>
  );
}

export default App;
