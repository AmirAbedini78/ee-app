This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js 22.17.0 or higher
- npm, yarn, pnpm, or bun

### Local Development Setup

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd ee-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Configure environment variables**:
   
   Copy the example environment file and update it with your local backend URL:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and set your backend API URL:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
   ```
   
   If your API requires authentication, add:
   ```env
   NEXT_PUBLIC_API_KEY=your_api_key_here
   # or for server-side only:
   API_TOKEN=your_api_token_here
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open your browser**:
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the result.

   The page auto-updates as you edit files.

## API Integration

This project includes an API client for communicating with your backend API. The API client is located in `lib/api-client.ts`.

### Using the API Client

```typescript
import api from '@/lib/api-client';

// GET request
const data = await api.get('/users');

// GET with query parameters
const users = await api.get('/users', {
  params: { page: 1, limit: 10 }
});

// POST request
const newUser = await api.post('/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// PUT request
const updated = await api.put('/users/1', {
  name: 'Jane Doe'
});

// DELETE request
await api.delete('/users/1');
```

### Error Handling

```typescript
import api, { ApiError } from '@/lib/api-client';

try {
  const data = await api.get('/users');
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.statusText);
    console.error('Error data:', error.data);
  }
}
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Cloudways Deployment

For deploying to Cloudways, you need to configure environment variables in your Cloudways panel:

1. **Go to Cloudways Application Settings**:
   - Navigate to your application
   - Go to "Application Settings" or "Environment Variables"
   
2. **Set the following environment variables**:
   - `NEXT_PUBLIC_API_BASE_URL`: Your production backend API URL (e.g., `https://api.yourdomain.com/api`)
   - `NEXT_PUBLIC_API_KEY`: (If required) Your production API key
   - `API_TOKEN`: (If required) Server-side only API token
   - `NODE_ENV`: Set to `production`

3. **Build and Deploy**:
   ```bash
   npm run build
   npm start
   ```

**Important Notes**:
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser (client-side)
- Variables without `NEXT_PUBLIC_` prefix are only available server-side
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Always use `.env.example` as a template for required variables

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
