<script lang="ts" setup>
function sendMinimizeSignal() {
  window.ipcRenderer.send('minimize-clicked');
}
</script>

<template>
  <button
    class="absolute right-0 h-7 w-7"
    @click="sendMinimizeSignal"
  >
    <img
      src="./../minimize.svg"
      class="h-full w-full"
    >
  </button>
</template>
