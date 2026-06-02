"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function AppLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
        <Image
          src="/logo_pnc1.png"
          alt="PNC"
          width={180}
          height={180}
          priority
          className="animate-pulse"
        />

        <h2 className="mt-4 text-xl font-bold">
          ABA-CM PNC SYSTEM
        </h2>

        <p className="text-gray-500 mt-2">
          Chargement...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}