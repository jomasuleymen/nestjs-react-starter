declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'test' | 'production';
      BACKGROUND_ROLE?: 'worker' | 'scheduler';
      BACKGROUND_JOBS?: string;
    }
  }
}

export {};
