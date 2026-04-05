<script setup lang="ts">

import { onMounted, ref, watch } from 'vue';
import { Input } from '@/shadcn/components/ui/input';
import FlextFile from '@flext-file';


// Defining the variables

const sandboxEl = ref<any>();
const styleEl = ref<any>();
const previewEl = ref<any>();
const file = ref<File | null>(null);


// Defining the functions

const previewCss = (val: string): void => { styleEl.value.textContent = val; }

const preview = (html: string, css?: string|null): void => {
  previewEl.value.innerHTML = html;
  previewCss(css || '');
};

const onChange = (val: any): void => {
  const [ first ] = val?.target?.files ?? [];
  file.value = first ?? null;
};


// Defining the watchers

watch(file, async (val: File | null) => {
  if (!val) return;

  const file = await FlextFile.from(await val.arrayBuffer(), true);

  preview(file.data.html, await file.data.getCss());
});


// Defining the hooks

onMounted(async () => {

  // Getting the sandbox

  const sandbox = sandboxEl.value.attachShadow({ mode: 'open' });


  // Getting the styles

  styleEl.value = document.createElement('style');
  styleEl.value.setAttribute('type', 'text/css');

  sandbox.appendChild(styleEl.value);


  // Getting the preview

  previewEl.value = document.createElement('body');

  sandbox.appendChild(previewEl.value);


  // Updating the data

  // await upd();
});

</script>

<template>
  <div class="templates_page flex flex-col h-full gap-16 grow">
    <Input class="w-min" type="file" @change="onChange" />
    <div ref="sandboxEl" />
  </div>
</template>
