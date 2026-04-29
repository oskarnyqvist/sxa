<script>
    import { families } from '$lib/games/index.js';
</script>

<main>
    <h1>Game Lab</h1>
    {#each families as fam}
        <section>
            <h2>{fam.label}</h2>
            {#if fam.description}<p class="fam-desc">{fam.description}</p>{/if}
            <ul>
                {#each fam.variants as v}
                    <li>
                        <a href="{fam.route}/{v.slug}">{v.label}</a>
                        {#if v.description}<span class="desc">— {v.description}</span>{/if}
                    </li>
                {/each}
            </ul>
        </section>
    {/each}
</main>

<style>
    main { padding: 40px; max-width: 700px; margin: 0 auto; }
    h1 { margin: 0 0 24px; }
    section { margin-bottom: 32px; }
    h2 { margin: 0 0 6px; font-size: 20px; }
    .fam-desc { margin: 0 0 10px; color: #9399b2; font-size: 15px; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: 8px 0; font-size: 17px; }
    .desc { color: #9399b2; font-size: 14px; }
</style>
