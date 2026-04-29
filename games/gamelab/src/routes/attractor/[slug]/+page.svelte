<script>
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import attractor from "$lib/games/attractor/index.js";
  import TweakPanel from "$lib/games/attractor/TweakPanel.svelte";

  let gameContainer;
  let handle;
  let shareLabel = "Dela";

  $: variant = attractor.getVariant($page.params.slug);

  onMount(async () => {
    if (variant) handle = await attractor.mount(gameContainer, variant);
  });

  onDestroy(() => handle?.destroy());

  async function share() {
    const s = handle?.serializeState();
    if (!s) return;
    const url = new URL(window.location.href);
    url.searchParams.set("s", s);
    await navigator.clipboard.writeText(url.toString());
    window.history.replaceState(null, "", url);
    shareLabel = "Kopierad!";
    setTimeout(() => (shareLabel = "Dela"), 1200);
  }
</script>

{#if variant}
  <header>
    <a href="/">← Lab</a>
    <span class="family">{attractor.label}</span>
    <span class="title">{variant.label}</span>
    <button on:click={share} class:copied={shareLabel === "Kopierad!"}
      >{shareLabel}</button
    >
  </header>
  <div bind:this={gameContainer} class="game"></div>
  {#if handle}
    <TweakPanel {handle} />
  {/if}
{:else}
  <main class="missing">
    <p>Variant saknas: <code>{$page.params.slug}</code></p>
    <p><a href="/">← tillbaka</a></p>
  </main>
{/if}

<style>
  header {
    flex: 0 0 auto;
    padding: 12px 24px;
    background: #11111b;
    border-bottom: 1px solid #313244;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .family {
    color: #9399b2;
    font-size: 14px;
  }
  .title {
    flex: 1;
    font-weight: 600;
  }
  button {
    background: #313244;
    color: #cdd6f4;
    border: 1px solid #45475a;
    border-radius: 6px;
    padding: 6px 14px;
    font:
      500 14px system-ui,
      sans-serif;
    cursor: pointer;
  }
  button:hover {
    background: #45475a;
  }
  button.copied {
    background: #4ade80;
    color: #11111b;
    border-color: #4ade80;
  }
  .game {
    flex: 1 1 auto;
    min-height: 0;
  }
  :global(.game canvas) {
    display: block;
  }
  .missing {
    padding: 40px;
  }
</style>
