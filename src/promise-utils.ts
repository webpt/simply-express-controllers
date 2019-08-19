type MaybePromise<T> = T | Promise<T>;

export async function maybeAwaitPromise<T>(
  maybePromise: MaybePromise<T>
): Promise<T> {
  if (maybePromise instanceof Promise) {
    return await maybePromise;
  }
  return maybePromise;
}
