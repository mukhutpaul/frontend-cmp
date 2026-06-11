"use client";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { Search, Inbox } from "lucide-react";
import { toast } from "react-toastify";
import { getLogs, LogUser } from "@/services/log.service";

export default function LogsPage() {
  const [logs, setLogs] = useState<LogUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
  });

  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchLogs = async () => {
    try {
      setLoading(true);

      const data = await getLogs();

      setLogs(data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const filteredLogs = (logs ?? []).filter((log) => {
    const search = filters.search.toLowerCase();

    return (
      log.action?.toLowerCase().includes(search) ||
      log.username?.toLowerCase().includes(search) ||
      log.noms?.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / limit);

  const paginatedLogs = filteredLogs.slice(
    (page - 1) * limit,
    page * limit
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">
            Journal des activités
          </h1>

          <p className="text-sm opacity-70">
            Historique des actions effectuées par les utilisateurs
          </p>
        </div>

        {/* FILTER */}
        <div className="card bg-base-200 shadow-sm">
          <div className="card-body">
            <label className="input input-bordered flex items-center gap-2">
              <Search size={16} />

              <input
                type="text"
                className="grow"
                placeholder="Rechercher utilisateur ou action..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({
                    search: e.target.value,
                  })
                }
              />
            </label>
          </div>
        </div>

        {/* TABLE */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Utilisateur</th>
                    <th>Noms</th>
                    <th>Action</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10"
                      >
                        <span className="loading loading-spinner loading-md"></span>
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filteredLogs.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-12"
                        >
                          <div className="flex flex-col items-center gap-2 opacity-70">
                            <Inbox className="w-8 h-8" />

                            <p className="font-semibold">
                              Aucun log trouvé
                            </p>

                            <p className="text-sm">
                              Aucun événement enregistré
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}

                  {!loading &&
                    paginatedLogs.map((log) => (
                      <tr key={log.id} className="hover">
                    

                        <td>
                          {log.username || "-"}
                        </td>

                        <td>
                          {log.noms || "-"}
                        </td>

                        <td>
                           {log.action}
                          {/* <span className="badge badge-warning">
                            {log.action}
                          </span> */}
                        </td>

                        <td>
                          {log.createdAt
                            ? new Date(
                              log.createdAt
                            ).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center px-4 py-3 border-t border-base-300">
              <p className="text-sm opacity-70">
                Page {page} / {totalPages || 1}
                {" — "}
                Total : {filteredLogs.length}
              </p>

              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((p) => p - 1)
                  }
                >
                  « Précédent
                </button>

                <button
                  className="join-item btn btn-sm"
                  disabled={
                    page === totalPages ||
                    totalPages === 0
                  }
                  onClick={() =>
                    setPage((p) => p + 1)
                  }
                >
                  Suivant »
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}