export class HikvisionAlertStreamParser {
  private buffer = Buffer.alloc(0);
  private boundary: Buffer | null = null;
  private readingPartHeaders = false;
  private pendingPart: { contentType: string; contentLength: number | null } | null = null;

  constructor(private readonly onJsonPart: (value: unknown) => void) {}

  push(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    this.readResponseHeaders();
    if (this.boundary) this.readParts();
  }

  private readResponseHeaders(): void {
    while (!this.boundary) {
      const separator = this.buffer.indexOf("\r\n\r\n");
      if (separator < 0) return;
      const headers = this.buffer.subarray(0, separator).toString("latin1");
      this.buffer = this.buffer.subarray(separator + 4);
      const boundary = headers.match(/\bboundary\s*=\s*\"?([^;\"\r\n]+)\"?/i)?.[1]?.trim();
      if (boundary) this.boundary = Buffer.from(`--${boundary}`);
    }
  }

  private readParts(): void {
    const boundary = this.boundary!;
    while (true) {
      if (this.pendingPart) {
        let part: Buffer;
        if (this.pendingPart.contentLength !== null) {
          if (this.buffer.length < this.pendingPart.contentLength) return;
          part = this.buffer.subarray(0, this.pendingPart.contentLength);
          this.buffer = this.buffer.subarray(this.pendingPart.contentLength);
          if (this.buffer.subarray(0, 2).equals(Buffer.from("\r\n"))) {
            this.buffer = this.buffer.subarray(2);
          }
        } else {
          const nextBoundary = this.buffer.indexOf(boundary);
          if (nextBoundary < 0) return;
          part = this.buffer.subarray(0, nextBoundary);
          if (part.subarray(-2).equals(Buffer.from("\r\n"))) part = part.subarray(0, -2);
          this.buffer = this.buffer.subarray(nextBoundary);
        }

        if (/\bjson\b/i.test(this.pendingPart.contentType)) {
          try {
            this.onJsonPart(JSON.parse(part.toString("utf8")));
          } catch {
            // Ignore incomplete or non-JSON parts and keep the stream alive.
          }
        }
        this.pendingPart = null;
        continue;
      }

      if (this.readingPartHeaders) {
        const headerEnd = this.buffer.indexOf("\r\n\r\n");
        if (headerEnd < 0) return;
        const headers = this.buffer.subarray(0, headerEnd).toString("latin1");
        const contentType = headers.match(/^content-type:\s*([^\r\n]+)/im)?.[1]?.trim() || "";
        const contentLength = Number(headers.match(/^content-length:\s*(\d+)/im)?.[1]);
        this.buffer = this.buffer.subarray(headerEnd + 4);
        this.pendingPart = {
          contentType,
          contentLength: Number.isSafeInteger(contentLength) && contentLength >= 0 ? contentLength : null
        };
        this.readingPartHeaders = false;
        continue;
      }

      const boundaryIndex = this.buffer.indexOf(boundary);
      if (boundaryIndex < 0) {
        if (this.buffer.length > 1024 * 1024) {
          this.buffer = this.buffer.subarray(-boundary.length);
        }
        return;
      }
      this.buffer = this.buffer.subarray(boundaryIndex + boundary.length);
      if (this.buffer.length < 2) return;
      if (this.buffer[0] === 45 && this.buffer[1] === 45) {
        this.buffer = Buffer.alloc(0);
        return;
      }
      if (this.buffer[0] !== 13 || this.buffer[1] !== 10) continue;
      this.buffer = this.buffer.subarray(2);
      this.readingPartHeaders = true;
    }
  }
}