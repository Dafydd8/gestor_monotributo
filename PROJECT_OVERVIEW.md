# Project Overview

This repository contains a Monotributo invoice manager with a TypeScript/Express backend, Prisma/PostgreSQL persistence, and a React/Vite frontend. This document focuses on the backend behavior currently present in the codebase.

## Backend Structure

- `backend/src/index.ts` creates the Express app, enables CORS and JSON parsing, mounts route groups, and exposes `GET /health`.
- `backend/src/db.ts` creates a Prisma Client using `@prisma/adapter-pg` and `DATABASE_URL`.
- `backend/src/routes` defines HTTP routes and applies authentication middleware where needed.
- `backend/src/controllers` handles request/response concerns and maps service errors to HTTP responses.
- `backend/src/services` contains business logic for auth, invoices, PDF parsing, categories, and dashboard calculations.
- `backend/src/middlewares/auth.middleware.ts` validates JWT bearer tokens and attaches `{ userId, cuit }` to `req.user`.
- `backend/src/schemas/invoice.schema.ts` validates invoice create/update/import-confirm payloads with Zod.
- `backend/src/scripts/syncCategories.ts` scrapes AFIP category limits and upserts them into the database.
- `backend/prisma/schema.prisma` defines the database models and unique constraints.

## Main Routes

- `GET /health`: simple health check.
- `POST /auth/register`: creates a user, hashes the password, optionally assigns a current category, and returns a JWT.
- `POST /auth/login`: validates CUIT/password and returns a JWT.
- `PUT /auth/me`: authenticated profile/category update.
- `GET /invoices`: authenticated list of the current user's invoices.
- `POST /invoices`: authenticated invoice creation.
- `PUT /invoices/:id`: authenticated invoice update scoped by user.
- `DELETE /invoices/:id`: authenticated invoice deletion scoped by user.
- `POST /invoices/import-pdf`: authenticated multipart PDF parsing. Uses `files` as the upload field and returns parsed rows without inserting them.
- `POST /invoices/confirm-import`: authenticated insertion of reviewed imported invoice rows.
- `GET /categories/current`: public list of current category IDs/codes.
- `GET /categories/overview?projectedIpc=15`: authenticated category overview, including projected annual income and historical periods.
- `GET /dashboard/summary?estimatedIpc=15`: authenticated dashboard summary, current/next/future cuts, projection, progress, and last 6 months.

## Prisma Models

- `User`
  - Fields: `id`, unique `cuit`, `full_name`, `password_hash`, optional `current_category_id`.
  - Relations: optional current `Category`, many `Invoice`.

- `Invoice`
  - Fields: `id`, `user_id`, `invoice_type`, `point_of_sale`, `invoice_number`, `invoice_date`, optional `issue_date`, `total_amount`, optional `client_name`, optional `client_cuit`.
  - Relation: belongs to `User`.
  - Unique constraint: `(user_id, invoice_type, point_of_sale, invoice_number)`.
  - Important meaning: `invoice_date` is the billing period start; `issue_date` is the emission date.

- `Category`
  - Fields: `id`, `code`, optional `description`, `max_annual_income`, optional physical/unit limits, `is_active`, `effective_from`, optional `effective_to`, timestamps.
  - Relations: users whose current category points to this row.
  - Unique constraint: `(code, effective_from)`.

## Auth Flow

1. Registration validates required fields, checks CUIT uniqueness, validates `current_category_id` if present, hashes the password with bcrypt, creates the user, and signs a JWT containing `{ userId, cuit }`.
2. Login strips hyphens from the submitted CUIT, finds the user by CUIT, compares the password with bcrypt, and signs the same JWT payload.
3. Authenticated routes require `Authorization: Bearer <token>`.
4. `authMiddleware` verifies the token with `JWT_SECRET` and stores the decoded `{ userId, cuit }` on `req.user`.
5. Invoice and dashboard operations use `req.user.userId` to scope data to the authenticated user.

## Invoice Import Flow

1. Frontend sends one or more PDFs to `POST /invoices/import-pdf` as multipart form data under the `files` field.
2. Multer stores uploads in memory.
3. `parseInvoicePdf` extracts text with `pdf-parse`, then attempts to detect invoice type, point of sale, invoice number, billing period start (`invoice_date`), emission date (`issue_date`), total amount, client name, and client CUIT.
4. The import endpoint returns parsed rows with `success`, `error`, `local_id`, `file_name`, parsed fields, and `raw_text`; it does not insert into the database.
5. The frontend shows editable parsed rows and lets the user select/review them.
6. Confirmed rows are sent to `POST /invoices/confirm-import`.
7. The confirm endpoint validates each row with `createInvoiceSchema`, inserts valid rows via `createInvoice`, and reports per-row duplicate errors from Prisma unique constraint `P2002`.

## Dashboard Flow

1. `GET /dashboard/summary` reads the authenticated `userId` and optional `estimatedIpc` query value.
2. The service derives the current, next, and following recategorization cuts. Cuts are January 1 and July 1.
3. For each cut, it loads active categories effective at that cut, falling back to the latest available active category block when needed.
4. It calculates accumulated billing for the cut's window and chooses the estimated category by comparing accumulated amount with category limits.
5. It builds current/next/future cut summaries, progress, IPC-adjusted projection details, and last-6-month rows.
6. Last-6-month rows include `month_label`, `billed`, `accumulated_12m`, `category_code`, `category_label`, `category_limit`, and `margin`, sorted chronologically by construction.

## Known Risks And Inconsistencies

- Dashboard aggregation currently uses `invoice_date` inside `getAccumulatedForWindow`, including cut summaries and last-6-month rows. Project rules say dashboard aggregations should use `issue_date`, so this is a likely business-logic bug.
- `issue_date` is optional in the Prisma model and invoice schema. If dashboard logic is switched to `issue_date`, older or manually entered invoices without `issue_date` need an explicit fallback or migration strategy.
- `parseInvoicePdf` depends on fragile text patterns and mojibake-encoded labels for text such as `Periodo Facturado Desde`; PDFs with clean UTF-8 text or different AFIP formatting may fail to extract dates.
- PDF total extraction chooses the maximum numeric amount above 100, which can select the wrong value if another large number appears in the PDF.
- `syncCategories.ts` upserts active rows but does not deactivate or close older periods with `effective_to`, so multiple category periods can remain active unless managed elsewhere.
- Some user-facing strings in source files and README appear mojibake-encoded. This does not necessarily break API behavior, but it can make parsing, UI text, and maintenance more error-prone.
- `POST /invoices` does not catch duplicate `P2002` errors with a specific 409 response, while update and confirm-import do. Duplicate manual creates currently fall through to a generic 500 response.
- The repository has no real test script yet (`npm test` exits with an error placeholder), so critical flows rely on manual verification.
