# AGENTS.md — Monotributo Manager

## 🧠 Project Overview

This is a backend application to manage invoices for Argentine monotributo users.
Main responsibilities:

* Store and manage invoices
* Import invoices from PDF files
* Calculate billing metrics (last 6 months, accumulated 12 months)
* Determine tax category thresholds

---

## ⚙️ Tech Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Express
* **ORM:** Prisma (v7+)
* **Database:** PostgreSQL (Supabase)
* **Auth:** JWT
* **File Processing:** pdf-parse (or similar)

---

## 📁 Architecture Principles

### General

* Controllers should be thin (handle request/response only)
* Business logic belongs in services
* DB access only via Prisma client
* Use async/await (no callbacks)

### Structure

* `/controllers` → HTTP layer
* `/services` → business logic
* `/routes` → route definitions
* `/middleware` → auth, validation
* `/scripts` → background jobs (e.g., syncCategories)

---

## 🔐 Authentication

* JWT-based authentication
* Middleware extracts:

  * `userId`
  * `cuit`
* All invoice operations must be scoped to authenticated user

---

## 🧾 Invoice Model — Critical Rules

### Fields

* `invoice_type`
* `point_of_sale`
* `invoice_number`
* `invoice_date` → ⚠️ **Periodo Facturado Desde**
* `issue_date` → ⚠️ **Fecha de Emisión**
* `total_amount`

### ⚠️ IMPORTANT

* DO NOT confuse:

  * `invoice_date` (billing period start)
  * `issue_date` (emission date)

This has caused bugs before.

---

## 🔁 Unique Constraint

Invoices must be unique by:

(user_id, invoice_type, point_of_sale, invoice_number)

Never insert duplicates.

---

## 📄 PDF Import Rules

When parsing PDFs:

* Extract:

  * invoice_type
  * point_of_sale
  * invoice_number
  * total_amount
  * invoice_date (Periodo Facturado Desde)
  * issue_date (Fecha de Emisión)

### ⚠️ Validation Step Required

* Parsed invoices must be **reviewed before insertion**
* Use confirmation flow (do NOT auto-insert blindly)

---

## 📊 Dashboard Logic

Backend returns:

```
Last6MonthRow {
  month_label
  billed
  accumulated_12m
  category_code
  category_label
  category_limit
  margin
}
```

### Rules:

* Aggregations should use **issue_date**
* Data must be sorted chronologically
* Calculations must be consistent with tax thresholds

---

## 🧮 Category Sync

Script:

* `syncCategories.ts`

Rules:

* Should update tax thresholds
* Runs periodically (monthly)
* Must not break existing data

---

## 🚫 DO NOT

* Do not change Prisma schema without migration
* Do not break existing API routes
* Do not assume PDF data is always clean
* Do not hardcode values that come from DB

---

## ✅ Best Practices

* Validate all inputs
* Handle edge cases (missing fields in PDFs)
* Log meaningful errors
* Keep functions small and modular

---

## 🧪 Testing Expectations

Before completing a task:

* Ensure endpoints still work
* Validate no duplicate invoices are created
* Test PDF import flow
* Check date parsing carefully

---

## 🧨 Known Pitfalls

* Mixing invoice_date and issue_date ❌
* Prisma client generation issues (check output path)
* ESM vs CommonJS conflicts
* Incorrect date formats from PDFs

---

## 🎯 Goal for Agents

When implementing features:

* Preserve data integrity
* Respect business rules
* Avoid regressions
* Prefer clarity over cleverness
