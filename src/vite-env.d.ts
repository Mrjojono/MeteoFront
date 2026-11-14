/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.json" {
  const value: unknown;
  export default value;
}

declare module "*.jsx" {
  import type { ComponentType } from "react";
  const Component: ComponentType<Record<string, unknown>>;
  export default Component;
}
