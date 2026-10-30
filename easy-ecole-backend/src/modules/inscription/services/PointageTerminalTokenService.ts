import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { Request } from "express";

const TOKEN_PREFIX = "ptk_";
const TOKEN_BYTES = 32;
/** 32 octets en base64url = 43 caracteres sans padding. */
const TOKEN_PATTERN = /^ptk_[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

export interface GeneratedDeviceToken {
    token: string;
    hash: string;
}

/**
 * Secret partagé avec une pointeuse distante.
 *
 * Le terminal n'a pas de compte utilisateur : on génère un jeton aléatoire,
 * on ne stocke que son empreinte SHA-256 et on le compare en temps constant.
 * Cela permet le pointage à travers le tunnel Cloudflare, où l'IP source
 * n'identifie plus l'appareil.
 */
export default class PointageTerminalTokenService {
    static generate(): GeneratedDeviceToken {
        const token = TOKEN_PREFIX + randomBytes(TOKEN_BYTES).toString("base64url");
        return { token, hash: this.hash(token) };
    }

    static hash(token: string): string {
        return createHash("sha256").update(token, "utf8").digest("hex");
    }

    static normalize(value: unknown): string {
        if (typeof value !== "string") return "";
        const token = value.trim();
        return TOKEN_PATTERN.test(token) ? token : "";
    }

    /**
     * Jeton accepté depuis ?token=..., /:deviceToken, X-Pointage-Token ou
     * Authorization: Bearer, selon ce que le firmware du terminal accepte.
     */
    static extract(req: Request): string {
        const fromQuery = this.normalize(req.query?.token);
        if (fromQuery) return fromQuery;

        const params = req.params as Record<string, unknown> | undefined;
        const fromPath = this.normalize(params?.deviceToken);
        if (fromPath) return fromPath;

        const header = req.headers?.["x-pointage-token"];
        const fromHeader = this.normalize(Array.isArray(header) ? header[0] : header);
        if (fromHeader) return fromHeader;

        const authorization = typeof req.headers?.authorization === "string"
            ? req.headers.authorization
            : "";
        const bearer = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
        return this.normalize(bearer);
    }

    static matches(token: string, hash: string | null | undefined): boolean {
        if (!token || !hash || !HASH_PATTERN.test(hash)) return false;
        const provided = Buffer.from(this.hash(token), "hex");
        const expected = Buffer.from(hash, "hex");
        return provided.length === expected.length && timingSafeEqual(provided, expected);
    }

    static normalizeIp(ip: string): string {
        return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
    }

    /**
     * Jeton si le terminal en possède un, repli sur l'IP source pour les
     * installations existantes (le jeton reste optionnel en base).
     */
    static authorize(
        terminal: { sourceIp?: string | null, deviceTokenHash?: string | null },
        req: Request
    ): boolean {
        if (terminal.deviceTokenHash) {
            return this.matches(this.extract(req), terminal.deviceTokenHash);
        }
        const sourceIp = terminal.sourceIp || "";
        if (!sourceIp) return false;
        const remoteIp = req.ip || req.socket?.remoteAddress || "";
        return this.normalizeIp(remoteIp) === this.normalizeIp(sourceIp);
    }
}
