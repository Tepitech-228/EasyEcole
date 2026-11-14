#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { monitorEventLoopDelay, performance } = require("perf_hooks");
const { io } = require("socket.io-client");

const MAX_CONNECTIONS = 2000;
const DEFAULT_CONNECTIONS = 100;
const DEFAULT_HOLD_SECONDS = 60;
const DEFAULT_CONNECT_TIMEOUT_MS = 15000;

function usage() {
  console.log(`
Test de connexions Socket.IO EasyEcole (local ou préproduction uniquement).

Variables requises :
  LOAD_TEST_BASE_URL       Origine du backend, ex. http://localhost:3000
  LOAD_TEST_TOKEN          JWT d'un compte de test
  ou LOAD_TEST_TOKENS_FILE Fichier texte avec un JWT de test par ligne

Variables facultatives :
  LOAD_TEST_CONNECTIONS    Connexions simultanées visées (défaut 100, maximum 2000)
  LOAD_TEST_RAMP_SECONDS   Durée de montée en charge (défaut : au moins 30 s)
  LOAD_TEST_HOLD_SECONDS   Durée de maintien après la montée (défaut 60 s)
  LOAD_TEST_HTTP_PATH      Route GET authentifiée facultative, commençant par /api/v1/
  LOAD_TEST_HTTP_INTERVAL_MS
                           Fréquence GET par client (défaut 30000, minimum 10000; 0 désactive)

Protections :
  Une cible autre que localhost nécessite LOAD_TEST_ALLOW_REMOTE=true et
  LOAD_TEST_ACKNOWLEDGE_STAGING=true. Au-delà de 100 connexions, ajoutez
  LOAD_TEST_ACKNOWLEDGE_HIGH_LOAD=true. Au-delà de 1000, ajoutez
  LOAD_TEST_ACKNOWLEDGE_THOUSANDS=true. Le script refuse plus de 2000 connexions.
  Ne jamais lancer sur la production ni sans autorisation explicite.

Exemple PowerShell (préproduction autorisée) :
  $env:LOAD_TEST_BASE_URL = "https://staging.example.test"
  $env:LOAD_TEST_TOKEN = "<JWT d'un compte de test>"
  $env:LOAD_TEST_ALLOW_REMOTE = "true"
  $env:LOAD_TEST_ACKNOWLEDGE_STAGING = "true"
  $env:LOAD_TEST_CONNECTIONS = "500"
  $env:LOAD_TEST_ACKNOWLEDGE_HIGH_LOAD = "true"
  npm run test:load:connections
`);
}

