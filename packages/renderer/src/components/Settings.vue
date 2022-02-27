<script setup lang="ts">
import {ref, watch} from 'vue';

const SETTINGS = ref(window.store.getSettings());
watch(SETTINGS, newSettings => {
  const rawSettingsObj = Object.assign({}, newSettings);
  window.store.setSettings(rawSettingsObj);
}, {deep: true});

</script>

<template>
  <fieldset>
    <legend>Settings</legend>

    <input v-model="SETTINGS.startHour">
  </fieldset>
</template>
