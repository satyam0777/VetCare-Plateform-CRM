
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import UserDashboardPage from '../pages/UserDashboardPage';
import DoctorDashboardPage from '../pages/DoctorDashboardPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import Login from '../components/auth/Login';
import ForgotPassword from '../components/auth/ForgotPassword';
import Register from '../components/auth/Register';
import AdminLogin from '../components/auth/AdminLogin';
import AdminForgotPassword from '../components/auth/AdminForgotPassword';
import DoctorLinkLogin from '../components/auth/DoctorLinkLogin';
import CareerPortal from '../pages/CareerPortal';
import PrivateRoute from '../components/common/PrivateRoute';
import Layout from '../components/common/Layout';
import UserReportsPage from '../pages/UserReportsPage';
import DoctorReportsPage from '../pages/DoctorReportsPage';
import PostConsultationPayment from '../components/consultation/PostConsultationPayment';
import VideoCallPanel from '../components/video/VideoCallPanel';
import TokenDebug from '../components/debug/TokenDebug';

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<Login />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/register" element={<Register />} />
  <Route path="/admin-login" element={<AdminLogin />} />
  <Route path="/admin-forgot-password" element={<AdminForgotPassword />} />
    <Route path="/debug-token" element={<TokenDebug />} />
    <Route path="/doctor-login/:link" element={<DoctorLinkLogin />} />
    <Route path="/career-portal" element={<CareerPortal />} />
    <Route element={<Layout />}>
      <Route path="/dashboard" element={
        <PrivateRoute>
          <UserDashboardPage />
        </PrivateRoute>
      } />
      <Route path="/dashboard/reports" element={
        <PrivateRoute>
          <UserReportsPage />
        </PrivateRoute>
      } />
      <Route path="/consultation-payment/:appointmentId" element={
        <PrivateRoute>
          <PostConsultationPayment />
        </PrivateRoute>
      } />
      <Route path="/video-call/:appointmentId" element={
        <PrivateRoute>
          <VideoCallPanel />
        </PrivateRoute>
      } />
      {/* Doctor dashboard public route for unique access link */}
      <Route path="/doctor-dashboard/:link" element={<DoctorDashboardPage />} />
      <Route path="/doctor-dashboard/:link/reports" element={<DoctorReportsPage />} />
      <Route path="/admin-dashboard" element={
        <PrivateRoute>
          <AdminDashboardPage />
        </PrivateRoute>
      } />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default AppRoutes;
