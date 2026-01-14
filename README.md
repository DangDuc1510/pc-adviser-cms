# PC Adviser CMS

Admin dashboard for managing PC Adviser e-commerce platform.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp env.example .env.local
```

Required environment variables:
- `NEXT_PUBLIC_API_BASE` - Backend API base URL

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:4000](http://localhost:4000)

### Build

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE` - Your backend API URL
4. Deploy!

Vercel will automatically detect Next.js and use the build settings from `vercel.json`.
