import { isIP } from "net";

const MAX_HOSTNAME_LENGTH = 253;
const MAX_LABEL_LENGTH = 63;
const LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * Une adresse de terminal accepte une IP (v4/v6) ou un nom DNS complet.
 * Le hostname permet de joindre une pointeuse derriere un tunnel inverse
 * (Cloudflare Tunnel, VPN + DNS interne) sans exposer son IP publique.
 */
export function classifyHikvisionTerminalAddress(value: string): "ip" | "hostname" | null {
    const address = value.trim();
    if (!address) return null;
    if (isIP(address) !== 0) return "ip";
    if (address.length > MAX_HOSTNAME_LENGTH) return null;
    // Un FQDN comporte au moins un point : cela exclut localhost et les noms
    // courts qui dependraient du suffixe DNS du conteneur backend.
    const labels = address.split(".");
    if (labels.length < 2) return null;
    if (labels.some(label => !label || label.length > MAX_LABEL_LENGTH || !LABEL_PATTERN.test(label))) return null;
    // Refuse une IPv4 incomplete (192.168.1) qui passerait pour un hostname.
    if (/^\d+$/.test(labels[labels.length - 1])) return null;
    return "hostname";
}

export function allowedHikvisionTunnelHosts(): string[] {
    return (process.env.HIKVISION_TUNNEL_HOSTS || "")
        .split(",")
        .map(host => host.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * HIKVISION_TUNNEL_HOSTS est optionnel : quand il est renseigne, seuls les
 * hostnames listes (ou leurs sous-domaines) sont acceptes. Les IP restent
 * autorisees pour les terminaux du LAN.
 */
export function isHikvisionTerminalAddressAllowed(value: string): boolean {
    const kind = classifyHikvisionTerminalAddress(value);
    if (!kind) return false;
    if (kind === "ip") return true;
    const allowlist = allowedHikvisionTunnelHosts();
    if (allowlist.length === 0) return true;
    const host = value.trim().toLowerCase();
    return allowlist.some(entry => {
        const suffix = entry.replace(/^\./, "");
        return Boolean(suffix) && (host === suffix || host.endsWith(`.${suffix}`));
    });
}
