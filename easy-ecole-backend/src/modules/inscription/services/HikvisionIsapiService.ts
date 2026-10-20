import { createCipheriv, createHash, createDecipheriv, randomBytes } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { PointageTerminal } from "../models/PointageTerminal";

export interface HikvisionAccessEvent {
    pin: string;
    date: string;
    time: string;
}

interface DigestChallenge {
    realm: string;
    nonce: string;
    qop?: string;
    opaque?: string;
    algorithm: "MD5" | "MD5-sess" | "SHA-256";
}

function encryptPassword(password: string): string {
    const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyHex || !/^[a-fA-F0-9]{64}$/.test(masterKeyHex)) {
        throw new Error("ENCRYPTION_MASTER_KEY must be set to a 64-character hexadecimal key to configure Hikvision credentials.");
    }
    const key = Buffer.from(masterKeyHex, "hex");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((part: Buffer) => part.toString("base64")).join(".");
}

function decryptPassword(encryptedValue: string): string {
    const masterKeyHex = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyHex || !/^[a-fA-F0-9]{64}$/.test(masterKeyHex)) {
        throw new Error("ENCRYPTION_MASTER_KEY must be set to a 64-character hexadecimal key to connect to Hikvision.");
    }
    const [ivValue, tagValue, encryptedValuePart] = encryptedValue.split(".");
    if (!ivValue || !tagValue || !encryptedValuePart) throw new Error("Stored Hikvision credential is malformed.");
    const decipher = createDecipheriv("aes-256-gcm", Buffer.from(masterKeyHex, "hex"), Buffer.from(ivValue, "base64"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64"));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedValuePart, "base64")),
        decipher.final()
    ]).toString("utf8");
}

function md5(value: string): string {
    return createHash("md5").update(value).digest("hex");
}

function digestHash(algorithm: DigestChallenge["algorithm"], value: string): string {
    return createHash(algorithm === "SHA-256" ? "sha256" : "md5").update(value).digest("hex");
}

function parseDigestChallenge(header: string | null): DigestChallenge | null {
    if (!header || !/^Digest\s/i.test(header)) return null;
    const values: Record<string, string> = {};
    const pattern = /([a-zA-Z]+)=(?:"((?:\\.|[^"])*)"|([^,\s]+))/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(header))) values[match[1].toLowerCase()] = (match[2] ?? match[3]).replace(/\\(.)/g, "$1");
    const algorithmValue = (values.algorithm || "MD5").toUpperCase();
    const algorithm = algorithmValue === "MD5-SESS" ? "MD5-sess" : algorithmValue;
    if (
        !values.realm ||
        !values.nonce ||
        !["MD5", "MD5-sess", "SHA-256"].includes(algorithm) ||
        (values.qop && !values.qop.split(",").map(value => value.trim()).includes("auth"))
    ) return null;
    return {
        realm: values.realm,
        nonce: values.nonce,
        qop: values.qop ? "auth" : undefined,
        opaque: values.opaque,
        algorithm: algorithm as DigestChallenge["algorithm"]
    };
}

function createDigestAuthorization(
    challenge: DigestChallenge,
    username: string,
    password: string,
    method: string,
    uri: string
): string {
    const cnonce = randomBytes(16).toString("hex");
    const nonceCount = "00000001";
    let ha1 = digestHash(challenge.algorithm, `${username}:${challenge.realm}:${password}`);
    if (challenge.algorithm === "MD5-sess") ha1 = md5(`${ha1}:${challenge.nonce}:${cnonce}`);
    const ha2 = digestHash(challenge.algorithm, `${method}:${uri}`);
    const response = challenge.qop
        ? digestHash(challenge.algorithm, `${ha1}:${challenge.nonce}:${nonceCount}:${cnonce}:auth:${ha2}`)
        : digestHash(challenge.algorithm, `${ha1}:${challenge.nonce}:${ha2}`);
    const fields = [
        `username="${username}"`,
        `realm="${challenge.realm}"`,
        `nonce="${challenge.nonce}"`,
        `uri="${uri}"`,
        `response="${response}"`,
        `algorithm=${challenge.algorithm}`
    ];
    if (challenge.opaque) fields.push(`opaque="${challenge.opaque}"`);
    if (challenge.qop) fields.push(`qop=auth`, `nc=${nonceCount}`, `cnonce="${cnonce}"`);
    return `Digest ${fields.join(", ")}`;
}

