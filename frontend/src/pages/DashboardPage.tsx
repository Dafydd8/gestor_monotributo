import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Hola, {user?.full_name}
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium">Accesos rápidos</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/invoices"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
          >
            Ver facturas
          </Link>
        </div>
      </div>
    </div>
  );
}