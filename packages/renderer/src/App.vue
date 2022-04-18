<script lang="ts" setup>
import './index.css';
import {computed, ref, watch} from 'vue';
import {Temporal} from '@js-temporal/polyfill';


function runShutdown() {
  window.commands.run('shutdown /f /s /t 0');
}

const SETTINGS = ref(window.store.getSettings());
watch(SETTINGS, newSettings => {
  const rawSettingsObj = Object.assign({}, newSettings);
  console.log(rawSettingsObj);
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
  const minutesAddedFromSkip = skipped.value ? SETTINGS.value.interval : 0;
  const minutesFromStartToNextShutdown = Math.ceil(m / SETTINGS.value.interval) * SETTINGS.value.interval + minutesAddedFromSkip;
  if (inShutdownZone(start.value.add({minutes: minutesFromStartToNextShutdown}))) {
    return minutesFromStartToNextShutdown - m;
  } else return Temporal.Now.plainTimeISO().until(start.value).add({minutes: minutesAddedFromSkip}).total({unit: 'minutes'});
}

let skipped = ref(false);

function shutdownTimer() {
  setTimeout(() => {
    if (inShutdownZone() && !skipped.value) runShutdown();
    else {
      shutdownTimer();
      skipped.value = false;
    }
  }, getMinutesToNextShutdown() * 60 * 1_000);
}

shutdownTimer();

const t = ref(0);
setInterval(() => t.value = getMinutesToNextShutdown(), 100);

</script>

<template>
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
