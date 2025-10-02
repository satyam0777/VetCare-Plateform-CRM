import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const hideNavbar = location.pathname === '/';
  return (
    <>
      {!hideNavbar && <Navbar />}
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;