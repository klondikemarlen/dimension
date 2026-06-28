<script setup lang="ts">
import SpellCanvas from "@/components/SpellCanvas.vue"
import { usersControllerIndexDiagram } from "@/fixtures/usersControllerIndex"
</script>

<template>
  <main class="workspace">
    <section class="hero-panel" aria-labelledby="dimension-title">
      <p class="eyebrow">Pen-first visual programming</p>
      <h1 id="dimension-title">Draw spells, not code.</h1>
      <p class="hero-copy">
        Dimension turns controller logic into glyphs, scoped rings, and data-flow leylines. This first
        screen keeps the stack boring: Vue for the shell, D3 for SVG geometry, and TypeScript data for
        the visual grammar.
      </p>
      <dl class="framework-grid" aria-label="Selected frameworks">
        <div>
          <dt>Interface</dt>
          <dd>Vue 3 + Vite</dd>
        </div>
        <div>
          <dt>Visualization</dt>
          <dd>D3-driven SVG</dd>
        </div>
        <div>
          <dt>Source import</dt>
          <dd>Express + ts-morph</dd>
        </div>
      </dl>
    </section>

    <SpellCanvas :diagram="usersControllerIndexDiagram" />
  </main>
</template>
