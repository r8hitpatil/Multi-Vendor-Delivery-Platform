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
