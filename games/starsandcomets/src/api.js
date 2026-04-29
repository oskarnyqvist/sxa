export const API_BASE = import.meta.env.DEV
    ? 'http://localhost:8000'
    : 'https://data.sxa.se';

const GAME_SLUG = 'starsandcomets';

function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
}

class ApiError extends Error {
    constructor(message, status, body) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
    const opts = {
        method,
        credentials: 'include',
        headers: { Accept: 'application/json', ...headers },
    };
    if (body !== undefined) {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
    }
    if (method !== 'GET' && method !== 'HEAD') {
        const csrf = getCookie('csrftoken');
        if (csrf) opts.headers['X-CSRFToken'] = csrf;
    }
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 204) return null;
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) throw new ApiError(`${method} ${path} → ${res.status}`, res.status, data);
    return data;
}

function safeJson(text) {
    try { return JSON.parse(text); } catch { return text; }
}

let primed = false;
export async function primeCsrf() {
    if (primed) return;
    primed = true;
    try { await apiFetch('/api/whoami/'); } catch { primed = false; }
}

export function loginUrl(next = location.href) {
    const path = import.meta.env.DEV
        ? '/admin/login/'
        : '/accounts/google/login/';
    return `${API_BASE}${path}?next=${encodeURIComponent(next)}`;
}

export async function whoami() {
    return apiFetch('/api/whoami/');
}

export async function listLevels() {
    return apiFetch(`/api/games/${GAME_SLUG}/levels/`);
}

export async function getLevel(id) {
    return apiFetch(`/api/games/${GAME_SLUG}/levels/${id}/`);
}

export async function createLevel({ title, description = '', data, schema_version = 1 }) {
    await primeCsrf();
    return apiFetch(`/api/games/${GAME_SLUG}/levels/`, {
        method: 'POST',
        body: { title, description, data, schema_version },
    });
}

export async function updateLevel(id, patch) {
    await primeCsrf();
    return apiFetch(`/api/games/${GAME_SLUG}/levels/${id}/`, {
        method: 'PUT',
        body: patch,
    });
}

export async function deleteLevel(id) {
    await primeCsrf();
    return apiFetch(`/api/games/${GAME_SLUG}/levels/${id}/`, { method: 'DELETE' });
}

export { ApiError };
