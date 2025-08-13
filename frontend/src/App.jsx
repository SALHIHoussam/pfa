// app.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages publiques
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import ActivationResult from './pages/ActivationResult';
import RegisterAgentPKIPage from './pages/RegisterAgentPKIPage';
import RegisterParticipantPage from './pages/RegisterParticipantPage';
import RegisterVerificateurPage from './pages/RegisterVerificateurPage';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Pages principales par rôle
import AdminDashboard from './pages/AdminDashboard';
import AgentPKIHome from './pages/AgentPKIHome';
import ParticipantHome from './pages/ParticipantHome';
import VerificateurHome from './pages/VerificateurHome';

// Pages gestion cérémonies
import CeremoniesPage from './pages/CeremoniesPage';
import CeremonieDetailsPage from './pages/CeremonieDetailsPage';
import PlanifierCeremoniePage from './pages/PlanifierCeremoniePage';
import GenerateCertificatePage from './pages/GenerateCertificatePage';
import CeremonieRapportPDF from './pages/CeremonieRapportPDF';

// Pages spécifiques
import VerificationPage from './pages/VerificationPage';
import ParticipantCertificatesPage from './pages/ParticipantCertificatesPage';
import ParticipantCeremoniesPage from './pages/ParticipantCeremoniesPage';
import PresenceConfirm from './pages/PresenceConfirm';
import CeremoniesVerificateurPage from './pages/CeremoniesVerificateurPage.';
// Composants contrôle d'accès
import AdminRoute from './components/AdminRoute';
import PrivateRoute from './components/PrivateRoute';

// Composants communs
import Layout from './components/Layout';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection racine vers login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/agent-pki" element={<RegisterAgentPKIPage />} />
        <Route path="/register/participant" element={<RegisterParticipantPage />} />
        <Route path="/register/verificateur" element={<RegisterVerificateurPage />} />
        <Route path="/activation-success" element={<ActivationResult />} />
        <Route path="/activation-already" element={<ActivationResult />} />
        <Route path="/activation-expired" element={<ActivationResult />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/presence-confirm" element={<PresenceConfirm />} />

        {/* 🔐 Espace Admin */}
        <Route element={<AdminRoute />}>
          <Route
            path="/admin"
            element={
              <Layout>
                <AdminDashboard />
              </Layout>
            }
          />
          <Route
            path="/admin/ceremonies"
            element={
              <Layout>
                <CeremoniesPage />
              </Layout>
            }
          />
          <Route
            path="/admin/ceremonies/new"
            element={
              <Layout>
                <PlanifierCeremoniePage />
              </Layout>
            }
          />
          <Route
            path="/admin/ceremonies/:id"
            element={
              <Layout>
                <CeremonieDetailsPage />
              </Layout>
            }
          />
          <Route
            path="/admin/ceremonies/:id/rapport"
            element={
              <Layout>
                <CeremonieRapportPDF />
              </Layout>
            }
          />
        </Route>

        {/* 🔐 Espace Agent PKI */}
        <Route element={<PrivateRoute allowedRoles={['AGENT_PKI']} />}>
          <Route
            path="/agent-pki"
            element={
              <Layout>
                <AgentPKIHome />
              </Layout>
            }
          />
          <Route
            path="/agent-pki/ceremonies"
            element={
              <Layout>
                <CeremoniesPage />
              </Layout>
            }
          />
          <Route
            path="/agent-pki/ceremonies/new"
            element={
              <Layout>
                <PlanifierCeremoniePage />
              </Layout>
            }
          />
          <Route
            path="/agent-pki/ceremonies/:id"
            element={
              <Layout>
                <CeremonieDetailsPage />
              </Layout>
            }
          />
          <Route
            path="/agent-pki/ceremonies/:id/generate-certificate"
            element={
              <Layout>
                <GenerateCertificatePage />
              </Layout>
            }
          />
          <Route
            path="/agent-pki/ceremonies/:id/rapport"
            element={
              <Layout>
                <CeremonieRapportPDF />
              </Layout>
            }
          />
        </Route>

        {/* 🔐 Espace Participant */}
        <Route element={<PrivateRoute allowedRoles={['PARTICIPANT']} />}>
          <Route
            path="/participant"
            element={
              <Layout>
                <ParticipantHome />
              </Layout>
            }
          />
          <Route
            path="/participant/ceremonies"
            element={
              <Layout>
                <ParticipantCeremoniesPage />
              </Layout>
            }
          />
          <Route
            path="/participant/ceremonies/:id"
            element={
              <Layout>
                <CeremonieDetailsPage />
              </Layout>
            }
          />
          <Route
            path="/participant/certificats"
            element={
              <Layout>
                <ParticipantCertificatesPage />
              </Layout>
            }
          />
        </Route>

        {/* 🔐 Espace Vérificateur */}
        <Route element={<PrivateRoute allowedRoles={['VERIFICATEUR']} />}>
          <Route
            path="/verificateur"
            element={
              <Layout>
                <VerificateurHome />
              </Layout>
            }
          />
          <Route
            path="/verificateur/ceremonies"
            element={
              <Layout>
                <CeremoniesVerificateurPage />
              </Layout>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
