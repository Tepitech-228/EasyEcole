import { mockRequest } from "../../helpers/express-mocks";
import PointageTerminalTokenService from "../../../modules/inscription/services/PointageTerminalTokenService";

const TOKEN = `ptk_${"a".repeat(43)}`;

describe("PointageTerminalTokenService", () => {
  it("generates prefixed tokens and only keeps their SHA-256 hash", () => {
    const generated = PointageTerminalTokenService.generate();

    expect(generated.token).toMatch(/^ptk_[A-Za-z0-9_-]{43}$/);
    expect(generated.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(generated.hash).toBe(PointageTerminalTokenService.hash(generated.token));
  });

  it("extracts a token from the query string, path, header or bearer", () => {
    expect(PointageTerminalTokenService.extract(mockRequest({ query: { token: TOKEN } } as any))).toBe(TOKEN);
    expect(PointageTerminalTokenService.extract(mockRequest({ params: { deviceToken: TOKEN } } as any))).toBe(TOKEN);
    expect(PointageTerminalTokenService.extract(mockRequest({ headers: { "x-pointage-token": TOKEN } } as any))).toBe(TOKEN);
    expect(PointageTerminalTokenService.extract(mockRequest({ headers: { authorization: `Bearer ${TOKEN}` } } as any))).toBe(TOKEN);
  });

  it("ignores malformed tokens", () => {
    expect(PointageTerminalTokenService.extract(mockRequest({ query: { token: "ptk_short" } } as any))).toBe("");
    expect(PointageTerminalTokenService.extract(mockRequest({ query: { token: "../../etc/passwd" } } as any))).toBe("");
  });

  it("matches a token against its stored hash only", () => {
    const hash = PointageTerminalTokenService.hash(TOKEN);

    expect(PointageTerminalTokenService.matches(TOKEN, hash)).toBe(true);
    expect(PointageTerminalTokenService.matches(`ptk_${"b".repeat(43)}`, hash)).toBe(false);
    expect(PointageTerminalTokenService.matches(TOKEN, null)).toBe(false);
  });

  it("requires the token when the terminal has one, and falls back to IP otherwise", () => {
    const tokenTerminal = { sourceIp: "192.168.1.12", deviceTokenHash: PointageTerminalTokenService.hash(TOKEN) };
    expect(PointageTerminalTokenService.authorize(
      tokenTerminal,
      mockRequest({ query: { token: TOKEN }, ip: "203.0.113.50" } as any)
    )).toBe(true);
    expect(PointageTerminalTokenService.authorize(
      tokenTerminal,
      mockRequest({ ip: "192.168.1.12" } as any)
    )).toBe(false);

    const legacyTerminal = { sourceIp: "192.168.1.12", deviceTokenHash: null };
    expect(PointageTerminalTokenService.authorize(
      legacyTerminal,
      mockRequest({ ip: "::ffff:192.168.1.12" } as any)
    )).toBe(true);
    expect(PointageTerminalTokenService.authorize(
      legacyTerminal,
      mockRequest({ ip: "192.168.1.99" } as any)
    )).toBe(false);
  });
});