function terminalUrl(terminal: PointageTerminal, path: string): URL {
    const scheme = terminal.hikvisionHttps ? "https" : "http";
    const host = terminal.sourceIp.includes(":") ? `[${terminal.sourceIp}]` : terminal.sourceIp;
    return new URL(`${scheme}://${host}:${terminal.hikvisionPort}${path}`);
}

async function requestWithDigest(
    terminal: PointageTerminal,
    path: string,
    signal?: AbortSignal,
    method = "GET",
    body?: string | FormData,
    contentType?: string
): Promise<Response> {
    const url = terminalUrl(terminal, path);
    const username = terminal.hikvisionUsername;
    const encryptedPassword = terminal.hikvisionPasswordEncrypted;
    if (!username || !encryptedPassword) throw new Error("Hikvision terminal credentials are not configured.");
    const password = decryptPassword(encryptedPassword);
    const headers: Record<string, string> = { Accept: "application/xml, application/json" };
    if (contentType) headers["Content-Type"] = contentType;
    const requestOptions: RequestInit = {
        method,
        headers,
        body,
        redirect: "manual",
        signal
    };
    const challengeResponse = await fetch(url, requestOptions);
    if (challengeResponse.status !== 401) {
        await challengeResponse.body?.cancel();
        throw new Error(`Hikvision must challenge requests with HTTP Digest authentication (received HTTP ${challengeResponse.status}).`);
    }
    await challengeResponse.body?.cancel();
    const challenge = parseDigestChallenge(challengeResponse.headers.get("www-authenticate"));
    if (!challenge) throw new Error("Hikvision returned an unsupported or malformed HTTP Digest challenge.");
    const authorization = createDigestAuthorization(challenge, username, password, method, `${url.pathname}${url.search}`);
    return fetch(url, {
        ...requestOptions,
        headers: { ...requestOptions.headers, Authorization: authorization }
    });
}

