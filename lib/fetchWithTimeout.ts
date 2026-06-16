export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Timeout etter ${timeoutMs}ms: ${url}`));
    }, timeoutMs)
  );

  return Promise.race([
    fetch(url, { ...options, signal: controller.signal }),
    timeout,
  ]);
}
