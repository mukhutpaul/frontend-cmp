import Link from "next/link";
import {
  LayoutDashboard,
  Shield,
  Users,
  ClipboardCheck,
  FileBarChart,
  Settings,
  GlobeLock,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "ADMIN" | "CONTROLEUR" | "MANAGER" | "CHEF_EQUIPE"

import { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  auth?: boolean;
  roles?: Role[];
}

export default function Sidebar({
  isOpen,
}: {
  isOpen: boolean;
}) {
  const pathname = usePathname()
  const [pageName, setPageName] = useState<string | null>(null)
  const [user, setUser] = useState<string | null>(null)
  const [profile, setProfile] = useState<Role | null>(null)

  const navLinks: NavLink[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["ADMIN", "CHEF_EQUIPE","MANAGER"] },
    { href: "/policiers", icon: Users, label: "Policiers", auth: true, roles: ["ADMIN", "CHEF_EQUIPE","MANAGER"] },
    { href: "/controles", icon: ClipboardCheck, label: "Contrôles", auth: true, roles: ["ADMIN","MANAGER","CHEF_EQUIPE"] },
    { href: "/users", icon: Shield, label: "Utilisateurs", auth: true, roles: ["CHEF_EQUIPE", "ADMIN","MANAGER"] },
    { href: "/unites", icon: Shield, label: "Unités", auth: true, roles: ["CHEF_EQUIPE", "ADMIN","MANAGER"] },
    { href: "/missions", icon: Shield, label: "Missions", auth: true, roles: ["CHEF_EQUIPE", "ADMIN","MANAGER"] },
    { href: "/seances", icon: Shield, label: "Séances", auth: true, roles: ["CHEF_EQUIPE", "ADMIN","MANAGER"] },
    { href: "/equipes", icon: Shield, label: "Equipes", auth: true, roles: ["CHEF_EQUIPE", "ADMIN","MANAGER"] },
    { href: "/recherches", icon: Shield, label: "Recherches", auth: true, roles: ["CHEF_EQUIPE", "ADMIN","MANAGER"] },
    { href: "/statProvince", icon: Shield, label: "Stats Provinces", auth: true, roles: ["MANAGER", "ADMIN","MANAGER"] },
    { href: "/statEquipe", icon: Shield, label: "Stats Equipes", auth: true, roles: ["MANAGER", "ADMIN","MANAGER"] }

  ]

  useEffect(() => {
    const storedUser = localStorage.getItem("username")
    const storedProfile = localStorage.getItem("profile")

    console.log("USER =", storedUser)
    console.log("PROFILE =", storedProfile)
    setUser(localStorage.getItem("username"))
    setProfile(localStorage.getItem("profile") as Role)
  }, [])


  // Filtrer les liens selon l'auth et les rôles
  const filteredLinks = navLinks.filter((link) => {

    if (!link.auth) return true

    if (!user) return false

    if (link.roles && profile) {
      return link.roles.includes(profile)
    }

    return true
  })

  const isActiveLink = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  const renderLinks = () => (
    <>
      {filteredLinks.map(({ href, label, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className={`
            flex items-center gap-3
            px-3 py-2 rounded-lg
            transition
            ${isActiveLink(href)
                ? "bg-primary text-white"
                : "hover:bg-base-300"
              }
            ${!isOpen ? "justify-center" : ""}
          `}
          >
            <Icon size={20} />

            {isOpen && (
              <span className="whitespace-nowrap">
                {label}
              </span>
            )}
          </Link>
        </li>
      ))}

      {pageName && (
        <li>
          <Link
            href={`/page/${pageName}`}
            className={`
            flex items-center gap-3 px-3 py-2 rounded-lg
            hover:bg-base-300 transition
            ${!isOpen ? "justify-center" : ""}
          `}
          >
            <GlobeLock size={20} />
            {isOpen && <span>Page</span>}
          </Link>
        </li>
      )}
    </>
  );

  return (
    <aside
      className={`
      fixed top-0 left-0
      h-screen
      bg-base-200
      shadow-xl
      flex flex-col
      transition-all duration-300
      overflow-hidden
      ${isOpen ? "w-72" : "w-20"}
    `}
    >
      {/* TOP SECTION */}
      <div className="flex flex-col flex-1">

        {/* HEADER */}
        <div className="p-5 border-b border-base-300">
          {isOpen ? (
            <>
              <h2 className="text-2xl font-bold text-primary whitespace-nowrap">
                ABA-CM-PNC
              </h2>
              <p className="text-sm opacity-70 mt-1 whitespace-nowrap">
                Controle des effectifs
              </p>
            </>
          ) : (
            <h2 className="text-2xl font-bold text-primary whitespace-nowrap">
              CMP
            </h2>
          )}
        </div>

        {/* MENU (IMPORTANT flex-1 + overflow) */}
        <ul className="menu p-3 gap-2 w-full flex-1 overflow-y-auto">
          {renderLinks()}
        </ul>

      </div>

      {/* FOOTER FIXÉ EN BAS */}
      <div className="p-4 border-t border-base-300 text-center text-sm opacity-70 whitespace-nowrap">
        ABA@2026
      </div>
    </aside>
  );
}