async function isSuccessfulHikvisionResponse(response: Response): Promise<{ success: boolean; detail: string }> {
    const body = await response.text();
    const statusCode = body.match(/<(?:\w+:)?statusCode\b[^>]*>\s*(\d+)\s*<\//i)?.[1]
        || body.match(/"statusCode"\s*:\s*"?(\d+)"?/i)?.[1];
    return {
        success: response.ok && (!statusCode || statusCode === "1"),
        detail: body.slice(0, 300)
    };
}

function xmlValue(xml: string, name: string): string | null {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = xml.match(new RegExp(`<(?:(?:\\w+):)?${escapedName}\\b[^>]*>([^<]*)<\\/`, "i"));
    return match ? match[1].trim() : null;
}

export function parseHikvisionAccessEvents(xml: string): HikvisionAccessEvent[] {
    const events: HikvisionAccessEvent[] = [];
    const eventPattern = /<(?:\w+:)?EventNotificationAlert\b[^>]*>([\s\S]*?)<\/(?:\w+:)?EventNotificationAlert\s*>/gi;
    let match: RegExpExecArray | null;
    while ((match = eventPattern.exec(xml))) {
        const event = match[1];
        if (xmlValue(event, "eventType") !== "AccessControllerEvent") continue;
        if ((xmlValue(event, "eventState") || "").toLowerCase() !== "active") continue;
        const accessEvent = event.match(/<(?:\w+:)?AccessControllerEvent\b[^>]*>([\s\S]*?)<\/(?:\w+:)?AccessControllerEvent\s*>/i)?.[1];
        if (!accessEvent || (xmlValue(accessEvent, "currentVerifyMode") || "").toLowerCase() !== "face") continue;
        if (xmlValue(accessEvent, "majorEventType") !== "5" || xmlValue(accessEvent, "subEventType") !== "75") continue;
        const pin = xmlValue(accessEvent, "employeeNoString") || xmlValue(accessEvent, "employeeNo");
        const timestamp = xmlValue(event, "dateTime");
        if (!pin || pin.length > 64 || !timestamp) continue;
        const parsed = timestamp.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (!parsed) continue;
        const [, year, month, day, hour, minute, second] = parsed;
        const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
        if (
            date.getUTCFullYear() !== Number(year) ||
            date.getUTCMonth() !== Number(month) - 1 ||
            date.getUTCDate() !== Number(day) ||
            Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59
        ) continue;
        events.push({ pin, date: `${year}-${month}-${day}`, time: `${hour}:${minute}:${second}` });
    }
    return events;
}

export default class HikvisionIsapiService {
    static encryptCredential(password: string): string {
        return encryptPassword(password);
    }

    static async testConnection(terminal: PointageTerminal): Promise<void> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        try {
            const response = await requestWithDigest(terminal, "/ISAPI/System/deviceInfo", controller.signal);
            if (!response.ok) throw new Error(`Hikvision device returned HTTP ${response.status}.`);
            const body = await response.text();
            if (!body.includes("deviceInfo") && !body.includes("DeviceInfo")) {
                throw new Error("The configured address did not return a Hikvision deviceInfo response.");
            }
            const serialNumber = body.match(/<(?:\w+:)?serialNumber\b[^>]*>([^<]+)<\//i)?.[1]?.trim();
            if (serialNumber && serialNumber !== terminal.serialNumber) {
                throw new Error("The serial number returned by the device does not match the configured terminal.");
            }
        } finally {
            clearTimeout(timer);
        }
    }

    static enrollStudent(
        terminal: PointageTerminal,
        student: { employeeNo: string; name: string; photoFilename: string }
    ): Promise<void> {
        return HikvisionIsapiService.enrollPerson(terminal, {
            ...student,
            photoCategory: "apprenant"
        });
    }

    static async enrollPerson(
        terminal: PointageTerminal,
        student: {
            employeeNo: string;
            name: string;
            photoFilename: string;
            photoCategory: "apprenant" | "enseignant" | "personnel";
        }
    ): Promise<void> {
        if (!/^[A-Za-z0-9._-]{1,64}$/.test(student.employeeNo) || !student.name.trim()) {
            throw new Error("Matricule or profile name is invalid for Hikvision enrollment.");
        }
        const photoDirectory = student.photoCategory === "apprenant"
            ? ["apprenants", "photos"]
            : student.photoCategory === "enseignant"
                ? ["enseignants", "photos"]
                : ["profiles"];
        const photoRoot = path.resolve(process.cwd(), "public", "auth", ...photoDirectory);
        const photoPath = path.resolve(photoRoot, student.photoFilename);
        if (path.dirname(photoPath) !== photoRoot || path.basename(student.photoFilename) !== student.photoFilename) {
            throw new Error("Profile photo path is invalid for Hikvision enrollment.");
        }
        const photo = await fs.readFile(photoPath);
        if (photo.length === 0 || photo.length > 5 * 1024 * 1024) {
            throw new Error("Profile photo is empty or exceeds the Hikvision upload limit.");
        }
        const extension = path.extname(photoPath).toLowerCase();
        const contentType = extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg";
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
            const userInfo = {
                employeeNo: student.employeeNo,
                name: student.name.trim().slice(0, 120),
                userType: "normal",
                Valid: {
                    enable: true,
                    beginTime: "2020-01-01T00:00:00",
                    endTime: "2037-12-31T23:59:59",
                    timeType: "local"
                }
            };
            const recordBody = JSON.stringify({ UserInfo: userInfo });
            const updateResponse = await requestWithDigest(
                terminal,
                "/ISAPI/AccessControl/UserInfo/Modify?format=json",
                controller.signal,
                "PUT",
                recordBody,
                "application/json"
            );
            const updateResult = await isSuccessfulHikvisionResponse(updateResponse);
            if (!updateResult.success) {
                const createResponse = await requestWithDigest(
                    terminal,
                    "/ISAPI/AccessControl/UserInfo/Record?format=json",
                    controller.signal,
                    "POST",
                    recordBody,
                    "application/json"
                );
                const createResult = await isSuccessfulHikvisionResponse(createResponse);
                if (!createResult.success) {
                    throw new Error(`Hikvision could not create the user (HTTP ${createResponse.status}): ${createResult.detail}`);
                }
            }

            const form = new FormData();
            form.append("person", JSON.stringify({
                faceLibType: "blackFD",
                FDID: "1",
                FPID: student.employeeNo,
                name: student.name.trim().slice(0, 120)
            }));
            form.append("image", new Blob([photo], { type: contentType }), path.basename(photoPath));
            const faceResponse = await requestWithDigest(
                terminal,
                "/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json",
                controller.signal,
                "POST",
                form
            );
            const faceResult = await isSuccessfulHikvisionResponse(faceResponse);
            if (!faceResult.success) {
                throw new Error(`Hikvision face enrollment failed (HTTP ${faceResponse.status}): ${faceResult.detail}`);
            }
        } finally {
            clearTimeout(timer);
        }
    }
}
