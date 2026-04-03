import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export type LocalStoredObject = {
  absolutePath: string;
  contentType: string;
  size: number;
  download: () => Promise<[Buffer]>;
};

export class ObjectStorageService {
  getPublicObjectSearchPaths(): string[] {
    const configured = (process.env.PUBLIC_OBJECT_SEARCH_PATHS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => path.resolve(value));

    const defaults = [
      path.resolve(process.cwd(), "artifacts", "platform", "public"),
      path.resolve(process.cwd(), "artifacts", "api-server", "dist", "public"),
    ];

    return Array.from(new Set([...configured, ...defaults]));
  }

  getPrivateObjectDir(): string {
    return path.resolve(process.env.PRIVATE_OBJECT_DIR || path.join(process.cwd(), "storage", "private"));
  }

  async searchPublicObject(filePath: string): Promise<LocalStoredObject | null> {
    const normalized = filePath.replace(/^\/+/, "");
    for (const baseDir of this.getPublicObjectSearchPaths()) {
      const candidate = path.resolve(baseDir, normalized);
      if (!candidate.startsWith(baseDir)) continue;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return this.buildLocalObject(candidate);
      }
    }
    return null;
  }

  async downloadObject(file: LocalStoredObject, cacheTtlSec = 3600): Promise<Response> {
    const nodeStream = fs.createReadStream(file.absolutePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;
    return new Response(webStream, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
        "Content-Length": String(file.size),
      },
    });
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    return `/api/storage/uploads/${objectId}`;
  }

  async writeObjectEntity(objectId: string, body: Buffer | Uint8Array) {
    const safeId = objectId.replace(/[^a-zA-Z0-9-]/g, "");
    if (!safeId) {
      throw new Error("Invalid object id");
    }
    const filePath = path.join(this.getPrivateObjectDir(), "uploads", safeId);
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    await fsp.writeFile(filePath, body);
    return `/objects/uploads/${safeId}`;
  }

  async getObjectEntityFile(objectPath: string): Promise<LocalStoredObject> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }

    const relativePath = objectPath.replace(/^\/objects\//, "");
    const baseDir = this.getPrivateObjectDir();
    const absolutePath = path.resolve(baseDir, relativePath);

    if (!absolutePath.startsWith(baseDir) || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new ObjectNotFoundError();
    }

    return this.buildLocalObject(absolutePath);
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (rawPath.startsWith("/api/storage/uploads/")) {
      const objectId = rawPath.split("/").pop() || "";
      return `/objects/uploads/${objectId}`;
    }
    return rawPath;
  }

  private buildLocalObject(absolutePath: string): LocalStoredObject {
    const stats = fs.statSync(absolutePath);
    return {
      absolutePath,
      contentType: getContentType(absolutePath),
      size: stats.size,
      download: async () => [await fsp.readFile(absolutePath)],
    };
  }
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".doc":
      return "application/msword";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".csv":
      return "text/csv";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json";
    default:
      return "application/octet-stream";
  }
}
