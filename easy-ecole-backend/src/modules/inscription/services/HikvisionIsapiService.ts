import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { spawn } from "child_process";
import { PointageTerminal } from "../models/PointageTerminal";

export interface HikvisionAccessEvent {
    pin: string;
    date: string;
    time: string;
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

function terminalUrl(terminal: PointageTerminal, path: string): URL {
    const scheme = terminal.hikvisionHttps ? "https" : "http";
    const host = terminal.sourceIp.includes(":") ? `[${terminal.sourceIp}]` : terminal.sourceIp;
    return new URL(`${scheme}://${host}:${terminal.hikvisionPort}${path}`);
}

interface CurlResponse {
    status: number;
    body: string;
}

export function getCurlExecutable(platform: NodeJS.Platform = process.platform): string {
    return platform === "win32" ? "curl.exe" : "curl";
}

function runCurl(args: string[], timeoutMs: number): Promise<CurlResponse> {
    return new Promise((resolve, reject) => {
        const curlArgs = [...args, "-s", "-w", "\\n__HTTP_CODE__%{http_code}"];
        const proc = spawn(getCurlExecutable(), curlArgs, { windowsHide: true });
        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", (d: Buffer) => { stdout += d.toString("utf8"); });
        proc.stderr.on("data", (d: Buffer) => { stderr += d.toString("utf8"); });
        const timer = setTimeout(() => { proc.kill(); reject(new Error("Hikvision curl request timeout")); }, timeoutMs);
        proc.on("close", () => {
            clearTimeout(timer);
            const marker = stdout.lastIndexOf("__HTTP_CODE__");
            const codeText = marker >= 0 ? stdout.slice(marker + "__HTTP_CODE__".length).trim() : "0";
            const body = marker >= 0 ? stdout.slice(0, marker).replace(/\n$/, "") : stdout;
            resolve({ status: Number(codeText) || 0, body: body || stderr });
        });
        proc.on("error", (err) => { clearTimeout(timer); reject(err); });
    });
}

async function requestWithDigest(
    terminal: PointageTerminal,
    path: string,
    signal?: AbortSignal,
    method = "GET",
    body?: string | FormData,
    contentType?: string
): Promise<CurlResponse> {
    const url = terminalUrl(terminal, path);
    const username = terminal.hikvisionUsername;
    const encryptedPassword = terminal.hikvisionPasswordEncrypted;
    if (!username || !encryptedPassword) throw new Error("Hikvision terminal credentials are not configured.");
    const password = decryptPassword(encryptedPassword);
    const args = ["--digest", "-u", `${username}:${password}`, "-X", method, "--connect-timeout", "10", "--max-time", "25"];
    if (signal?.aborted) throw new Error("Hikvision request aborted.");
    if (typeof body === "string") {
        args.push("-H", `Content-Type: ${contentType || "application/json"}`, "--data-binary", body);
    } else if (body instanceof FormData) {
        throw new Error("Multipart FormData must be sent through the dedicated face upload path.");
    }
    args.push(url.toString());
    const result = await runCurl(args, 30000);
    if (result.status === 401) throw new Error("Hikvision rejected the HTTP Digest credentials.");
    return result;
}

async function isSuccessfulHikvisionResponse(response: Response | CurlResponse): Promise<{ success: boolean; detail: string }> {
    const body = "text" in response && typeof response.text === "function" ? await response.text() : (response as CurlResponse).body;
    const statusOk = "ok" in response ? (response as Response).ok : ((response as CurlResponse).status >= 200 && (response as CurlResponse).status < 300);
    const statusCode = body.match(/<(?:\w+:)?statusCode\b[^>]*>\s*(\d+)\s*<\//i)?.[1]
        || body.match(/"statusCode"\s*:\s*"?(\d+)"?/i)?.[1];
    return {
        success: statusOk && (!statusCode || statusCode === "1"),
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
            if (response.status < 200 || response.status >= 300) throw new Error(`Hikvision device returned HTTP ${response.status}.`);
            const body = response.body;
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
        let uploadImage = photo;
        let uploadExtension = extension || ".jpg";
        if (extension === ".webp") {
            const sharp = (await import("sharp")).default;
            uploadImage = await sharp(photo).jpeg({ quality: 92 }).toBuffer();
            uploadExtension = ".jpg";
        }
        const contentType = uploadExtension === ".png" ? "image/png" : uploadExtension === ".jpg" || uploadExtension === ".jpeg" ? "image/jpeg" : "image/jpeg";
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

            const faceUrl = terminalUrl(terminal, "/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json");
            const username = terminal.hikvisionUsername!;
            const password = decryptPassword(terminal.hikvisionPasswordEncrypted!);
            const personJson = JSON.stringify({
                faceLibType: "blackFD",
                FDID: "1",
                FPID: student.employeeNo,
                name: student.name.trim().slice(0, 120)
            });
            const tempDir = path.join(process.cwd(), "tmp");
            await fs.mkdir(tempDir, { recursive: true });
            const personPath = path.join(tempDir, `hikvision-person-${Date.now()}.json`);
            const imagePath = path.join(tempDir, `hikvision-face-${Date.now()}${uploadExtension}`);
            await fs.writeFile(personPath, personJson, "utf8");
            await fs.writeFile(imagePath, uploadImage);
            try {
                const curlResult = await runCurl([
                    "--digest", "-u", `${username}:${password}`,
                    "-X", "POST",
                    "-F", `person=@${personPath};type=application/json`,
                    "-F", `image=@${imagePath};type=${contentType}`,
                    "--connect-timeout", "10",
                    "--max-time", "25",
                    faceUrl.toString()
                ], 30000);
                const faceResult = await isSuccessfulHikvisionResponse(curlResult);
                if (!faceResult.success) {
                    throw new Error(`Hikvision face enrollment failed (HTTP ${curlResult.status}): ${faceResult.detail || curlResult.body}`);
                }
            } finally {
                await fs.unlink(personPath).catch(() => { });
                await fs.unlink(imagePath).catch(() => { });
            }
        } finally {
            clearTimeout(timer);
        }
    }
}
