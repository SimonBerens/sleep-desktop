<script lang="ts" setup>
import './index.css';
import {computed, ref, watch} from 'vue';
import {Temporal} from '@js-temporal/polyfill';

function sendMinimizeSignal() {
  window.ipcRenderer.send('minimize-clicked');
}

function runShutdown() {
  window.shutdown.electronShutdown({
    force: true,
    debug: import.meta.env.DEV,
    sudo: true,
  });
}

const SETTINGS = ref(window.store.getSettings());
watch(SETTINGS, newSettings => {
  const rawSettingsObj = Object.assign({}, newSettings);
  window.store.setSettings(rawSettingsObj);
}, {deep: true});


const start = computed(() => Temporal.PlainTime.from({
  hour: SETTINGS.value.startHour,
  minute: SETTINGS.value.startMinute,
}));
const end = computed(() => Temporal.PlainTime.from({
  hour: SETTINGS.value.endHour,
  minute: SETTINGS.value.endMinute,
}));

function inShutdownZone(plainTime ?: Temporal.PlainTime) {
  if (plainTime === undefined) plainTime = Temporal.Now.plainTimeISO();
  if (Temporal.PlainTime.compare(start.value, end.value) == -1) {
    return Temporal.PlainTime.compare(start.value, plainTime) <= 0 && Temporal.PlainTime.compare(plainTime, end.value) <= 0;
  } else {
    return Temporal.PlainTime.compare(start.value, plainTime) <= 0 || Temporal.PlainTime.compare(plainTime, end.value) <= 0;
  }
}


const midnight = Temporal.PlainTime.from({hour: 0});

function minutesSinceStart() {
  const now = Temporal.Now.plainTimeISO();
  let timePassedSinceStart = start.value.until(now).total({unit: 'minutes'});
  if (timePassedSinceStart < 0) {
    timePassedSinceStart = start.value.until(midnight).add(midnight.until(now)).total({unit: 'minutes'});
  }
  return timePassedSinceStart;
}

function getMinutesToNextShutdown() {
  const m = minutesSinceStart();
  const minutesFromStartToNextShutdown = Math.ceil(m / SETTINGS.value.interval) * SETTINGS.value.interval;
  if (inShutdownZone(start.value.add({minutes: minutesFromStartToNextShutdown}))) {
    return minutesFromStartToNextShutdown - m;
  } else return Temporal.Now.plainTimeISO().until(start.value).total({unit: 'minutes'});
}

function getMinutesToNextShutdownWithSkipped() {
  return getMinutesToNextShutdown() + (skipped.value ? SETTINGS.value.interval : 0);
}

let skipped = ref(false);

const t = ref(0);
setInterval(() => {
  const minutesWithSkipped = getMinutesToNextShutdownWithSkipped();
  t.value = minutesWithSkipped;

  if (getMinutesToNextShutdown() * 60 < 0.2) {
    setTimeout(() => skipped.value = false, 200);
  }
  if (minutesWithSkipped * 60 < 0.2) {
    runShutdown();
  }
}, 100);

</script>

<template>
  <button @click="sendMinimizeSignal">
    minimize
  </button>
  <br>
  <button @click="runShutdown">
    test shutdown
  </button>
  <br>

  {{ t }} minutes until shutdown
  <br>
  <button
    :disabled="skipped"
    @click="skipped=true"
  >
    Skip
  </button>

  <fieldset>
    <legend>Settings</legend>
    <label> Start Hour
      <input
        v-model.number="SETTINGS.startHour"
        type="number"
      >
    </label>
    <br>
    <label> Start Minute
      <input
        v-model.number="SETTINGS.startMinute"
        type="number"
      >
    </label>
    <br>
    <label> End Hour
      <input
        v-model.number="SETTINGS.endHour"
        type="number"
      >
    </label>
    <br>
    <label> End Minute
      <input
        v-model.number="SETTINGS.endMinute"
        type="number"
      >
    </label>
    <br>
    <label> Interval
      <input
        v-model.number="SETTINGS.interval"
        type="number"
      >
    </label>
  </fieldset>
</template>
