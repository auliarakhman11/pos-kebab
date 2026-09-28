# Turbopack & Tailwind CSS v4 Fix

**Konteks:**
Saat menggunakan Next.js 16 (dengan Turbopack default) dan Tailwind CSS v4, terdapat *bug* di mana proses *PostCSS* (Node.js worker) akan mengalami *crash/panic* (`node process exited before we could connect to it`) pada saat proses *build* di *hosting* (seperti Vercel). 

**Penyelesaian (Workaround):**
Jangan gunakan `@tailwindcss/postcss` maupun `postcss.config.mjs`. Gunakan pendekatan kompilasi manual (pre-compiled) dengan Tailwind CLI.

**Langkah-langkah Standar:**
1. Hapus file `postcss.config.mjs`.
2. Hapus `@tailwindcss/postcss` dari `package.json`.
3. Gunakan `@tailwindcss/cli` di `devDependencies`.
4. Ubah script build di `package.json` menjadi:
   `"build": "npx @tailwindcss/cli -i ./src/app/globals.css -o ./src/app/tailwind-compiled.css && next build"`
5. Di `src/app/layout.tsx`, ganti import css dari `import "./globals.css"` menjadi `import "./tailwind-compiled.css"`.
6. Tambahkan `tailwind-compiled.css` ke `.gitignore`.

Jangan menggunakan Turbopack untuk kompilasi CSS Tailwind v4 secara langsung sampai Next.js memberikan tambalan (*patch*) resmi untuk *bug* IPC ini.
