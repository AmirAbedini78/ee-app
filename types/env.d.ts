declare namespace NodeJS {
  interface ProcessEnv {
    // Directus CMS Configuration
    NEXT_PUBLIC_DIRECTUS_URL: string;
    
    // API Configuration (legacy - can be used for other APIs)
    NEXT_PUBLIC_API_BASE_URL?: string;
    NEXT_PUBLIC_API_KEY?: string;
    
    // Server-side only (not prefixed with NEXT_PUBLIC_)
    API_TOKEN?: string;
    
    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

