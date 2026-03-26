# 🧾 Monotributo Tracker

Aplicación web para gestionar facturación bajo el régimen de monotributo en Argentina, permitiendo visualizar acumulados, proyecciones y riesgo de recategorización.

---

## 🚀 Features

* 📊 Dashboard con:

  * Categoría actual
  * Próximo corte
  * Acumulados por período
  * Barra de progreso contra tope
* 📈 Proyección de facturación:

  * Escenario sin actualización de topes
  * Escenario con ajuste por IPC
* 🧮 Cálculo automático de:

  * Margen disponible
  * Facturación mensual recomendada
* 📅 Tabla de últimos 6 meses:

  * Facturación mensual
  * Acumulado rolling 12 meses
  * Categoría estimada
  * Margen vs tope
* 🧾 Gestión de facturas:

  * Crear
  * Editar
  * Eliminar
* 🔐 Autenticación con JWT

---

## 🏗️ Tech Stack

### Frontend

* React + Vite
* TypeScript
* TailwindCSS

### Backend

* Node.js + Express
* TypeScript
* Prisma ORM

### Base de datos

* PostgreSQL (Supabase / Render)

### Deploy

* Frontend: Vercel
* Backend: Render

---

## 📂 Estructura del proyecto

```
project/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── db.ts
│   │   └── index.ts
│   └── prisma/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── components/
│   │   └── types/
│
└── README.md
```

---

## 🔐 Seguridad

* Autenticación basada en JWT
* CORS configurado para frontend deployado

---

## 📊 Lógica de negocio

* Ventana móvil de 12 meses para cálculo de categoría
* Cortes semestrales (Enero / Julio)
* Cálculo automático de:

  * Categoría estimada
  * Margen a siguiente categoría
  * Proyección ajustada por IPC

---

## 🧠 Próximas mejoras

* 📉 Gráficos de evolución (chart.js / recharts)
* 🔔 Alertas de sobrepaso de categoría
* 📱 Mejoras mobile
* 📤 Exportación de reportes
* 📬 Notificaciones

---

## 🧑‍💻 Autor

Proyecto desarrollado por Dafydd 🚀

---