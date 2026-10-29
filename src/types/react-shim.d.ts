// 离线构建环境中没有 @types/react，这里提供最小声明，保证 UI 代码可以类型检查。
// 在有网络的环境中可以删除本文件并安装 @types/react、@types/react-dom。
declare module 'react' {
  export type ReactNode = any;
  export type CSSProperties = Record<string, string | number | undefined>;
  export function useState<T>(init: T | (() => T)): [T, (v: T | ((p: T) => T)) => void];
  export function useEffect(fn: () => void | (() => void), deps?: unknown[]): void;
  export function useRef<T>(init: T): { current: T };
  export function useMemo<T>(fn: () => T, deps: unknown[]): T;
  export function useCallback<T>(fn: T, deps: unknown[]): T;
  export const StrictMode: any;
  export function Fragment(props: { children?: ReactNode }): any;
}
declare module 'react-dom/client' {
  export function createRoot(el: Element): { render(node: any): void };
}
declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
declare namespace JSX {
  interface IntrinsicElements {
    [name: string]: any;
  }
  interface Element {}
  interface IntrinsicAttributes {
    key?: string | number;
  }
  interface ElementChildrenAttribute {
    children: {};
  }
}
declare module '*.css';
