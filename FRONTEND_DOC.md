# Frontend Documentation — DaliData Portal

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Setup](#3-project-setup)
4. [File Structure](#4-file-structure)
5. [Entry Points](#5-entry-points)
6. [Routing & Navigation](#6-routing--navigation)
7. [Authentication](#7-authentication)
8. [Pages Reference](#8-pages-reference)
9. [Shared Components](#9-shared-components)
10. [Utility Functions](#10-utility-functions)
11. [Theme & Styling](#11-theme--styling)
12. [Color Scheme](#12-color-scheme)
13. [Assets](#13-assets)
14. [Known Issues / Incomplete Work](#14-known-issues--incomplete-work)

---

## 1. Project Overview

DaliData Portal is a dataset marketplace and data management platform. It supports:

- Public dataset browsing and search
- Role-based dashboards (Admin, Editor, Seller, Buyer, Viewer)
- Authentication (Login, Register, Forgot Password, Reset Password)
- Geospatial, agricultural, and analytics tools (in admin sidebar)

---

## 2. Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Framework | React | 19 |
| Router | React Router DOM | v7 |
| UI Components | Material-UI (MUI) | 7.3.9 |
| Styling | TailwindCSS + Emotion | v4.2 |
| Icons | Lucide React, React Icons, Bootstrap Icons | — |
| HTTP Client | Axios | 1.12.2 |
| Maps | Leaflet, React Leaflet, Turf.js | 1.9.4 / 5.0.0 |
| Charts | Chart.js, Recharts | 4.5.1 / 3.8.0 |
| Calendar | FullCalendar | 6.1.20 |
| File Handling | XLSX, jsPDF, JSZip, HTML2Canvas | — |
| Rich Text | Tiptap (WYSIWYG) | — |
| Alerts | SweetAlert2 + React wrapper | — |
| Notifications | React Toastify | — |
| QR / Barcode | QRCode, jsBarcode | — |
| Counters | React CountUp | — |
| Date Picker | React DatePicker | — |
| File Upload | React Dropzone | — |
| Bundler | Vite | — |
| Linting | ESLint (React hooks + refresh rules) | — |

---

## 3. Project Setup

### Prerequisites

- Node.js v18 or newer
- npm (comes with Node.js)

### Installation

```bash
cd frontend
npm install
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server at http://localhost:5173 |
| `npm run build` | Build for production (output: `dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint checks |

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE=http://127.0.0.1:8000
```

> The Axios instance in `src/utils/api.js` reads `VITE_API_BASE` and defaults to `http://127.0.0.1//api` if unset. Note: the current default has a double slash — verify this matches your backend route prefix.

---

## 4. File Structure

```
frontend/
├── index.html                        # HTML entry point (SEO metadata, OG tags, JSON-LD, fonts)
├── package.json                      # Project dependencies and scripts
├── package-lock.json                 # Locked dependency tree
├── vite.config.js                    # Vite config (React plugin + TailwindCSS plugin)
├── eslint.config.js                  # ESLint rules (React hooks, refresh, strict vars)
├── FRONTEND_DOC.md                   # This file
├── README.md                         # Basic setup instructions
├── .gitignore
│
├── public/
│   ├── favicon.png
│   └── icon.png
│
└── src/
    ├── main.jsx                      # React root: ThemeProvider + BrowserRouter + CssBaseline
    ├── App.jsx                       # Route definitions (public + protected)
    ├── App.css                       # Empty (deprecated)
    ├── index.css                     # Global styles — Poppins font, body reset
    ├── theme.js                      # MUI custom theme (colors, typography, font)
    │
    ├── assets/
    │   ├── banner1.png
    │   ├── dali-data-icon.png.png
    │   ├── dali-data-logo.png
    │   ├── dali-icon.png
    │   ├── dali-logo.png
    │   ├── ddp-logo.png
    │   ├── favicon.png
    │   └── icon.png
    │
    ├── utils/
    │   ├── api.js                    # Configured Axios instance
    │   ├── encode.js                 # Base64 ID encode/decode helpers
    │   └── roleRedirect.js           # Maps user role → dashboard path
    │
    └── pages/
        ├── OnboardPage.jsx           # Public landing/onboard page
        ├── LoginPage.jsx             # Login form
        ├── RegisterPage.jsx          # Registration form
        ├── ForgotPasswordPage.jsx    # Password recovery
        ├── NewPassword.jsx           # Password reset (token-based)
        ├── LogoutPage.jsx            # Logout success screen
        │
        ├── public/                   # Pages accessible without login
        │   ├── PublicHome.jsx        # Dataset marketplace browse & filter
        │   ├── DatasetInfo.jsx       # Dataset detail page
        │   └── components/
        │       ├── PageLayout.jsx    # Wrapper: NavBar + content + Footer
        │       ├── NavBars.jsx       # Top navigation bar
        │       └── Footer.jsx        # Site footer
        │
        └── admin/                    # Protected dashboard pages
            ├── AdminDashboard.jsx    # Admin dashboard (stub)
            └── components/
                ├── PageLayout.jsx    # Layout: Navbar + collapsible sidebar + Footer
                ├── Sidebar.jsx       # Right-side navigation drawer
                ├── Navbar.jsx        # Top navbar with auth, notifications, profile
                └── Footer.jsx        # Dashboard footer
```

---

## 5. Entry Points

### `src/main.jsx`

Root renderer. Wraps the application with:
- `ThemeProvider` — MUI custom theme from `src/theme.js`
- `BrowserRouter` — React Router's history-based router
- `CssBaseline` — MUI global CSS reset

Poppins font is imported here across weights 300–900.

### `index.html`

Static HTML shell. Includes:
- SEO `<meta>` tags (description, keywords, robots, canonical)
- Open Graph tags for social sharing
- JSON-LD structured data for search engines
- Poppins Google Font link
- Bootstrap Icons CDN
- `<div id="root">` mount point

---

## 6. Routing & Navigation

### `src/App.jsx`

All routes are defined here. Structure:

```
/onboard                  → OnboardPage (public)
/login                    → LoginPage (public)
/register                 → RegisterPage (public)
/forgot-password          → ForgotPasswordPage (public)
/reset-password           → NewPassword (public, requires ?token=)
/public/home              → PublicHome (public)
/dataset-info/:id         → DatasetInfo (public)

/admin                    → AdminDashboard (protected)
/editor/dashboard         → EditorDashboard (protected) — stub
/seller/dashboard         → SellerDashboard (protected) — missing
/buyer/dashboard          → BuyerDashboard (protected) — missing

*                         → 404 fallback
```

### Protected Routes

`ProtectedRoute` component checks for `dali-token` and `dali-user` in `localStorage` or `sessionStorage`. If absent, redirects to `/onboard`.

### Role-Based Redirects

After login, `getDashboardPath(role)` in `src/utils/roleRedirect.js` resolves the correct dashboard:

| Role | Path |
|---|---|
| `super_admin`, `admin` | `/admin` |
| `editor` | `/editor/dashboard` |
| `seller` | `/seller/dashboard` |
| `buyer` | `/buyer/dashboard` |
| `viewer`, default | `/public/home` |

---

## 7. Authentication

### Storage Keys

| Key | Type | Content |
|---|---|---|
| `dali-token` | localStorage / sessionStorage | JWT access token |
| `dali-user` | localStorage / sessionStorage | JSON user object |

Storage location depends on the "remember me" choice at login (not yet explicitly shown in LoginPage — defaults to localStorage).

### Auth Events

A custom window event `auth:updated` is dispatched after login/logout. The admin `Navbar.jsx` listens to this for cross-tab sync and triggers re-validation.

### Token Polling

The admin `Navbar.jsx` polls for token validation and notifications every 60 seconds using `setInterval` inside a `useEffect`.

### API Endpoints Used

| Action | Method | Endpoint |
|---|---|---|
| Login | POST | `/auth/login` |
| Register | POST | `/auth/register` |
| Forgot Password | POST | `/auth/forgot-password` |
| Reset Password | POST | `/auth/reset-password` |

---

## 8. Pages Reference

### Public / Auth Pages

#### `OnboardPage.jsx`
Landing page shown to unauthenticated visitors.
- Hero section with animated gradient heading
- Search bar with dataset category tags rotating via `setInterval` (every 3.5s, 12 categories/slide)
- Two CTAs: **Continue as Guest** → `/public/home`, **Login** → `/login`

#### `LoginPage.jsx`
- Email + password form
- "Forgot password?" link → `/forgot-password`
- Demo credentials hint: `user@mail.com` / `123456`
- On success: stores token + user, redirects via `getDashboardPath(role)`

#### `RegisterPage.jsx`
Multi-field form:
- First name, last name, email
- Country dropdown (with auto phone code prefix)
- Phone number
- Business type dropdown (fetched from `/auth/business-types` API)
- Password + confirm password
- Submits to `/auth/register`

#### `ForgotPasswordPage.jsx`
- Email input → calls `/auth/forgot-password`
- Right panel: auto-rotating testimonial cards every 4.5s with manual dot navigation

#### `NewPassword.jsx`
- Reads `?token=` from URL query params
- Password + confirm password fields
- Validates: match check, length 6–72 chars
- Calls `/auth/reset-password`

#### `LogoutPage.jsx`
- Animated checkmark + progress bar
- Clears localStorage, sessionStorage, and cookies
- Auto-redirects to `/login` after 6 seconds

---

### Public Dataset Pages

#### `PublicHome.jsx`
Dataset marketplace browse page.

**Features:**
- Full-width search bar with filter button (UI only — filter modal not yet implemented)
- Category chip filters: All datasets, Computer Science, Education, Classification, Computer Vision, NLP, Data Visualization, Pre-Trained Model
- Trending Datasets grid (4-column on desktop, 2 on tablet, 1 on mobile)
- `DatasetCard` subcomponent (see below)

**DatasetCard subcomponent:**
- Cover image (145px height)
- Title (clickable — navigates to `/dataset-info/:id` passing state)
- Author name
- Usability score + last updated
- File count, size, download count
- Upvote button with count
- Contributor avatars (teal-bordered)

> Dataset data is currently hardcoded. No API fetch is wired up yet.

#### `DatasetInfo.jsx`
Dataset detail page. Receives dataset object via `react-router` `location.state`.

**Sections:**
- Back button
- Action buttons: Upvote, Code, Download
- Title + subtitle + cover image
- Tabs: Data Card | Code | Discussion | Suggestions
- About section with description
- Accordion metadata: Collaborators, Authors, Dataset Coverage, DOI/License
- Activity metrics: Views, Downloads, Engagement Score, Comments
- Top Contributors avatar row
- Related Notebooks grid

---

### Admin / Dashboard Pages

#### `AdminDashboard.jsx`
Currently a placeholder. Renders the `admin/components/PageLayout.jsx` wrapper with a single "Editor Dashboard" heading. Not yet implemented.

---

## 9. Shared Components

### Public Layout (`src/pages/public/components/`)

#### `PageLayout.jsx`
Wraps public pages with `NavBars` at top and `Footer` at bottom. Sets `backgroundColor: #f8f9fb`.

#### `NavBars.jsx`
Responsive top navigation bar.
- Left: Dali logo (links to `/public/home`)
- Center: 6 nav links — Dataset, Budget, Project, Funds, Analysis, Report
- Right (authenticated): User avatar with dropdown menu
- Right (guest): Login + Register buttons
- Mobile: Hamburger menu collapsing to drawer

#### `Footer.jsx`
Minimal footer: centered `© DaliData` copyright text.

---

### Admin Layout (`src/pages/admin/components/`)

#### `PageLayout.jsx`
Dashboard layout shell:
- Fixed top navbar (70px height)
- Right-side collapsible sidebar (240px expanded → 70px collapsed)
- Main content fills remaining space
- Footer at bottom
- Smooth CSS transitions on sidebar toggle

#### `Sidebar.jsx`
Agriculture/farming dashboard navigation drawer.

**Menu groups:**

| Group | Items |
|---|---|
| — | Dashboard, Calendar |
| Fields | Add Field, Manage Fields, Field Images |
| Monitoring | Indices, Weather, Soil, VRA Maps |
| Risk | Flood, Drought |
| AI | AI Reports |
| — | Logout |

Features:
- Collapse/expand toggle button
- Active route highlight with teal glow effect
- Plan expiry alert banner
- Mobile-responsive (overlay mode)

#### `Navbar.jsx`
Bootstrap-based top navigation bar.
- Hamburger toggle (mobile sidebar)
- Animated satellite icon
- Company name: **DALI DATA PORTAL**
- Notifications bell with unread badge count
- User profile avatar + link
- Logout button
- Polls `/auth/validate-token` + notifications endpoint every 60 seconds
- Listens for `auth:updated` window events

#### `Footer.jsx`
Shows: `RADA AGRICULTURE Version 3.0` + current year.

---

## 10. Utility Functions

### `src/utils/api.js`

Pre-configured Axios instance:

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? "http://127.0.0.1//api",
});

export default api;
```

> Import this instead of raw `axios` for all API calls to get the correct base URL.

### `src/utils/encode.js`

```js
encodeId(id)      // → Base64 string (URL-safe ID encoding)
decodeId(encoded) // → original ID (with try-catch for malformed input)
```

Used for passing IDs in URLs without exposing raw database IDs.

### `src/utils/roleRedirect.js`

```js
getDashboardPath(role) // → string path based on user role
```

Used after login to redirect users to their appropriate dashboard.

---

## 11. Theme & Styling

### `src/theme.js`

MUI theme overrides:

```js
palette.primary.main   = "#1976d2"   // MUI default blue
palette.secondary.main = "#0ea5e9"   // Sky blue
palette.background.default = "#f6f7fb"
typography.fontFamily  = "Poppins, sans-serif"
```

### `src/index.css`

- Imports Poppins font
- Sets `body { font-family: Poppins, sans-serif; margin: 0; }`

### Inline Styling Pattern

All component-level styles use MUI's `sx` prop. TailwindCSS utility classes are available but rarely used in current code — MUI `sx` is the dominant pattern.

---

## 12. Color Scheme

| Purpose | Hex |
|---|---|
| Primary accent (teal) | `#61C5C3` |
| Dark page background | `#04121D` |
| Panel / card background | `#071A29` |
| Light page background | `#f8f9fb` |
| MUI theme background | `#f6f7fb` |
| Border / divider | `#e5e7eb`, `#d1d5db` |
| Body text | `#111827` |
| Muted text | `#6b7280` |
| Heading gradient start | `#5EC4C3` (teal) |
| Heading gradient end | orange |

---

## 13. Assets

All static assets are in `src/assets/`:

| File | Usage |
|---|---|
| `dali-data-logo.png` | Full horizontal logo |
| `dali-data-icon.png.png` | Square icon version |
| `dali-logo.png` | Alternative logo |
| `dali-icon.png` | Small icon |
| `ddp-logo.png` | DDP project logo |
| `banner1.png` | Hero/banner image |
| `favicon.png` | Browser tab icon |
| `icon.png` | App icon |

---

## 14. Known Issues / Incomplete Work

| Component | Issue |
|---|---|
| `AdminDashboard.jsx` | Placeholder only — shows "Editor Dashboard" text |
| `EditorDashboard.jsx` | Imported in `App.jsx` but content is a stub |
| `SellerDashboard.jsx` | Imported in `App.jsx` but file not found / not implemented |
| `BuyerDashboard.jsx` | Imported in `App.jsx` but file not found / not implemented |
| `PublicHome.jsx` | Dataset data is hardcoded — no API integration yet |
| `DatasetInfo.jsx` | Content is static — no API fetch |
| `NavBars.jsx` filter button | UI only — filter modal not implemented |
| `api.js` baseURL | Double slash in default: `http://127.0.0.1//api` — verify against backend |
| `Sidebar.jsx` | All sidebar links point to `/` or placeholder paths |

---

_Last updated: April 2026_
