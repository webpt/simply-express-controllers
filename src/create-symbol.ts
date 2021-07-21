const URI_PREFIX = "https://github.com/webpt/simply-express-controllers#";
export default function createSymbol(...name: (string | string[])[]): symbol {
  const fullName = ([] as string[]).concat(...name);
  return Symbol.for(`${URI_PREFIX}:${fullName}`);
}
