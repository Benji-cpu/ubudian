# F04: Admin Dashboard Shell

**Phase:** 1 — Foundation
**Depends on:** F02, F03
**Blocks:** F05, F08, F11, F22, F26, F29

---

## What

The admin layout with sidebar navigation and a dashboard home page showing key stats. Individual admin sections (events, stories, blog, etc.) are built in their respective feature docs.

## Pages

- `src/app/admin/layout.tsx` — Admin layout with sidebar
- `src/app/admin/page.tsx` — Dashboard home

## Components

- `src/components/admin/admin-sidebar.tsx` — Sidebar navigation
- `src/components/admin/rich-text-editor.tsx` — Shared rich text editor (Markdown or WYSIWYG)
- `src/components/admin/image-uploader.tsx` — Shared image upload to Supabase Storage

## Spec

### Admin Layout
- Left sidebar (collapsible on mobile) with nav:
  - Dashboard (home)
  - Events (+ badge showing pending count)
  - Stories
  - Blog
  - Newsletter
  - Tours
  - Subscribers
- Main content area (right)
- Top bar: "The Ubudian Admin" + logout button

### Dashboard Home
- Key stats cards:
  - Total newsletter subscribers
  - Total published events
  - Total published stories
  - Pending event submissions (with link to moderation queue)
- Recent activity: last 5 published events, stories, newsletter editions

### Shared Components

**Rich Text Editor:**
- Markdown editor with preview (or lightweight WYSIWYG like Tiptap)
- Supports: headings, bold/italic, links, images, lists
- Used across: blog posts, stories, event descriptions, tour descriptions, newsletter sections

**Image Uploader:**
- Drag & drop or click to upload
- Uploads to Supabase Storage
- Returns public URL
- Shows preview after upload
- Used across: blog covers, story photos, event covers, tour photos

## Verification

- Admin layout renders with sidebar
- Sidebar links navigate correctly
- Dashboard shows stats (can be placeholder/zero initially)
- Rich text editor renders and produces content
- Image uploader uploads to Supabase Storage and returns URL
