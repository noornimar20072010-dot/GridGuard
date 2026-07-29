# GridGuard Frontend

React + Vite + TypeScript operator dashboard for GridGuard. Product requirements live in
[SPEC.md](../SPEC.md); engineering conventions live in [CLAUDE.md](../CLAUDE.md).

## Stack

Vite, React, TypeScript (strict), Tailwind CSS v4, shadcn/ui, React Router, Recharts.

## Setup

```bash
npm install
cp .env.example .env   # then fill in your Supabase credentials
```

## Commands

| Command           | Description                         |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite dev server (:5173)   |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Run Oxlint                          |

## Structure

```
src/
├── assets/          static assets imported by components
├── components/
│   ├── common/      shared, feature-agnostic building blocks
│   ├── layout/      sidebar, top navigation, page shells
│   ├── dashboard/   summary cards, transformer table, grid tree
│   ├── transformer/ transformer detail views
│   ├── charts/      Recharts wrappers (load history + prediction)
│   ├── alerts/      alert panel and alert items
│   └── ui/          shadcn/ui primitives (generated — avoid hand edits)
├── hooks/           reusable React hooks
├── lib/             third-party setup and shared helpers (cn, clients)
├── pages/           route-level components
├── services/        backend API calls
├── types/           shared TypeScript types
└── utils/           pure helper functions
```

Business logic stays out of components: put API calls in `services/`, formatting and
calculation helpers in `utils/`, and stateful reuse in `hooks/`.

## Adding shadcn/ui components

```bash
npx shadcn add <component>
```

Components land in `src/components/ui/`. The theme tokens in `src/index.css` are
hand-maintained — review any CLI changes to that file before keeping them.

## Environment variables

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Only `VITE_`-prefixed variables reach
the browser bundle, and everything in it is public — never put a service-role key here.
