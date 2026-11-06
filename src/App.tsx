import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import LandingPage from '@/pages/LandingPage';
import { MotionConfig } from 'framer-motion';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}
