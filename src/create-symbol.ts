const URI_PREFIX = "com.webpt.soapdish.controllers";
export default function createSymbol(...name: (string | string[])[]): symbol {
  const fullName = ([] as string[]).concat(...name);
  return Symbol.for(`${URI_PREFIX}:${fullName}`);
}
