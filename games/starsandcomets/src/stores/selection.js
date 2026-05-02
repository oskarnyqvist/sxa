// Always-notifying store. Svelte's writable skips set() when the new value
// is === the old, but a Body's fields can mutate in place (handle drag,
// slider edit) without the reference changing. Subscribers need to know.
function notifying(initial) {
    let value = initial;
    const subs = new Set();
    return {
        subscribe(fn) {
            subs.add(fn);
            fn(value);
            return () => subs.delete(fn);
        },
        set(v) {
            value = v;
            for (const f of subs) f(v);
        },
        update(fn) { this.set(fn(value)); },
        get() { return value; },
    };
}

// The body the user is currently focused on. Visual marker only — the body
// keeps simulating. Set from canvas tap (lab) or panel card click.
export const selected = notifying(null);

// The body that is currently lifted out of the simulation for editing.
// In edit mode this typically tracks `selected`. Set to null in view mode.
// While lifted, simulator skips the body (no force, no movement).
export const lifted = notifying(null);

// Mirror of sim.bodies. Lab pokes this on add/remove so list UIs re-render.
// Same array reference — relies on always-notify behavior.
export const bodies = notifying([]);
