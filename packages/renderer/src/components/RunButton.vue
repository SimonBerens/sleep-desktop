<script setup>

function runShutdown() {
  window.commands.run('shutdown /f /s /t 0');
}

</script>

<template>
  <button
    class="underline"
    @click="runShutdown"
  >
    Run Me
  </button>
</template>
