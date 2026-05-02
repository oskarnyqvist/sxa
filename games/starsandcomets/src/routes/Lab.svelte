<script>
    const presets = [
        {
            name: 'Editorial mys',
            note: 'Mjuk serif-rubrik, varm sans, retro-mono. Bonsai-känsla.',
            display: '"Instrument Serif", serif',
            displayWeight: 400,
            displayItalic: false,
            body: '"Space Grotesk", sans-serif',
            mono: '"Space Mono", monospace',
        },
        {
            name: 'Bonsai brutal',
            note: 'Skarp, nästan editorial. Bra för tydlig hierarki.',
            display: '"Syne", sans-serif',
            displayWeight: 800,
            body: '"DM Sans", sans-serif',
            mono: '"IBM Plex Mono", monospace',
        },
        {
            name: 'Gammal NASA',
            note: 'Soft serif + 80-tals terminalsiffror. Varm + nördig.',
            display: '"Fraunces", serif',
            displayWeight: 700,
            body: '"Figtree", sans-serif',
            mono: '"VT323", monospace',
            monoScale: 1.2,
        },
        {
            name: 'Kosmiskt zine',
            note: 'En enda variabel — Bricolage gör allt. Konstig, levande.',
            display: '"Bricolage Grotesque", sans-serif',
            displayWeight: 800,
            body: '"Bricolage Grotesque", sans-serif',
            mono: '"Space Mono", monospace',
        },
        {
            name: 'Tung trädgård',
            note: 'Industriell, brutalistisk display. Hård + mjukt innehåll.',
            display: '"Big Shoulders Display", sans-serif',
            displayWeight: 900,
            body: '"DM Sans", sans-serif',
            mono: '"JetBrains Mono", monospace',
        },
        {
            name: 'Cockpit',
            note: 'Geometrisk sci-fi. Tron-vibes utan att bli kitsch.',
            display: '"Tektur", sans-serif',
            displayWeight: 800,
            body: '"Space Grotesk", sans-serif',
            mono: '"Major Mono Display", monospace',
            monoScale: 0.85,
        },
        {
            name: 'Konstig fin',
            note: 'Caprasimo är nästan tecknad — ren bonsai-charm.',
            display: '"Caprasimo", serif',
            displayWeight: 400,
            body: '"Figtree", sans-serif',
            mono: '"Space Mono", monospace',
        },
        {
            name: 'Svensk',
            note: 'Familjen Grotesk allover — diskret nationalstolthet.',
            display: '"Familjen Grotesk", sans-serif',
            displayWeight: 700,
            body: '"Familjen Grotesk", sans-serif',
            mono: '"IBM Plex Mono", monospace',
        },
    ];

    const palette = [
        { role: 'graphite',      var: '--c-graphite',     hex: '#242828', text: 'light' },
        { role: 'mermaid',       var: '--c-mermaid',      hex: '#0B467B', text: 'light' },
        { role: 'mediterranean', var: '--c-mediterranean', hex: '#3983B1', text: 'light' },
        { role: 'eucalyptus',    var: '--c-eucalyptus',   hex: '#329960', text: 'light' },
        { role: 'camel',         var: '--c-camel',        hex: '#CEA158', text: 'dark'  },
        { role: 'velvet',        var: '--c-velvet',       hex: '#B51B8B', text: 'light' },
        { role: 'kofte',         var: '--c-kofte',        hex: '#723740', text: 'light' },
        { role: 'albescent',     var: '--c-albescent',    hex: '#E1DACA', text: 'dark'  },
    ];

    let active = 0;
    let brutalism = false;

    $: preset = presets[active];
    $: monoScale = preset.monoScale ?? 1;
    $: cssVars = `
        --font-display: ${preset.display};
        --font-body: ${preset.body};
        --font-mono: ${preset.mono};
        --display-weight: ${preset.displayWeight};
        --mono-scale: ${monoScale};
    `;
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
    <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@400;700;900&family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Caprasimo&family=DM+Sans:wght@400;500;700&family=Familjen+Grotesk:wght@400;500;700&family=Figtree:wght@400;500;700&family=Fraunces:wght@400..900&family=IBM+Plex+Mono:wght@400;500;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;700&family=Major+Mono+Display&family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&family=Syne:wght@400..800&family=Tektur:wght@400;700;900&family=VT323&display=swap"
    >
