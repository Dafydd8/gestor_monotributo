import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

type CurrentCategoryOption = {
  id: number;
  code: string;
};

export default function Navbar() {
  const location = useLocation();
  const { user, logout, updateCurrentUser } = useAuth();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [currentCategoryId, setCurrentCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<CurrentCategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const linkClass = (path: string) => {
    const active = location.pathname === path;

    return [
      "rounded-lg px-3 py-2 text-sm transition-colors",
      active
        ? "bg-black text-white"
        : "text-gray-600 hover:bg-gray-100 hover:text-black",
    ].join(" ");
  };

  useEffect(() => {
    if (!isEditOpen) return;

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        setError("");

        const response = await api.get<CurrentCategoryOption[]>("/categories/current");
        setCategories(response.data);
      } catch (err: any) {
        setError(err?.response?.data?.error || "No se pudieron cargar las categorías");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isEditOpen]);

  const openEditModal = () => {
    setError("");
    setSuccessMessage("");
    setFullName(user?.full_name ?? "");
    setCurrentCategoryId(
      user?.current_category_id ? String(user.current_category_id) : ""
    );
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (saving) return;
    setIsEditOpen(false);
    setError("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      await updateCurrentUser({
        full_name: fullName.trim(),
        current_category_id: currentCategoryId ? Number(currentCategoryId) : null,
      });

      setSuccessMessage("Usuario actualizado correctamente");

      setTimeout(() => {
        setIsEditOpen(false);
        setSuccessMessage("");
      }, 700);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || "No se pudo actualizar el usuario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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

              <Link to="/categories" className={linkClass("/categories")}>
                Categorías
              </Link>
            </nav>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {user?.full_name || "Usuario"}
              </div>
              <div className="text-gray-500">
                {user?.cuit || ""}
                {user?.current_category_code ? ` · Cat. ${user.current_category_code}` : ""}
              </div>
            </div>

            <button
              onClick={openEditModal}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-black"
            >
              Editar
            </button>

            <button
              onClick={logout}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-black"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Editar usuario
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Cambiá tu nombre y tu categoría de monotributo.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="rounded-lg px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition focus:border-black"
                  placeholder="Tu nombre"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Categoría actual
                </label>
                <select
                  value={currentCategoryId}
                  onChange={(e) => setCurrentCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none transition focus:border-black"
                  disabled={loadingCategories}
                >
                  <option value="">Sin categoría</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.code}
                    </option>
                  ))}
                </select>

                {loadingCategories && (
                  <p className="mt-2 text-xs text-gray-500">
                    Cargando categorías...
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-black px-4 py-2 text-sm text-white transition hover:opacity-90 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}