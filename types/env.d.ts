declare namespace NodeJS {
  interface ProcessEnv {
    // API Configuration
    NEXT_PUBLIC_API_BASE_URL: string;
    NEXT_PUBLIC_API_KEY?: string;
    
    // Server-side only (not prefixed with NEXT_PUBLIC_)
    API_TOKEN?: string;
    
    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

