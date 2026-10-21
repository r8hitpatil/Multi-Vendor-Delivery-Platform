# Quick Notes & Learnings

## Module 1: Sidebar & Next.js 16

### 1. JavaScript
* **Object Lookup vs `.map()`:** `dict[role]` gets data in $O(1)$ without looping over all roles.
* **Destructuring Aliasing:** `{ a: b }` renames `a` to variable `b` — it is NOT a type annotation!
* **Promises:** Async functions always return a Promise; you must `await` before accessing properties (`(await fn())?.prop`).

### 2. TypeScript
* **`Record<K, V>`:** Types a dictionary where every key in union `K` must be defined (`Record<Role, NavItem>`).
* **React Prop Typing:** Destructure first, type after: `({ prop }: { prop: Type })`.

### 3. shadcn & Base UI
* **`render` vs `asChild`:** Modern shadcn (Base UI) uses `render={<Link href="..." />}`, not `asChild`.
* **Sibling Rule:** `<AppSidebar />` and `<main>` sit side-by-side inside `<SidebarProvider>`, not nested.

### 4. Next.js 16
* **Layouts are Automatic:** Never import `layout.tsx` into `page.tsx`; Next.js injects `{children}` automatically.
* **Server Components:** Default to server (no `"use client"`) unless you need hooks (`useState`) or events (`onClick`).
* **Next.js 16 Dynamic Opt-out:** Use `export const instant = false;` (replaces legacy `dynamic = "force-dynamic"`).

---

## Module 2: Forms, Server Actions & Data Security

### 1. Form Handling
* **`formData.get()` Return Type:** Always returns `string | File | null`. Numbers and booleans must be explicitly converted (`Number(...)`, `=== "on"`).
* **Checkboxes:** Controlled by `defaultChecked` / `checked`, NOT `value`. Avoid `required` on toggle checkboxes.
* **Phone Numbers in DB:** Always store as `String` (preserves leading `0`s, international `+`, and avoids Next.js `BigInt` JSON serialization crashes).

### 2. Server Action Security (DAL)
* **Never Trust the Client:** Server Actions are open RPC endpoints. Always guard them internally with `session?.role !== 'SUPER_ADMIN'` to prevent IDOR and privilege escalation.
* **Centralized `getSession()`:** Keep session reading in `lib/auth.ts` so layout, pages, and actions share one secure Data Access Layer.
* **Form Reset Key Trick:** Use `key={item.id}` on `<form>` to automatically reset uncontrolled inputs when switching selected records without Base UI warnings.
* **Auth Guards Must `throw`:** Helpers like `requireSuperAdmin()` must `throw new Error(...)` rather than returning `{ success: false }`, ensuring execution halts immediately and flows to `catch`.

### 3. TypeScript & Error Handling
* **`as const` for Discriminated Unions:** TypeScript widens `{ success: false }` to `{ success: boolean }`, breaking `res.data` narrowing. Adding `false as const` locks literal types, proving to TypeScript that `res.data` exists when `res.success` is `true`.
* **Compile-Time vs Runtime:** `as const` is a pure TypeScript type assertion. It produces zero JavaScript at runtime (does not freeze or convert the object).
* **Centralized `handleActionError()`:** Catch database constraints (Prisma `P2002` on unique fields like `phone`/`email`) and ensure standard Errors don't get dropped or return `undefined`.

### 4. React & Next.js Gotchas
* **`value` vs `defaultValue`:** Setting `value={item.name}` without an `onChange` handler freezes the input as read-only. Use `defaultValue` with `<form key={item.id}>` for self-resetting, editable fields.
* **`error.ts` Reserved File Trap:** In Next.js `app/`, `error.ts` is reserved exclusively for Client Component Error Boundaries. Name utility/lib files `errors.ts` (plural) to avoid Next.js forcing `"use client"`.
* **Prisma Seed Sync (`P2021`):** Run `prisma db push` to generate database tables before running `prisma db seed`. Ensure required model fields have values or are marked optional (`String?`).

### 5. Multi-Tenant Authorization
* **Source of Truth vs Stale Tokens:** Cookies/JWTs are snapshots; if an admin's company changes in the DB, the cookie remains stale until re-login. Always fetch the latest company from the database on write operations.
* **Scoped Prisma Mutations:** Scope updates directly with `where: { id, companyName }` so cross-tenant modifications are rejected at the database level.

