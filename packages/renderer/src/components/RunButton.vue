<script setup>

function runShutdown() {
  window.commands.run('shutdown /f /s /t 0');
}

</script>

<template>
  <button @click="runShutdown">
    Run Me
  </button>
</template>
