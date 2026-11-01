jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({ PointageTerminal: {} }));
jest.mock("../../../modules/inscription/controllers/PointageTerminalController", () => ({
  __esModule: true,
  default: { processAttendanceEvent: jest.fn() }
}));
jest.mock("../../../core/services/EncryptionService", () => ({
  getPersistedMasterKey: jest.fn(() => Buffer.alloc(32, 7))
}));

import HikvisionIsapiService, {
  buildTerminalUrl,
  getCurlExecutable,
  getTunnelAccessHeaders,
  parseHikvisionAccessEvents
} from "../../../modules/inscription/services/HikvisionIsapiService";
import type { PointageTerminal } from "../../../modules/inscription/models/PointageTerminal";

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

  it("selects the curl executable available on the current operating system", () => {
    expect(getCurlExecutable("linux")).toBe("curl");
    expect(getCurlExecutable("win32")).toBe("curl.exe");
  });

  it("encrypts terminal credentials instead of retaining clear text", () => {
    const clearTextPassword = "local-device-secret";
    const encrypted = HikvisionIsapiService.encryptCredential(clearTextPassword);
    expect(encrypted).not.toContain(clearTextPassword);
    expect(encrypted.split(".")).toHaveLength(3);
  });

  it("falls back to the persisted key when the environment variable is absent or invalid", () => {
    delete process.env.ENCRYPTION_MASTER_KEY;
    expect(HikvisionIsapiService.encryptCredential("fallback-secret").split(".")).toHaveLength(3);

    process.env.ENCRYPTION_MASTER_KEY = "not-a-valid-key";
    expect(HikvisionIsapiService.encryptCredential("fallback-secret").split(".")).toHaveLength(3);
  });

  it("builds ISAPI URLs for LAN IPs, IPv6 and tunnel hostnames", () => {
    const withAddress = (sourceIp: string | null, hikvisionPort: number | null, hikvisionHttps: boolean) => (
      { sourceIp, hikvisionPort, hikvisionHttps } as unknown as PointageTerminal
    );

    const ipUrl = buildTerminalUrl(withAddress("192.168.1.50", 8080, false), "/ISAPI/System/deviceInfo");
    expect(ipUrl.toString()).toBe("http://192.168.1.50:8080/ISAPI/System/deviceInfo");

    const ipv6Url = buildTerminalUrl(withAddress("2001:db8::1", 8443, true), "/ISAPI/System/deviceInfo");
    expect(ipv6Url.host).toBe("[2001:db8::1]:8443");
    expect(ipv6Url.protocol).toBe("https:");

    const hostnameUrl = buildTerminalUrl(withAddress("pointeuse.example.com", 443, true), "/ISAPI/System/deviceInfo");
    expect(hostnameUrl.toString()).toBe("https://pointeuse.example.com/ISAPI/System/deviceInfo");
    expect(hostnameUrl.hostname).toBe("pointeuse.example.com");

    expect(() => buildTerminalUrl(withAddress(null, 80, false), "/ISAPI/System/deviceInfo")).toThrow();
  });

  it("adds Cloudflare Access headers only for hostname targets", () => {
    const previousId = process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_ID;
    const previousSecret = process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_SECRET;
    process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_ID = "access-id";
    process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_SECRET = "access-secret";
    try {
      expect(getTunnelAccessHeaders(new URL("https://pointeuse.example.com/ISAPI/System/deviceInfo"))).toEqual([
        "-H", "CF-Access-Client-Id: access-id",
        "-H", "CF-Access-Client-Secret: access-secret"
      ]);
      expect(getTunnelAccessHeaders(new URL("http://192.168.1.50/ISAPI/System/deviceInfo"))).toEqual([]);
      expect(getTunnelAccessHeaders(new URL("https://[2001:db8::1]/ISAPI/System/deviceInfo"))).toEqual([]);
    } finally {
      if (previousId === undefined) delete process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_ID;
      else process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_ID = previousId;
      if (previousSecret === undefined) delete process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_SECRET;
      else process.env.HIKVISION_TUNNEL_ACCESS_CLIENT_SECRET = previousSecret;
    }
  });
});
