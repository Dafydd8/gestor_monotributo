import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { categoryService } from "../services/category.service";
import { formatCuit } from "../utils/format";

type CategoryOption = {
  id: number;
  code: string;
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [cuit, setCuit] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [currentCategoryId, setCurrentCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getCurrent();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };

    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        cuit: cuit.replace(/\D/g, ""),
        full_name: fullName,
        password,
        current_category_id: currentCategoryId
          ? Number(currentCategoryId)
          : undefined,
      });
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">CUIT</label>
            <input
              type="text"
              value={cuit}
              onChange={(e) => setCuit(formatCuit(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="20-12345678-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Categoría actual
            </label>
            <select
              value={currentCategoryId}
              onChange={(e) => setCurrentCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  Categoría {category.code}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          ¿Ya tenés cuenta?{" "}
          <Link to="/login" className="font-medium text-black underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}