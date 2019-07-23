import { URL } from "url";

export function joinURL(root: string, ...path: string[]) {
  var url = new URL(root);
  url.pathname = [...stripTrailingSlash(url.pathname).split("/"), ...path].join(
    "/"
  );
  return url.toString();
}

function stripTrailingSlash(str: string): string {
  if (str[str.length - 1] === "/") {
    return str.substr(0, str.length - 1);
  }
  return str;
}
