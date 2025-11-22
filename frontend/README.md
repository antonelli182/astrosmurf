# Knowledge Made Visual

Transform any article, research paper, or blog post into engaging visual content using AI. Convert complex ideas into memorable memes, engaging comics, or simplified explanations.

## Features

- 🎯 **Three Content Formats**
  - **Memes**: Witty, shareable visual content
  - **Comics**: Sequential narrative panels
  - **Simplified**: Clear, educational explanations

- 🚀 **Powered by AI**
  - Web scraping with Firecrawl
  - Content analysis with LLMs
  - Image generation with DALL-E 3

- ✨ **Modern UI**
  - Built with Next.js 14 App Router
  - Styled with Tailwind CSS
  - Components from shadcn/ui
  - Animations with Framer Motion

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Create a `.env.local` file:

```env
# Backend API URL (when ready)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# NextAuth (if using auth)
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## How It Works

### URL Routing

The app uses a dynamic routing pattern:

```
/{contentType}/{encodedUrl}
```

Examples:
- `/meme/https%3A%2F%2Fexample.com%2Farticle`
- `/comic/https%3A%2F%2Fblog.com%2Fpost`
- `/simplify/https%3A%2F%2Fresearch.edu%2Fpaper`

### Processing Flow

1. **Scrape**: Extract content from the provided URL
2. **Analyze**: AI identifies key concepts based on content type
3. **Generate**: Create visual content from concepts

## Project Structure

```
frontend/
├── app/
│   ├── [category]/
│   │   └── [encodedUrl]/
│   │       └── page.tsx          # Dynamic route handler
│   ├── actions.ts                # Server actions
│   ├── page.tsx                  # Landing page
│   └── layout.tsx
├── components/
│   ├── generation-form.tsx       # URL input form
│   ├── process-flow.tsx          # Processing UI
│   └── ui/                       # shadcn components
├── lib/
│   ├── mock-ai.ts               # Mock backend (temporary)
│   └── utils.ts
└── API_INTEGRATION.md           # Backend integration guide
```

## Current Status

✅ **Frontend Complete**
- URL routing and validation
- Three content types (meme, comic, simplify)
- Progress tracking UI
- Results display
- Error handling

⏳ **Backend In Progress**
- Currently using mock data
- See `API_INTEGRATION.md` for backend API specifications
- Ready to connect to real backend

## Backend Integration

The frontend is ready to connect to a backend API. See [API_INTEGRATION.md](./API_INTEGRATION.md) for:
- API endpoint specifications
- Request/response formats
- Integration instructions
- Testing guide

To switch from mock to real backend:

1. Update `app/actions.ts` to use `NEXT_PUBLIC_BACKEND_URL`
2. Replace mock calls with actual fetch requests
3. Ensure backend implements the specified API

## Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Form Validation**: Native HTML5 + TypeScript

## Development

### Key Files to Edit

- `app/page.tsx` - Landing page and hero
- `components/generation-form.tsx` - Input form
- `components/process-flow.tsx` - Processing UI
- `app/actions.ts` - API integration
- `lib/mock-ai.ts` - Mock responses (temporary)

### Adding New Content Types

1. Add type to `contentTypes` in `generation-form.tsx`
2. Add concepts in `mock-ai.ts` (or backend)
3. Update route validation in `app/actions.ts`

## Deploy

### Vercel (Recommended)

```bash
npm run build
vercel deploy
```

### Docker

```bash
docker build -t knowledge-visual .
docker run -p 3000:3000 knowledge-visual
```

## License

MIT
