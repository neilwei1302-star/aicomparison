# AI Model Comparison Tool

A real-time AI model comparison website built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. Compare responses from multiple AI models simultaneously using OpenRouter.

## Features

- ⚡ **Next.js 15** - Latest version with App Router
- 🔷 **TypeScript** - Type-safe development
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🧩 **shadcn/ui** - Beautiful, accessible UI components
- 🤖 **OpenRouter Integration** - Access to multiple AI models
- 📊 **Real-time Comparison** - Stream responses from multiple models side-by-side
- 📝 **Markdown Support** - Rendered markdown in responses
- 🎯 **Modern UI** - Clean and responsive design

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An OpenRouter API key ([Get one here](https://openrouter.ai/keys))

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Create a `.env.local` file in the root directory:

```bash
OPENROUTER_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter your prompt in the text area
2. Select one or more AI models from the dropdown (default models are pre-selected)
3. Click "Send" to compare responses
4. Watch as responses stream in real-time from all selected models

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── compare/      # API route for model comparison
│   │   └── models/       # API route for fetching available models
│   ├── layout.tsx        # Root layout
│   ├── page.tsx         # Home page with comparison interface
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── model-selector.tsx      # Multi-select model dropdown
│   └── model-response-card.tsx # Card component for displaying responses
├── lib/
│   └── utils.ts         # Utility functions
└── public/              # Static assets
```

## Default Models

The app comes with these models pre-selected:
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4o`
- `google/gemini-1.5-flash-latest`
- `meta-llama/llama-3.1-70b-instruct`

You can change the default models by editing `DEFAULT_MODELS` in `app/page.tsx`.

## Adding shadcn/ui Components

To add more shadcn/ui components, you can use the CLI:

```bash
npx shadcn@latest add [component-name]
```

Or manually add components to the `components/ui` directory following the shadcn/ui patterns.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)

