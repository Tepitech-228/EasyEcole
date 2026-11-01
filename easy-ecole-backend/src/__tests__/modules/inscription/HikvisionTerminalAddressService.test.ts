import {
  classifyHikvisionTerminalAddress,
  isHikvisionTerminalAddressAllowed
} from "../../../modules/inscription/services/HikvisionTerminalAddressService";

describe("HikvisionTerminalAddressService", () => {
  const previousAllowlist = process.env.HIKVISION_TUNNEL_HOSTS;

  afterEach(() => {
    if (previousAllowlist === undefined) delete process.env.HIKVISION_TUNNEL_HOSTS;
    else process.env.HIKVISION_TUNNEL_HOSTS = previousAllowlist;
  });

  it("classifies IPv4, IPv6 and fully qualified hostnames", () => {
    expect(classifyHikvisionTerminalAddress("192.168.1.50")).toBe("ip");
    expect(classifyHikvisionTerminalAddress("2001:db8::1")).toBe("ip");
    expect(classifyHikvisionTerminalAddress("pointeuse.esaecole.com")).toBe("hostname");
    expect(classifyHikvisionTerminalAddress("k1-pointeuse.tunnel.example.org")).toBe("hostname");
  });

  it("rejects URLs, ports, paths, short names and malformed labels", () => {
    for (const invalid of [
      "",
      "localhost",
      "pointeuse",
      "https://pointeuse.example.com",
      "pointeuse.example.com:443",
      "pointeuse.example.com/ISAPI",
      "pointeuse..example.com",
      "-pointeuse.example.com",
      "pointeuse-.example.com",
      "pointeuse_example.com",
      "192.168.1"
    ]) {
      expect(classifyHikvisionTerminalAddress(invalid)).toBeNull();
    }
  });

  it("accepts every valid hostname when no allowlist is configured", () => {
    delete process.env.HIKVISION_TUNNEL_HOSTS;
    expect(isHikvisionTerminalAddressAllowed("k1.example.com")).toBe(true);
    // Les IP du LAN restent autorisees independamment de la liste.
    expect(isHikvisionTerminalAddressAllowed("10.0.0.12")).toBe(true);
  });

  it("restricts hostnames to the configured tunnel allowlist", () => {
    process.env.HIKVISION_TUNNEL_HOSTS = "pointeuses.example.com, .autre.example.net";
    expect(isHikvisionTerminalAddressAllowed("pointeuses.example.com")).toBe(true);
    expect(isHikvisionTerminalAddressAllowed("k1.pointeuses.example.com")).toBe(true);
    expect(isHikvisionTerminalAddressAllowed("k2.autre.example.net")).toBe(true);
    expect(isHikvisionTerminalAddressAllowed("k1.example.com")).toBe(false);
    expect(isHikvisionTerminalAddressAllowed("evil-pointeuses.example.com")).toBe(false);
    // Une IP valide n'est jamais bloquee par la liste.
    expect(isHikvisionTerminalAddressAllowed("192.168.1.50")).toBe(true);
  });
});
