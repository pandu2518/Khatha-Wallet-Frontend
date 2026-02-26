import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import MobileScanner from "./MobileScanner";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./i18n/i18n";   // ✅ CORRECT

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<App />} />
        <Route path="/scan" element={<MobileScanner />} />
      </Routes>
    </BrowserRouter>

    <ToastContainer
      position="top-center"
      autoClose={2000}
      hideProgressBar={true}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastClassName="premium-toast"
    />
  </React.StrictMode>
);
