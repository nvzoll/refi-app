import React from "react";
import { Route, Routes } from "react-router-dom";
import MainLayout from "./pages/main";

import LoginPage from "./pages/main/login";

function App() {
  return (
    <Routes>
      <Route path="/:projectId/*" element={<MainLayout />} />
      <Route path="/" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
