import createParentSymbol from "../create-symbol";
export function createSymbol(...name: string[]) {
  return createParentSymbol("metadata", ...name);
}
