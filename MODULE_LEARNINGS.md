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

---

## Module 3: Advanced UI Standardization, Form Architecture & Production Polish

### 1. React Hook Form & Zod Integration Patterns
* **Zod Number Coercion vs RHF Resolvers:** Using `z.coerce.number()` inside schemas passed to `@hookform/resolvers/zod` frequently produces TypeScript type collisions because RHF infers form inputs as `string` while the resolver expects `number` or `unknown`. The robust pattern is string validation with `.refine((v) => !isNaN(Number(v)), "Must be a valid number")` paired with explicit `Number(data.field)` casting on form submission.
* **Cross-Field Validation in Schemas:** When validating relational rules (e.g., `discountedPrice < price`), attach `.refine()` at the object level with a targeted `path`:
  ```ts
  .refine(
    (data) => !data.discountedPrice || data.discountedPrice < data.price,
    { message: "Discounted price must be lower than original price", path: ["discountedPrice"] }
  )
  ```
  This automatically pipes the error to the correct field's `fieldState.error` in Base UI without custom form-level error plumbing.
* **Client-Side Keystroke Sanitization:** Standard HTML input types like `type="tel"` still allow alphabetical keystrokes on desktop browsers. For strict numeric fields (Phone, Aadhar, PAN), intercept `onChange` directly:
  ```tsx
  onChange={(e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
    field.onChange(val);
  }}
  ```
  Combine this with `inputMode="numeric"` to summon the mobile numeric keypad and prevent invalid inputs before validation even fires.

### 2. Base UI & Shadcn Component Gotchas
* **Controlled Value Initialization:** Passing `undefined` to a Base UI `<Select value={field.value}>` triggers an uncontrolled-to-controlled state flip warning. The `<Select>` wrapper must normalize `undefined -> null` or `""` internally.
* **Array Truthiness Bug in JSX:** In JavaScript, an empty array `[]` is truthy (`Boolean([]) === true`). Writing `{ items ? <List /> : <Empty /> }` causes empty lists to render instead of fallback cards. Always check explicit length: `{ items && items.length > 0 ? <List /> : <Empty /> }`.
* **Standardizing Modals & Drawers:** Replace raw modal overlays and ad-hoc drawers with accessible Base UI primitives (`<DialogPrimitive.Root>`, `<DialogContent>`). This guarantees automatic focus trapping, `Esc` keyboard dismissal, and screen reader announcements.
* **Optimistic Local Filtering:** When performing admin actions (such as approving/rejecting pending vendors), update the UI state optimistically (`setPending(prev => prev.filter(v => v.id !== id))`) before or immediately alongside the server action to make the interface feel instantaneous.

### 3. Server Action Typo Traps & State Leaks
* **The Silent Single-Letter Typo (`sucess` vs `success`):** Writing `sucess: false as const` (single 'c') in server actions causes client-side `if (res.success)` checks to evaluate falsy without error propagation, leaving forms in indefinite loading states with zero UI feedback. Always enforce a shared action return type interface (`{ success: true; data: T } | { success: false; message: string }`).
* **Transient Alert Leaks Across Navigation:** Storing success messages in client component state without an auto-dismiss cleanup causes stale banners to persist if the user navigates between dashboard routes. Always pair success alerts with auto-dismiss timers and cleanup:
  ```tsx
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);
  ```

### 4. Zero-Logic UI Refactoring Rules
* **Strict Decoupling of Presentation and Domain Logic:** When modernizing UI with Base UI or React Hook Form, never alter server action signatures, parameter shapes, Prisma relations, hashing algorithms, or role guards.
* **Preserving Existing Field Names:** Keep schema property keys identical (`price`, `quantity`, `companyId`, `adminId`) so backend mutations and database records remain seamlessly compatible.

### 5. High-Performance Static Landing Pages
* **Zero-Scroll Viewport Lock:** To create a dead-simple, distraction-free landing page matching Figma/design specs, wrap the root in `h-screen max-h-screen w-screen overflow-hidden` with a flex column layout (`justify-between`), preventing vertical scrollbars across desktop displays.
* **Eliminating Edge Vignettes:** When placing studio render graphics on solid-color canvases, subtle monitor color profile variations (Display P3 vs sRGB) can expose 1-pixel edge borders. Use transparent alpha-channel PNGs or subtle edge masks (`[mask-image:radial-gradient(ellipse_at_center,black_75%,transparent_99%)]`) for seamless edge blending.


