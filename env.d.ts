declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SERVER_PORT: string;
    }
  }
}

export {};
