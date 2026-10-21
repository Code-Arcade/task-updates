# ProTracker - Enterprise Project Tracking Dashboard

A complete, modern, responsive Project Tracking Dashboard built with **React.js, Vite, Tailwind CSS, Supabase (PostgreSQL), and Recharts**.

---

## 🌟 Key Features

1. **Dashboard Homepage**
   - **Metrics Overview:** Real-time counters for Total Projects, Completed Projects, In-Progress Projects, and Not-Started Projects.
   - **Overall Progress Gauge:** Dynamically calculates overall portfolio health and completion percentage across all projects.
   - **Recharts Data Visualizations:** 
     - **Donut Chart** representing project status distribution.
     - **Bar Chart** illustrating milestone completion per project.
   - **Recent Projects Table:** Quick access to projects with status badges, progress bars, and deadline indicators.

2. **Full Project CRUD Operations**
   - Create projects with Title, Description, Start Date, Due Date, and Status.
   - Edit project metadata with real-time recalculation.
   - Delete projects with a safe confirmation dialog that cleanly cascades to delete associated stages.
   - Search by project title/description and filter by status (*All, In Progress, Completed, Not Started*).

3. **Custom Project Stages (Milestones)**
   - Every project supports its own custom list of stages/milestones.
   - Each stage contains:
     - Name
     - Description / Notes
     - Status: `Not Started`, `In Progress`, `Completed`, or `Pending`
     - Due Date
     - Display order (Reorderable with Up / Down controls)
   - **Automatic Progress Calculation:** The parent project's progress bar and percentage are derived automatically from the ratio of completed stages.

4. **Supabase PostgreSQL & Security**
   - PostgreSQL schema with tables: `profiles`, `projects`, and `project_stages`.
   - Foreign key relationships with `ON DELETE CASCADE`.
   - Automatic `updated_at` triggers.
   - **Row Level Security (RLS)** policies configured so only authorized admins can read, update, or delete project data.
   - Supabase Email & Password authentication.
   - **Zero Service-Role key exposure:** Uses only the public client anon key.

5. **UI & Design Aesthetics**
   - Navy-blue sidebar (`#0f172a`), crisp white cards, clean typography, subtle slate borders, and blue accents.
   - Fully responsive for desktop, tablet, and mobile with a sliding drawer navigation.

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase Environment Variables
Copy the `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```
*(Alternatively, you can configure your Supabase URL & Key directly from the **Settings & Supabase** tab inside the dashboard UI!)*

### 3. Setup Supabase Database Schema
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor** tab.
3. Open [`supabase-schema.sql`](./supabase-schema.sql) in this repository and paste its entire content into the SQL editor.
4. Click **Run**. This will create the `profiles`, `projects`, and `project_stages` tables with Row Level Security (RLS) rules and cascade delete constraints.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Production Build
```bash
npm run build
```

---

## 🌐 Deploy to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Sign in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import this repository.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically build the Vite production bundle and publish your site with HTTPS.
