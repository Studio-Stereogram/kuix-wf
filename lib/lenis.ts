import type Lenis from "lenis";

let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => (instance = l);
export const getLenis = () => instance;
