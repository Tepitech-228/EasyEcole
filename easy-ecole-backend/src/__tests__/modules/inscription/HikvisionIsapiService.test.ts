jest.mock("../../../modules/inscription/models/PointageTerminal", () => ({ PointageTerminal: {} }));
jest.mock("../../../modules/inscription/controllers/PointageTerminalController", () => ({
  __esModule: true,
  default: { processAttendanceEvent: jest.fn() }
}));
jest.mock("../../../core/services/EncryptionService", () => ({
  getPersistedMasterKey: jest.fn(() => Buffer.alloc(32, 7))
}));

import HikvisionIsapiService, {
  getCurlExecutable,
  parseHikvisionAccessEvents
} from "../../../modules/inscription/services/HikvisionIsapiService";

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
});
