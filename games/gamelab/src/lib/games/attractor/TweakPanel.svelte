<script>
  export let handle;

  let open = false;

  const sliders = [
    { key: 'acceleration', label: 'Acceleration', min: 50, max: 3000, step: 50 },
    { key: 'maxSpeed', label: 'Max hastighet', min: 50, max: 5000, step: 50 },
    { key: 'drag', label: 'Luftmotstånd', min: 0, max: 1000, step: 10 },
    { key: 'bounce', label: 'Studs', min: 0, max: 2, step: 0.05 },
    { key: 'stopDistance', label: 'Stoppavstånd', min: 0, max: 200, step: 5 },
    { key: 'trailDuration', label: 'Spår-längd (ms)', min: 0, max: 120000, step: 1000 },
    { key: 'followLerp', label: 'Kamera-lerp', min: 0.01, max: 1, step: 0.01 },
    { key: 'deadzoneFrac', label: 'Deadzone', min: 0, max: 1, step: 0.05 },
  ];

  function onChange(key, value) {
    handle.updateParams({ [key]: parseFloat(value) });
  }

  function getValue(key) {
    return handle.getParams()?.[key] ?? 0;
  }
</script>

<div class="panel" class:open>
  <button class="toggle" on:click={() => (open = !open)}>
    {open ? '▲ Stäng tweaks' : '▼ Tweaks'}
  </button>
  {#if open}
    <div class="controls">
      {#each sliders as s}
        {@const val = getValue(s.key)}
        <label>
          <span>{s.label} <em>{val}</em></span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={val}
            on:input={(e) => onChange(s.key, e.target.value)}
          />
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  .panel {
    background: #11111b;
    border-top: 1px solid #313244;
    font: 13px system-ui, sans-serif;
    color: #cdd6f4;
  }
  .toggle {
    width: 100%;
    background: none;
    border: none;
    color: #9399b2;
    padding: 8px 16px;
    text-align: left;
    cursor: pointer;
    font: 13px system-ui, sans-serif;
  }
  .toggle:hover {
    color: #cdd6f4;
  }
  .controls {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px 24px;
    padding: 8px 16px 16px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  label span {
    display: flex;
    justify-content: space-between;
  }
  em {
    font-style: normal;
    color: #89b4fa;
  }
  input[type='range'] {
    width: 100%;
    accent-color: #89b4fa;
  }
</style>