function readPositiveInteger(name, fallback, maximum) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} doit être un entier entre 1 et ${maximum}.`);
  }
  return value;
}

function isLoopback(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host === "::1" || host.startsWith("127.");
}

function loadTokens() {
  if (process.env.LOAD_TEST_TOKEN?.trim()) return [process.env.LOAD_TEST_TOKEN.trim()];

  const file = process.env.LOAD_TEST_TOKENS_FILE?.trim();
  if (!file) throw new Error("Définissez LOAD_TEST_TOKEN ou LOAD_TEST_TOKENS_FILE.");

  const tokens = fs.readFileSync(file, "utf8").split(/\r?\n/).map(value => value.trim()).filter(Boolean);
  if (tokens.length === 0) throw new Error("Le fichier de tokens est vide.");
  return tokens;
}

function percentile(samples, ratio) {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  return Math.round(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))]);
}

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    usage();
    return;
  }

  const rawBaseUrl = process.env.LOAD_TEST_BASE_URL;
  if (!rawBaseUrl) throw new Error("Définissez LOAD_TEST_BASE_URL. Le script ne choisit jamais une cible par défaut.");

  const baseUrl = new URL(rawBaseUrl);
  if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("LOAD_TEST_BASE_URL doit utiliser HTTP ou HTTPS.");
  if (baseUrl.pathname !== "/" || baseUrl.search || baseUrl.hash) {
    throw new Error("LOAD_TEST_BASE_URL doit contenir uniquement l'origine (sans chemin, paramètres ni fragment).");
  }
  if (!isLoopback(baseUrl.hostname) &&
      (process.env.LOAD_TEST_ALLOW_REMOTE !== "true" || process.env.LOAD_TEST_ACKNOWLEDGE_STAGING !== "true")) {
    throw new Error("Cible distante refusée. Réservez ce test à une préproduction autorisée et définissez les deux variables d'autorisation.");
  }

  const connections = readPositiveInteger("LOAD_TEST_CONNECTIONS", DEFAULT_CONNECTIONS, MAX_CONNECTIONS);
  const holdSeconds = readPositiveInteger("LOAD_TEST_HOLD_SECONDS", DEFAULT_HOLD_SECONDS, 3600);
  const connectTimeoutMs = readPositiveInteger("LOAD_TEST_CONNECT_TIMEOUT_MS", DEFAULT_CONNECT_TIMEOUT_MS, 120000);
  const rampSeconds = readPositiveInteger(
    "LOAD_TEST_RAMP_SECONDS",
    Math.max(30, Math.ceil(connections / 5)),
    3600
  );
  if (connections > DEFAULT_CONNECTIONS && process.env.LOAD_TEST_ACKNOWLEDGE_HIGH_LOAD !== "true") {
    throw new Error("Plus de 100 connexions exige LOAD_TEST_ACKNOWLEDGE_HIGH_LOAD=true.");
  }
  if (connections > 1000 && process.env.LOAD_TEST_ACKNOWLEDGE_THOUSANDS !== "true") {
    throw new Error("Plus de 1000 connexions exige LOAD_TEST_ACKNOWLEDGE_THOUSANDS=true.");
  }

  const httpPath = process.env.LOAD_TEST_HTTP_PATH?.trim();
  const httpIntervalRaw = process.env.LOAD_TEST_HTTP_INTERVAL_MS ?? "30000";
  const httpIntervalMs = Number(httpIntervalRaw);
  if (!Number.isSafeInteger(httpIntervalMs) || httpIntervalMs < 0 || (httpIntervalMs > 0 && httpIntervalMs < 10000)) {
    throw new Error("LOAD_TEST_HTTP_INTERVAL_MS doit valoir 0 (désactivé) ou au moins 10000.");
  }
  let httpUrl = null;
  if (httpPath) {
    if (!httpPath.startsWith("/api/v1/") || httpPath.startsWith("//")) {
      throw new Error("LOAD_TEST_HTTP_PATH doit être une route GET interne commençant par /api/v1/.");
    }
    httpUrl = new URL(httpPath, baseUrl);
    if (httpUrl.origin !== baseUrl.origin) throw new Error("La route HTTP doit rester sur l'origine de LOAD_TEST_BASE_URL.");
  }

  const tokens = loadTokens();
  const sockets = [];
  const latenciesMs = [];
  let connected = 0;
  let failed = 0;
  let prematureDisconnects = 0;
  let active = 0;
  let maximumActive = 0;
  let httpRequests = 0;
  let httpFailures = 0;
  let stopping = false;

  const eventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
  eventLoopDelay.enable();
  const cpuStart = process.cpuUsage();
  const eluStart = performance.eventLoopUtilization();

  console.log(`Cible : ${baseUrl.origin}`);
  console.log(`Objectif : ${connections} connexions Socket.IO; montée ${rampSeconds}s; maintien ${holdSeconds}s.`);
  console.log(`Tokens de test chargés : ${tokens.length} (valeurs masquées).`);
  console.log(`Parcours HTTP : ${httpUrl ? `GET ${httpUrl.pathname} toutes les ${httpIntervalMs} ms/client` : "désactivé"}.`);
  console.warn("Chargez uniquement une préproduction autorisée. Arrêt automatique après le maintien.");

  function scheduleHttp(socket, token) {
    if (!httpUrl || httpIntervalMs === 0 || stopping) return;
    const jitter = Math.floor(Math.random() * Math.min(httpIntervalMs / 4, 5000));
    const timer = setTimeout(() => {
      if (stopping || !socket.connected) return;
      httpRequests += 1;
      const request = require(httpUrl.protocol === "https:" ? "https" : "http").get(httpUrl, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        timeout: 10000
      }, response => {
        if (response.statusCode < 200 || response.statusCode >= 400) httpFailures += 1;
        response.resume();
        response.on("end", () => scheduleHttp(socket, token));
      });
      request.on("timeout", () => request.destroy(new Error("Délai HTTP dépassé")));
      request.on("error", () => {
        httpFailures += 1;
        scheduleHttp(socket, token);
      });
    }, httpIntervalMs + jitter);
    timer.unref();
    socket.once("disconnect", () => clearTimeout(timer));
  }

  for (let index = 0; index < connections; index += 1) {
    const token = tokens[index % tokens.length];
    const socketStart = Date.now();
    const socket = io(baseUrl.origin, {
      auth: { token },
      timeout: connectTimeoutMs,
      reconnection: false
    });
    sockets.push(socket);
    let wasConnected = false;
    let failureCounted = false;
    const countFailure = () => {
      if (failureCounted) return;
      failureCounted = true;
      failed += 1;
    };

    socket.once("connect", () => {
      wasConnected = true;
      connected += 1;
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      latenciesMs.push(Date.now() - socketStart);
      scheduleHttp(socket, token);
    });
    socket.once("connect_error", countFailure);
    socket.on("disconnect", reason => {
      if (wasConnected) {
        active = Math.max(0, active - 1);
        if (!stopping) prematureDisconnects += 1;
      }
      if (!wasConnected && reason !== "io client disconnect") countFailure();
    });

    const nextDelay = (rampSeconds * 1000) / connections;
    if (nextDelay > 0) await delay(nextDelay);
  }

  const reportTimer = setInterval(() => {
    console.log(`Progression : ${active}/${connections} connexions actives; ${failed} échec(s); ${prematureDisconnects} déconnexion(s) prématurée(s).`);
  }, 10000);

  await delay(holdSeconds * 1000);
  stopping = true;
  clearInterval(reportTimer);
  for (const socket of sockets) socket.disconnect();
  await delay(250);

  eventLoopDelay.disable();
  const cpu = process.cpuUsage(cpuStart);
  const elu = performance.eventLoopUtilization(eluStart);
  const successRate = connections === 0 ? 0 : connected / connections;
  const summary = {
    target: baseUrl.origin,
    requestedConnections: connections,
    successfulConnections: connected,
    failedConnections: failed,
    maximumSimultaneousConnections: maximumActive,
    prematureDisconnects,
    connectionLatencyMs: {
      p50: percentile(latenciesMs, 0.5),
      p95: percentile(latenciesMs, 0.95)
    },
    http: httpUrl ? { requests: httpRequests, failures: httpFailures } : "disabled",
    runtime: {
      holdSeconds,
      eventLoopUtilization: Number(elu.utilization.toFixed(3)),
      eventLoopDelayP95Ms: Number((eventLoopDelay.percentile(95) / 1e6).toFixed(2)),
      heapUsedMb: Number((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
      cpuUserMs: Math.round(cpu.user / 1000),
      cpuSystemMs: Math.round(cpu.system / 1000)
    }
  };
  console.log("\nRésumé du test :");
  console.log(JSON.stringify(summary, null, 2));

  const minimumSuccessRate = Number(process.env.LOAD_TEST_MIN_SUCCESS_RATE ?? "0.99");
  if (!Number.isFinite(minimumSuccessRate) || minimumSuccessRate <= 0 || minimumSuccessRate > 1) {
    throw new Error("LOAD_TEST_MIN_SUCCESS_RATE doit être un nombre supérieur à 0 et inférieur ou égal à 1.");
  }
  if (successRate < minimumSuccessRate || prematureDisconnects > 0 || httpFailures > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(`Test de charge non exécuté : ${error.message}`);
  process.exitCode = 1;
});
