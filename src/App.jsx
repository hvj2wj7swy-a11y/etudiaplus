import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import Footer from './components/Footer.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Subscription from './pages/Subscription.jsx'
import Payment from './pages/Payment.jsx'
import AccessDenied from './pages/AccessDenied.jsx'
import Profile from './pages/Profile.jsx'
import Documents from './pages/Documents.jsx'
import Favorites from './pages/Favoris.jsx'
import PWADiagnostic from './pages/PWADiagnostic.jsx'
import Forum from './pages/Forum.jsx'
import Agenda from './pages/Agenda.jsx'
import Travaux from './pages/Travaux.jsx'
import CalculateurNotes from './pages/CalculateurNotes.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Admin from './pages/Admin.jsx'
import Notes from './pages/Notes.jsx'
import NotebookEditor from './pages/NotebookEditor.jsx'
import TermsPage from './pages/TermsPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import { RequireAuth, RequireActiveSubscription, RequireAdmin } from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import FlashcardDeck from './pages/FlashcardDeck.jsx'

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/tools" replace />} />
          <Route path="/accueil" element={<Navigate to="/tools" replace />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/conditions" element={<TermsPage />} />
          <Route path="/confidentialite" element={<PrivacyPage />} />
          <Route path="/pwa-diagnostic" element={<PWADiagnostic />} />

          <Route element={<RequireAuth />}>
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/access-denied" element={<AccessDenied />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route element={<RequireActiveSubscription />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/tools" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/tools" replace />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/flashcards" element={<Flashcards />} />
            <Route path="/flashcards/:id" element={<FlashcardDeck />} />
            <Route path="/notes/:notebookId" element={<NotebookEditor />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/favoris" element={<Favorites />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/travaux" element={<Travaux />} />
            <Route path="/calculateur-notes" element={<CalculateurNotes />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </Router>
  )
}