</svelte:head>

<div class="lab" class:brutal={brutalism} style={cssVars}>
    <header>
        <div class="eyebrow">TYPLABB · 01</div>
        <h1 class="display">Hur ska den kännas?</h1>
        <p class="body">Klicka en preset för att byta rubrik-, text- och mono-typsnitt. Mock-komponenterna nedanför uppdateras live.</p>
    </header>

    <div class="controls">
        <div class="presets">
            {#each presets as p, i}
                <button class:active={active === i} on:click={() => active = i}>
                    <span class="num">{String(i + 1).padStart(2, '0')}</span>
                    <span class="pname">{p.name}</span>
                </button>
            {/each}
        </div>
        <label class="toggle">
            <input type="checkbox" bind:checked={brutalism}>
            <span>Hård brutalism (tjocka kanter, hårda skuggor)</span>
        </label>
        <p class="note">{preset.note}</p>
    </div>

    <section>
        <div class="eyebrow">PALETT</div>
        <div class="swatches">
            {#each palette as c}
                <div class="swatch" class:dark={c.text === 'dark'} style="background: {c.hex}">
                    <span class="role">{c.role}</span>
                    <span class="hex">{c.hex}</span>
                </div>
            {/each}
        </div>
    </section>

    <section>
        <div class="eyebrow">TYPSNITT · SPECIMEN</div>
        <div class="specimen">
            <p class="spec-eyebrow">VÄRLD · 04 · STJÄRNHIMLEN</p>
            <h2 class="display xl">Skapa ditt mysiga universum</h2>
            <p class="lede">En liten gravitations­akvarium där stjärnor och kometer dansar i tystnad. Klicka för att lägga till en ny kropp.</p>
            <p class="body">Bygg din värld från en handfull byggstenar. Stjärnor lyser. Kometer drar svansar. Allt påverkar varandra och systemet finner sin egen rytm — eller kollapsar i en het knut. Det är upp till dig.</p>
            <div class="stat-row">
                <span class="stat">★ 4.2 AU</span>
                <span class="stat">1.3 M⊙</span>
                <span class="stat">T+00:42:18</span>
                <span class="stat">3 KROPPAR</span>
            </div>
        </div>
    </section>

    <section>
        <div class="eyebrow">TYPSKALA</div>
        <div class="scale">
            <div class="display" style="font-size: 56px; line-height: 1.05;">Stars &amp; Comets</div>
            <div class="display" style="font-size: 36px; line-height: 1.1;">Mysig kosmos</div>
            <div class="display" style="font-size: 24px; line-height: 1.2;">Mindre rubrik</div>
            <div class="body" style="font-size: 16px;">Brödtext 16px — den här raden är din standard läs-storlek.</div>
            <div class="body" style="font-size: 14px;">Brödtext 14px — kompaktare, för listor och kort.</div>
            <div class="body" style="font-size: 12px; color: var(--text-dim);">Hjälptext 12px — sekundärt innehåll.</div>
            <div class="mono" style="font-size: 11px; letter-spacing: 0.12em;">EYEBROW · MONO 11PX</div>
        </div>
    </section>

    <section>
        <div class="eyebrow">KOMPONENTER</div>

        <article class="world-card">
            <div class="card-eyebrow mono">VÄRLD · 04</div>
            <h3 class="display card-title">Tysta kometernas träd</h3>
            <p class="body card-desc">Tre stjärnor kretsar lugnt runt en liten komet som lämnar en blek svans bakom sig.</p>
            <div class="card-stats">
                <span class="mono">3 KROPPAR</span>
                <span class="mono">4.2 AU</span>
                <span class="mono">UPPDATERAD 2D</span>
            </div>
        </article>

        <div class="buttons">
            <button class="btn primary">Skapa en ny värld</button>
            <button class="btn ghost">Logga in</button>
        </div>

        <div class="stats-block">
            <div class="stat-cell">
                <div class="mono key">MASSA</div>
                <div class="display val">1.34</div>
                <div class="mono unit">M⊙</div>
            </div>
            <div class="stat-cell">
                <div class="mono key">DISTANS</div>
                <div class="display val">4.2</div>
                <div class="mono unit">AU</div>
            </div>
            <div class="stat-cell">
                <div class="mono key">PERIOD</div>
                <div class="display val">87.3</div>
                <div class="mono unit">D</div>
            </div>
        </div>
    </section>
</div>

<style>
    .lab {
        padding: 32px 16px 96px;
        max-width: 760px;
        margin: 0 auto;
        font-family: var(--font-body);
        line-height: 1.5;
    }

    .display {
        font-family: var(--font-display);
        font-weight: var(--display-weight);
        line-height: 1.1;
        letter-spacing: -0.01em;
    }
    .body { font-family: var(--font-body); }
    .mono {
        font-family: var(--font-mono);
        font-size: calc(1em * var(--mono-scale));
    }

    .eyebrow {
        font-family: var(--font-mono);
        font-size: calc(11px * var(--mono-scale));
        letter-spacing: 0.14em;
        color: var(--text-dim);
        margin-bottom: 12px;
    }

    header { margin-bottom: 32px; }
    header .display {
        font-size: 44px;
        margin: 8px 0 12px;
        color: var(--text);
    }
    header .body { color: var(--text-dim); max-width: 56ch; }

    /* Controls */
    .controls {
        margin: 0 0 40px;
        padding: 16px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 8px;
    }
    .lab.brutal .controls {
        border-radius: 0;
        border-width: 2px;
        border-color: var(--c-albescent);
        box-shadow: 6px 6px 0 var(--c-kofte);
    }
    .presets {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 8px;
        margin-bottom: 12px;
    }
    .presets button {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
        padding: 10px 12px;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 6px;
        color: var(--text);
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s, background 0.15s;
    }
    .presets button:hover { border-color: var(--cta); }
    .presets button.active {
        background: var(--cta);
        color: var(--cta-text);
        border-color: var(--cta);
    }
    .lab.brutal .presets button { border-radius: 0; }
    .lab.brutal .presets button.active { box-shadow: 3px 3px 0 var(--c-kofte); }
    .presets .num {
        font-family: var(--font-mono);
        font-size: 10px;
        letter-spacing: 0.1em;
        opacity: 0.7;
    }
    .presets .pname { font-weight: 500; font-size: 14px; }
    .toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--text-dim);
        cursor: pointer;
    }
    .note {
        margin-top: 10px;
        font-size: 13px;
        color: var(--text-dim);
        font-style: italic;
    }

    section { margin-bottom: 48px; }

    /* Palette */
    .swatches {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 8px;
    }
    .swatch {
        aspect-ratio: 1.4;
        padding: 10px 12px;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        color: var(--c-albescent);
    }
    .swatch.dark { color: var(--c-graphite); }
    .swatch .role {
        font-family: var(--font-body);
        font-size: 13px;
        font-weight: 600;
    }
    .swatch .hex {
        font-family: var(--font-mono);
        font-size: 11px;
        opacity: 0.85;
    }
    .lab.brutal .swatch {
        border-radius: 0;
        border: 2px solid var(--c-graphite);
        box-shadow: 4px 4px 0 var(--c-kofte);
    }

    /* Specimen */
    .specimen {
        padding: 24px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 8px;
    }
    .spec-eyebrow {
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.14em;
        color: var(--c-camel);
        margin-bottom: 12px;
    }
    .specimen .xl {
        font-size: clamp(36px, 6vw, 56px);
        margin-bottom: 16px;
        color: var(--text);
    }
    .specimen .lede {
        font-size: 18px;
        color: var(--text);
        margin-bottom: 12px;
        max-width: 48ch;
    }
    .specimen .body {
        color: var(--text-dim);
        max-width: 56ch;
        margin-bottom: 20px;
    }
    .stat-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
    }
    .stat-row .stat {
        font-family: var(--font-mono);
        font-size: calc(12px * var(--mono-scale));
        color: var(--c-camel);
        letter-spacing: 0.06em;
    }
    .lab.brutal .specimen {
        border-radius: 0;
        border-width: 2px;
        border-color: var(--c-albescent);
        box-shadow: 6px 6px 0 var(--c-mermaid);
    }

    /* Scale */
    .scale {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 20px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 8px;
    }
    .scale > * { color: var(--text); }
    .lab.brutal .scale {
        border-radius: 0;
        border-width: 2px;
        border-color: var(--c-camel);
    }

    /* World card */
    .world-card {
        padding: 20px;
        background: var(--surface-soft);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 16px;
    }
    .card-eyebrow {
        font-size: 11px;
        letter-spacing: 0.14em;
        color: var(--c-camel);
        margin-bottom: 8px;
    }
    .card-title {
        font-size: 24px;
        color: var(--text);
        margin-bottom: 6px;
    }
    .card-desc {
        color: var(--text-dim);
        font-size: 14px;
        margin-bottom: 16px;
    }
    .card-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 16px;
    }
    .card-stats .mono {
        font-size: calc(11px * var(--mono-scale));
        letter-spacing: 0.1em;
        color: var(--text-faint);
    }
    .lab.brutal .world-card {
        border-radius: 0;
        border-width: 2px;
        border-color: var(--c-albescent);
        box-shadow: 6px 6px 0 var(--c-velvet);
    }

    /* Buttons */
    .buttons {
        display: flex;
        gap: 12px;
        margin-bottom: 24px;
        flex-wrap: wrap;
    }
    .btn {
        padding: 12px 20px;
        border-radius: 8px;
        font-family: var(--font-body);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform 0.1s;
    }
    .btn.primary { background: var(--cta); color: var(--cta-text); }
    .btn.ghost {
        background: transparent;
        color: var(--cta);
        border-color: var(--cta);
    }
    .btn:active { transform: translate(1px, 1px); }
    .lab.brutal .btn {
        border-radius: 0;
        border: 2px solid var(--c-graphite);
    }
    .lab.brutal .btn.primary { box-shadow: 4px 4px 0 var(--c-kofte); }
    .lab.brutal .btn.ghost {
        border-color: var(--cta);
        box-shadow: 4px 4px 0 var(--c-mermaid);
    }
    .lab.brutal .btn:active { box-shadow: 1px 1px 0 var(--c-kofte); }

    /* Stat cells */
    .stats-block {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
    }
    .stat-cell {
        padding: 16px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 8px;
        text-align: center;
    }
    .stat-cell .key {
        font-size: 10px;
        letter-spacing: 0.16em;
        color: var(--text-faint);
        margin-bottom: 8px;
    }
    .stat-cell .val {
        font-size: 32px;
        color: var(--c-camel);
        font-weight: var(--display-weight);
    }
    .stat-cell .unit {
        font-size: calc(11px * var(--mono-scale));
        color: var(--text-dim);
        letter-spacing: 0.1em;
        margin-top: 4px;
    }
    .lab.brutal .stat-cell {
        border-radius: 0;
        border-width: 2px;
        border-color: var(--c-albescent);
        box-shadow: 4px 4px 0 var(--c-eucalyptus);
    }

    @media (max-width: 540px) {
        header .display { font-size: 32px; }
        .stats-block { grid-template-columns: 1fr; }
    }
</style>
