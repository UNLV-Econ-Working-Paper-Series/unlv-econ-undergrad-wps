import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const host = argument("--host", "127.0.0.1");
const port = Number.parseInt(argument("--port", "4321"), 10);
const distRoot = path.resolve(process.cwd(), argument("--dist", "dist"));

if (!Number.isInteger(port) || port < 1 || port > 65_535)
  throw new Error("--port must be from 1 through 65535");

const contentTypes = new Map([
  [".bib", "application/x-bibtex; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".ris", "application/x-research-info-systems; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

function insideDist(candidate) {
  const relative = path.relative(distRoot, candidate);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function fileForPathname(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relative = decoded.replace(/^\/+/, "");
  const candidates =
    decoded.endsWith("/") || relative === ""
      ? [path.join(distRoot, relative, "index.html")]
      : [path.join(distRoot, relative), path.join(distRoot, relative, "index.html")];

  for (const candidate of candidates) {
    if (!insideDist(candidate)) continue;
    try {
      const metadata = await stat(candidate);
      if (metadata.isFile()) return { path: candidate, size: metadata.size };
    } catch {
      // Continue through the bounded candidates.
    }
  }
  return null;
}

function sendFile(request, response, file, statusCode = 200) {
  const extension = path.extname(file.path).toLowerCase();
  response.writeHead(statusCode, {
    "Cache-Control": extension === ".html" ? "no-cache" : "public, max-age=3600",
    "Content-Length": file.size,
    "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(file.path).pipe(response);
}

const server = createServer(async (request, response) => {
  if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const pathname = new URL(request.url, `http://${host}:${port}`).pathname;
  const file = await fileForPathname(pathname);
  if (file) {
    sendFile(request, response, file);
    return;
  }

  const notFound = await fileForPathname("/404.html");
  if (notFound) {
    sendFile(request, response, notFound, 404);
    return;
  }
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  response.end("Not found\n");
});

server.listen(port, host, () => {
  console.log(`Serving ${distRoot} at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
