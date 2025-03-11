import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MainApp from "./App";
import { AuthProvider } from "./AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="1093233382771-dukv61smr5p0uq2b66shgq1l35633uqa.apps.googleusercontent.com">
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
