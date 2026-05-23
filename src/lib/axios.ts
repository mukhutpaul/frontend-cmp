import axios from "axios";

/**
 * 🌍 Base URLs (mode LOCAL / CENTRAL)
 * Tu peux changer dynamiquement selon login
 */
const LOCAL_API = "http://localhost:8090/api";
const REMOTE_API = `http://${localStorage.getItem("server_ip")}:${localStorage.getItem("server_port")}`;; // exemple production

// 👉 récupérer le mode choisi (local / remote)
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    const mode = localStorage.getItem("mode");

    if (mode === "local") return LOCAL_API;
    if (mode === "remote") return REMOTE_API;
  }

  return LOCAL_API;
};

/**
 * 🚨 Instance Axios principale
 */
export const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 1800000,
});

/**
 * 🔐 Intercepteur REQUEST (ajout token JWT)
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * ⚠️ Intercepteur RESPONSE (gestion erreurs globales)
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalide → logout automatique
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    if (error.response?.status === 500) {
      console.error("Erreur serveur interne");
    }

    return Promise.reject(error);
  }
);