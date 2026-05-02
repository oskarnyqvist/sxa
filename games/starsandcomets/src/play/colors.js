// Random pleasant hex via HSL with bounded saturation/lightness.

function hslToHex(h, s, l) {
    const a = s * Math.min(l, 1 - l);
    const f = n => {
        const k = (n + h / 30) % 12;
        const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
        return Math.round(c * 255).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

export function randomBodyColor() {
    const h = Math.random() * 360;
    const s = 0.55 + Math.random() * 0.3;
    const l = 0.55 + Math.random() * 0.15;
    return hslToHex(h, s, l);
}
