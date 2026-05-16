import { createReadStream, stat } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const DOZOR_BASE = "https://city.dozor.tech";
const DOZOR_SESSION_TTL_MS = 25 * 60 * 1000;
const DOZOR_CITIES_TTL_MS = 6 * 60 * 60 * 1000;

const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".zip": "application/zip",
    ".pb": "application/octet-stream",
    ".json": "application/json; charset=utf-8"
};

const dozorSessions = new Map();
let dozorCityIds = null;
let dozorCityIdsAt = 0;

function normalizeCityId(city){
    const id = String(city || "cherkasy").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if(!id){
        throw new Error("City id is required.");
    }
    return id;
}

function dozorCityPage(cityId){
    return `${DOZOR_BASE}/ua/${cityId}/city`;
}

async function loadDozorCityIds(){
    if(dozorCityIds && Date.now() - dozorCityIdsAt < DOZOR_CITIES_TTL_MS){
        return dozorCityIds;
    }

    const resp = await fetch(`${DOZOR_BASE}/cities`, {
        headers: {
            Accept: "application/json",
            "User-Agent": "GTFS-Departures/1.0"
        }
    });

    const text = await resp.text();
    if(!resp.ok){
        throw new Error(`Dozor /cities returned HTTP ${resp.status}`);
    }

    const cities = JSON.parse(text);
    if(!Array.isArray(cities)){
        throw new Error("Dozor /cities returned an unexpected payload.");
    }

    dozorCityIds = new Set(cities.map(city => normalizeCityId(city.id)));
    dozorCityIdsAt = Date.now();
    return dozorCityIds;
}

async function assertDozorCity(city){
    const cityId = normalizeCityId(city);
    const allowed = await loadDozorCityIds();

    if(!allowed.has(cityId)){
        throw new Error(`Unknown Dozor city "${cityId}".`);
    }

    return cityId;
}

async function getDozorSessionCookie(cityId){
    const cached = dozorSessions.get(cityId);
    if(cached && Date.now() - cached.at < DOZOR_SESSION_TTL_MS){
        return cached.cookie;
    }

    const resp = await fetch(dozorCityPage(cityId), {
        headers: { "User-Agent": "GTFS-Departures/1.0" }
    });

    if(!resp.ok){
        throw new Error(`Dozor session for ${cityId} failed with HTTP ${resp.status}`);
    }

    const setCookies = typeof resp.headers.getSetCookie === "function"
        ? resp.headers.getSetCookie()
        : [];

    const cookie = setCookies.map(part => part.split(";")[0]).filter(Boolean).join("; ");
    if(!cookie){
        throw new Error(`Dozor session cookie was not returned for ${cityId}.`);
    }

    dozorSessions.set(cityId, { cookie, at: Date.now() });
    return cookie;
}

async function fetchDozorBroker(cityId, path){
    const cookie = await getDozorSessionCookie(cityId);
    const resp = await fetch(`${DOZOR_BASE}${path}`, {
        headers: {
            Cookie: cookie,
            Referer: dozorCityPage(cityId),
            Accept: "application/json",
            "User-Agent": "GTFS-Departures/1.0"
        }
    });

    const text = await resp.text();
    if(!resp.ok){
        throw new Error(`Dozor broker ${path} returned HTTP ${resp.status}`);
    }

    return text;
}

async function fetchDozorPublic(path, allowNotFound = false){
    const resp = await fetch(`${DOZOR_BASE}${path}`, {
        headers: {
            Accept: "application/json",
            "User-Agent": "GTFS-Departures/1.0"
        }
    });

    if(allowNotFound && resp.status === 404){
        return "[]";
    }

    const text = await resp.text();
    if(!resp.ok){
        throw new Error(`Dozor ${path} returned HTTP ${resp.status}`);
    }

    return text;
}

function sendJson(res, statusCode, payload){
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
    });
    res.end(body);
}

function sendText(res, statusCode, text, contentType = "application/json; charset=utf-8"){
    res.writeHead(statusCode, {
        "Content-Type": contentType,
        "Cache-Control": "no-store"
    });
    res.end(text);
}

async function handleDozorApi(url, res){
    try{
        if(url.pathname === "/api/dozor/cities"){
            const text = await fetchDozorPublic("/cities");
            sendText(res, 200, text);
            return;
        }

        const cityId = await assertDozorCity(url.searchParams.get("city") || "cherkasy");

        if(url.pathname === "/api/dozor/routes"){
            const text = await fetchDozorBroker(cityId, "/data?t=1&h=0");
            sendText(res, 200, text);
            return;
        }

        if(url.pathname === "/api/dozor/devices"){
            const text = await fetchDozorPublic(`/${cityId}/devices.json`, true);
            sendText(res, 200, text);
            return;
        }

        if(url.pathname === "/api/dozor/live"){
            const routeIds = url.searchParams.get("p") || "";
            const text = await fetchDozorBroker(
                cityId,
                `/data?t=2&p=${encodeURIComponent(routeIds)}`
            );
            sendText(res, 200, text);
            return;
        }

        sendJson(res, 404, { error: "Unknown Dozor API path." });
    }
    catch(err){
        sendJson(res, 502, { error: err?.message || String(err) });
    }
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://${host}:${port}`);

    if(url.pathname.startsWith("/api/dozor/")){
        handleDozorApi(url, res);
        return;
    }

    const relativePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
    const filePath = resolve(root, relativePath);

    if(filePath !== root && !filePath.startsWith(root + sep)){
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    stat(filePath, (err, info) => {
        if(err || !info.isFile()){
            res.writeHead(404);
            res.end("Not found");
            return;
        }

        res.writeHead(200, {
            "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream",
            "Cache-Control": "no-store"
        });
        createReadStream(filePath).pipe(res);
    });
});

server.listen(port, host, () => {
    console.log(`GTFS departures app running at http://${host}:${port}/`);
});
