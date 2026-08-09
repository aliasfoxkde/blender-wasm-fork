import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/global.css";
import { RenderProofPage } from "./routes/RenderProofPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RenderProofPage />} />
        <Route path="/render-proof" element={<RenderProofPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
