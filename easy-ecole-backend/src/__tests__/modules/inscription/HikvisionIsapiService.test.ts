import http from "http";
import { createHash } from "crypto";

jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({ PointageTerminal: {} }));
jest.mock("../../../modules/inscription/controllers/PointageTerminalController", () => ({
  __esModule: true,
  default: { processAttendanceEvent: jest.fn() }
}));

import HikvisionIsapiService, { parseHikvisionAccessEvents } from "../../../modules/inscription/services/HikvisionIsapiService";

const DEVICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<EventNotificationAlert>
  <eventType>AccessControllerEvent</eventType>
  <eventState>active</eventState>
  <dateTime>2026-10-17T08:15:30+00:00</dateTime>
  <AccessControllerEvent>
    <majorEventType>5</majorEventType>
    <subEventType>75</subEventType>
    <employeeNoString>42</employeeNoString>
    <currentVerifyMode>face</currentVerifyMode>
  </AccessControllerEvent>
</EventNotificationAlert>`;

describe("HikvisionIsapiService", () => {
  const previousKey = process.env.ENCRYPTION_MASTER_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_MASTER_KEY = "a".repeat(64);
  });

  afterAll(() => {
    if (previousKey === undefined) delete process.env.ENCRYPTION_MASTER_KEY;
    else process.env.ENCRYPTION_MASTER_KEY = previousKey;
  });

  it("accepts successful facial access events only", () => {
    const deniedEvent = DEVICE_XML.replace("<subEventType>75</subEventType>", "<subEventType>76</subEventType>");
    const fingerprintEvent = DEVICE_XML.replace("<currentVerifyMode>face</currentVerifyMode>", "<currentVerifyMode>fingerprint</currentVerifyMode>");

    expect(parseHikvisionAccessEvents(DEVICE_XML)).toEqual([{
      pin: "42",
      date: "2026-10-17",
      time: "08:15:30"
    }]);
    expect(parseHikvisionAccessEvents(deniedEvent)).toEqual([]);
    expect(parseHikvisionAccessEvents(fingerprintEvent)).toEqual([]);
  });

  it("encrypts terminal credentials instead of retaining clear text", () => {
    const clearTextPassword = "local-device-secret";
    const encrypted = HikvisionIsapiService.encryptCredential(clearTextPassword);
    expect(encrypted).not.toContain(clearTextPassword);
    expect(encrypted.split(".")).toHaveLength(3);
  });

  it("authenticates an ISAPI device with HTTP Digest and checks its serial number", async () => {
    const password = "local-device-secret";
    const server = http.createServer((req, res) => {
      const authorization = req.headers.authorization || "";
      const values = Object.fromEntries([...authorization.matchAll(/(\w+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
      const nonceCount = authorization.match(/\bnc=([0-9a-f]+)/i)?.[1];
      const qop = authorization.match(/\bqop=([a-z]+)/i)?.[1];
      const hash = (value: string) => createHash("md5").update(value).digest("hex");
      const validResponse = values.username === "test-user" &&
        values.realm === "easyecole-test" &&
        values.nonce === "nonce-123" &&
        values.uri === "/ISAPI/System/deviceInfo" &&
        qop === "auth" &&
        !!nonceCount &&
        !!values.cnonce &&
        values.response === hash(
          `${hash(`test-user:easyecole-test:${password}`)}:nonce-123:${nonceCount}:${values.cnonce}:auth:${hash("GET:/ISAPI/System/deviceInfo")}`
        );
      if (!validResponse) {
        res.writeHead(401, { "WWW-Authenticate": 'Digest realm="easyecole-test", nonce="nonce-123", qop="auth", algorithm=MD5' });
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "application/xml" });
      res.end("<DeviceInfo><serialNumber>DS-K1T342MFWX-E1</serialNumber></DeviceInfo>");
    });

    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test HTTP server did not bind to a TCP port.");
    const terminal = {
      sourceIp: "127.0.0.1",
      hikvisionPort: address.port,
      hikvisionHttps: false,
      hikvisionUsername: "test-user",
      hikvisionPasswordEncrypted: HikvisionIsapiService.encryptCredential(password),
      serialNumber: "DS-K1T342MFWX-E1"
    } as any;

    try {
      await expect(HikvisionIsapiService.testConnection(terminal)).resolves.toBeUndefined();
      await expect(HikvisionIsapiService.testConnection({ ...terminal, serialNumber: "WRONG-SERIAL" })).rejects.toThrow("does not match");
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
