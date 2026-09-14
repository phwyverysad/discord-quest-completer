<script setup lang="ts" generic="T">
import { ref, onMounted, onUnmounted, computed } from 'vue';

export interface DropdownOption<V = any> {
  value: V;
  label: string;
  sublabel?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: T;
    options: DropdownOption<T>[];
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    placeholder: 'Select...',
    disabled: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: T];
  change: [value: T];
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === props.modelValue);
});

function toggleDropdown() {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
}

function selectOption(option: DropdownOption<T>) {
  emit('update:modelValue', option.value);
  emit('change', option.value);
  isOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    isOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div class="relative select-none text-xs" ref="dropdownRef">
    <!-- Trigger Button -->
    <button
      type="button"
      @click="toggleDropdown"
      :disabled="disabled"
      class="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer text-left bg-slate-50 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 shadow-2xs group"
      :class="[
        isOpen
          ? 'border-[#5865F2] ring-2 ring-[#5865F2]/20 dark:border-[#5865F2]'
          : 'border-slate-200 dark:border-slate-700/80 hover:border-[#5865F2]/50 dark:hover:border-slate-600',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <div class="flex items-center gap-2 truncate min-w-0">
        <span class="font-medium truncate">
          {{ selectedOption?.label || placeholder }}
        </span>
        <span
          v-if="selectedOption?.sublabel"
          class="text-[11px] text-slate-400 dark:text-slate-500 truncate"
        >
          ({{ selectedOption.sublabel }})
        </span>
      </div>

      <!-- Chevron Icon with Smooth Rotation Animation -->
      <svg
        class="w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 ease-out shrink-0"
        :class="{ 'rotate-180 text-[#5865F2] dark:text-[#818CF8]': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Animated Dropdown Menu -->
    <Transition
      enter-active-class="transition-all duration-200 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="opacity-0 translate-y-1.5 scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-150 cubic-bezier(0.4, 0, 1, 1)"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-1.5 scale-[0.98]"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 right-0 z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-[#131927] border border-slate-200 dark:border-slate-700 p-1.5 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 backdrop-blur-md focus:outline-none"
      >
        <div class="space-y-0.5">
          <button
            v-for="opt in options"
            :key="String(opt.value)"
            type="button"
            @click="selectOption(opt)"
            class="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 text-left cursor-pointer group"
            :class="[
              opt.value === modelValue
                ? 'bg-[#5865F2]/10 dark:bg-[#5865F2]/25 text-[#5865F2] dark:text-[#A5AFFA] font-bold ring-1 ring-[#5865F2]/20'
                : 'text-slate-700 dark:text-slate-300 hover:bg-[#5865F2]/6 dark:hover:bg-[#1A2335] hover:text-[#5865F2] dark:hover:text-white font-medium'
            ]"
          >
            <div class="flex items-center gap-2 truncate min-w-0">
              <span class="truncate">{{ opt.label }}</span>
              <span
                v-if="opt.sublabel"
                class="text-[11px] truncate"
                :class="opt.value === modelValue ? 'text-[#5865F2]/80 dark:text-[#A5AFFA]/80' : 'text-slate-400 dark:text-slate-500'"
              >
                ({{ opt.sublabel }})
              </span>
            </div>

            <!-- Checkmark for selected item -->
            <svg
              v-if="opt.value === modelValue"
              class="w-4 h-4 text-[#5865F2] dark:text-[#818CF8] shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
