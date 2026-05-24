"use client";

import { useEffect, useState } from "react";
import { getDashboardStats } from "@/services/dashboard.service";

export interface DashboardData {
  totalPoliciers: number;
  totalUnites: number;
  totalEquipes: number;
  totalMissions: number;

  totalControles: number;
  totalPresent: number;
  totalJustifies: number;
}

export function useDashboard() {

  const [data, setData] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      const profile = localStorage.getItem("profile") || "";

      const rawUserId = localStorage.getItem("idUser");

      if (!rawUserId) {
        throw new Error("ID utilisateur introuvable");
      }

      const userId = Number(rawUserId);

      if (isNaN(userId) || userId <= 0) {
        throw new Error("ID utilisateur invalide");
      }

      const res = await getDashboardStats(profile, userId);

      setData(res);
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Erreur chargement dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    /* FIRST LOAD */
    loadDashboard();

    /* AUTO REFRESH 5s */
    const interval = setInterval(() => {

      loadDashboard();

    }, 5000);

    return () => clearInterval(interval);

  }, []);

  return {
    data,
    loading,
    error,
  };
}