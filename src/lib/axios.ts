import axios from "axios";

/**
 * 🌍 Base URLs (mode LOCAL / CENTRAL)
 * Tu peux changer dynamiquement selon login
 */
const LOCAL_API = "http://localhost:8090/api";

// 👉 Déterminer automatiquement quelle API utiliser
const getBaseURL = () => {
  if (typeof window !== "undefined") {

    const serverIp = localStorage.getItem("server_ip");
    const serverPort = localStorage.getItem("server_port");

    // ✅ Si IP + PORT existent → REMOTE
    if (serverIp && serverPort) {
      return `http://${serverIp}:${serverPort}/api`;
    }
  }

  // ✅ Sinon → LOCAL
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
  timeout: 9000000,
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