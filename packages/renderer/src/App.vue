<script lang="ts" setup>
import './index.css';
import {computed, ref, watch} from 'vue';
import {Temporal} from '@js-temporal/polyfill';
import Timer from '/@/components/Timer.vue';
import MaskedTime from '/@/components/MaskedTime.vue';
import MinimizeButton from '/@/components/MinimizeButton.vue';
import SkipButton from '/@/components/SkipButton.vue';

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

if (window.Worker) {
  const worker = new Worker(new URL('./worker.ts', import.meta.url), {type: 'module'});
  worker.addEventListener('message', (e) => {
    if (e.data !== 'worker-interval') return;
    const minutesWithSkipped = getMinutesToNextShutdownWithSkipped();
    t.value = minutesWithSkipped;
    if ((SETTINGS.value.interval - getMinutesToNextShutdown()) * 60 < 0.3) {
      skipped.value = false;
    }
    if (minutesWithSkipped * 60 < 0.2) {
      runShutdown();
    }
  });
}

function tieStart(hours: number, minutes: number) {
  SETTINGS.value.startHour = hours;
  SETTINGS.value.startMinute = minutes;
}

function tieEnd(hours: number, minutes: number) {
  SETTINGS.value.endHour = hours;
  SETTINGS.value.endMinute = minutes;
}

</script>

<template>
  <MinimizeButton />
  <div class="bg-[#313131] px-9 py-5 h-screen w-screen font-['Fira_Code']">
    <div class="text-[#A7A5A5] text-3xl font-semibold text-center">
      SHUTDOWN IN
    </div>
    <Timer :minutes="t" />
    <div class="flex flex-row align-middle mt-2">
      <div class="w-[100px] flex flex-col">
        <span class="text-xl text-[#A7A5A5] font-medium">START</span>
        <MaskedTime
          :hour="SETTINGS.startHour"
          :minute="SETTINGS.startMinute"
          @time-update="tieStart"
        />
      </div>
      <div class="w-[100px] flex flex-col">
        <span class="text-xl text-[#A7A5A5] font-medium">END</span>
        <MaskedTime
          :hour="SETTINGS.endHour"
          :minute="SETTINGS.endMinute"
          @time-update="tieEnd"
        />
      </div>
      <div class="w-[100px] flex flex-col">
        <span class="text-xl text-[#A7A5A5] font-medium">INTERVAL</span>
        <div class="flex flex-row">
          <input
            v-model.number="SETTINGS.interval"
            type="number"
            class="w-7 mr-0.5 bg-white/[.15] text-white text-xl"
          >
          <span class="text-white text-lg">min</span>
        </div>
      </div>
      <SkipButton
        :skipped="skipped"
        @click="skipped=true"
      />
    </div>
  </div>
</template>
