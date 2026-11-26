export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Соединяет абсолютный baseUrl, путь и непустые query-параметры.
export function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(`${String(baseUrl).replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
  }
  return url.toString();
}

// requestJson(path, { method, query, body, signal, timeoutMs } = {})
// поддерживает GET, POST, PATCH и DELETE; ответ 204 преобразуется в null.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  let parsedBase;
  try { parsedBase = new URL(baseUrl); } catch { throw new TypeError("Некорректный baseUrl."); }
  if (!["http:", "https:"].includes(parsedBase.protocol) || parsedBase.search || parsedBase.hash
    || typeof fetchFn !== "function" || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new TypeError("Некорректная конфигурация API-клиента.");
  }
  const normalizedBase = parsedBase.toString().replace(/\/$/, "");

  async function requestJson(path, {
    method = "GET", query = {}, body, signal, timeoutMs: requestTimeout = timeoutMs,
  } = {}) {
    const normalizedMethod = String(method).toUpperCase();
    if (!["GET", "POST", "PATCH", "DELETE"].includes(normalizedMethod)) throw new TypeError("Неподдерживаемый HTTP-метод.");
    if (normalizedMethod === "GET" && body !== undefined) throw new TypeError("GET не должен содержать тело.");
    if (!Number.isSafeInteger(requestTimeout) || requestTimeout <= 0) throw new TypeError("Некорректный timeoutMs.");
    if (signal !== undefined && !(signal instanceof AbortSignal)) throw new TypeError("Некорректный AbortSignal.");
    const url = buildUrl(normalizedBase, path, query);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException("Timeout", "TimeoutError"));
    }, requestTimeout);
    const abortOutside = () => controller.abort(signal.reason);
    if (signal?.aborted) abortOutside();
    else signal?.addEventListener("abort", abortOutside, { once: true });
    const headers = { Accept: "application/json" };
    const options = { method: normalizedMethod, headers, signal: controller.signal };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }
    try {
      let response;
      try { response = await fetchFn(url, options); }
      catch (error) {
        if (timedOut) throw new ApiError("Превышено время ожидания ответа.", { kind: "timeout", url, cause: error });
        if (controller.signal.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: error });
        throw new ApiError("Сетевая ошибка.", { kind: "network", url, cause: error });
      }
      if (!(response instanceof Response)) throw new ApiError("Некорректный объект ответа.", { kind: "invalid-response", url });
      if (!response.ok) {
        let payload;
        try {
          if (response.headers.get("content-type")?.toLowerCase().includes("application/json")) payload = await response.json();
        } catch { /* HTTP-статус сохраняет приоритет */ }
        const problem = payload?.error;
        throw new ApiError(problem?.message ?? `HTTP ${response.status}`, {
          kind: "http", status: response.status, code: problem?.code ?? null,
          details: problem?.details ?? null, url,
        });
      }
      if (response.status === 204) return null;
      if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
        throw new ApiError("Ожидался JSON-ответ.", { kind: "invalid-response", url });
      }
      try { return await response.json(); }
      catch (error) { throw new ApiError("Повреждённый JSON.", { kind: "invalid-response", url, cause: error }); }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abortOutside);
    }
  }
  return { requestJson };
}
