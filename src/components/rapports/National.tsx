"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function ReportExporter({ data }: { data: any }) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [openPreview, setOpenPreview] = useState(false);
    const [loading, setLoading] = useState(false);

    const generatePDF = async () => {
        if (!reportRef.current) return;

        setLoading(true);

        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = (canvas.height * pageWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
            pdf.save("rapport-national-pnc.pdf");

        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* BUTTON DÉJÀ UTILISÉ DANS TON DASHBOARD */}
            <button
                onClick={() => setOpenPreview(true)}
                className="btn btn-primary btn-sm gap-2 shadow-md"
            >
                🖨️ Imprimer rapport national
            </button>

            {/* PREVIEW MODAL */}
            {openPreview && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

                    <div className="bg-white w-[95%] max-w-6xl rounded-lg shadow-xl p-4">

                        {/* ACTION BAR */}
                        <div className="flex justify-between mb-3">

                            <button
                                onClick={() => setOpenPreview(false)}
                                className="btn btn-sm"
                            >
                                Fermer
                            </button>

                            <button
                                onClick={generatePDF}
                                disabled={loading}
                                className="btn btn-success btn-sm"
                            >
                                {loading ? "Génération..." : "Télécharger PDF"}
                            </button>

                        </div>

                        {/* REPORT CONTENT */}
                        <div
                            ref={reportRef}
                            className="relative bg-white p-12 border overflow-hidden print:bg-white"
                        >

                            {/* BACKGROUND LOGO PNC */}
                            <img
                                src="/pnc.png"
                                alt="PNC"
                                className="absolute opacity-10 w-[450px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                            />

                            {/* HEADER OFFICIEL */}
                            <div className="text-center border-b pb-4 mb-6">
                                <h1 className="text-xl font-bold uppercase">
                                    RÉPUBLIQUE DÉMOCRATIQUE DU CONGO
                                </h1>

                                <h2 className="text-lg font-semibold uppercase">
                                    POLICE NATIONALE CONGOLAISE
                                </h2>

                                <p className="text-sm mt-1">
                                    Rapport National des Contrôles des Effectifs
                                </p>
                            </div>

                            {/* BODY */}
                            <div className="grid grid-cols-2 gap-6 text-sm">

                                <div className="space-y-2">
                                    <p><b>Total policiers :</b> {data?.totalPoliciers ?? 0}</p>
                                    <p><b>Total unités :</b> {data?.totalUnites ?? 0}</p>
                                    <p><b>Total équipes :</b> {data?.totalEquipes ?? 0}</p>
                                    <p><b>Total missions :</b> {data?.totalMissions ?? 0}</p>
                                </div>

                                <div className="space-y-2">
                                    <p><b>Total contrôles :</b> {data?.totalControles ?? 0}</p>
                                    <p><b>Présents :</b> {data?.totalPresent ?? 0}</p>
                                    <p><b>Justifiés :</b> {data?.totalJustifies ?? 0}</p>
                                    <p><b>Non justifiés :</b> {data?.totalNonJustifies ?? 0}</p>
                                </div>

                            </div>

                            <hr className="my-8" />

                            {/* ================= OFFICIAL FOOTER ================= */}
                            <div className="flex justify-between items-end mt-10">

                                {/* SIGNATURE */}
                                <div className="text-center">
                                    <p className="font-semibold">Chef de Service</p>

                                    <div className="h-20 flex items-end justify-center">
                                        <img
                                            src="/signature.png"
                                            alt="Signature"
                                            className="h-16 object-contain"
                                        />
                                    </div>

                                    <p className="text-xs mt-1 text-gray-600">
                                        Commissaire Divisionnaire
                                    </p>
                                </div>

                                {/* CACHET OFFICIEL */}
                                <div className="text-center">
                                    <div className="w-28 h-28 rounded-full border-4 border-gray-400 flex items-center justify-center overflow-hidden">
                                        <img
                                            src="/cachet.png"
                                            alt="Cachet PNC"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <p className="text-xs mt-1 text-gray-600">
                                        Cachet Officiel PNC
                                    </p>
                                </div>

                            </div>

                            {/* FOOTER NOTE */}
                            <p className="text-xs text-gray-500 text-center mt-8">
                                Document généré automatiquement par le système de gestion des effectifs PNC
                            </p>

                        </div>


                    </div>
                </div>
            )}
        </>
    );
}