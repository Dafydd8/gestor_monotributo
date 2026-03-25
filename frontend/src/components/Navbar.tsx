import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const linkClass = (path: string) => {
    const active = location.pathname === path;

    return [
      "rounded-lg px-3 py-2 text-sm transition-colors",
      active
        ? "bg-black text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-black",
    ].join(" ");
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <Link to="/" className="text-lg font-semibold text-black">
            Monotributo
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            <Link to="/" className={linkClass("/")}>
              Dashboard
            </Link>

            <Link to="/invoices" className={linkClass("/invoices")}>
              Facturas
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {user?.full_name || "Usuario"}
            </div>
            <div className="text-gray-500">{user?.cuit || ""}</div>
          </div>

          <button
            onClick={logout}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-black"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}