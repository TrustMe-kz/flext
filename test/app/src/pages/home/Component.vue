<script setup lang="ts">

import { onMounted, ref, watch } from 'vue';
import { Obj } from '@/types';
import { Textarea } from '@/shadcn/components/ui/textarea';
import Flext from '@flext';
import exampleTemplateSyntax from './example-template/syntax.hbs?raw';
import exampleTemplateData from './example-template/data.json';


// Defining the variables

const sandboxEl = ref<any>();
const styleEl = ref<any>();
const previewEl = ref<any>();
const template = ref<string|null>(exampleTemplateSyntax);
const dataStr = ref<string|null>(JSON.stringify(exampleTemplateData, null, 2));


// Defining the functions

const previewCss = (val: string): void => { styleEl.value.textContent = val; }

const preview = (html: string, css?: string|null): void => {
  previewEl.value.innerHTML = html;
  previewCss(css || '');
};

const err = (e: Error): void => preview(e?.message ?? 'Unknown Error');

const upd = async (): Promise<void> => {

  // Getting the data

  let data: Obj = {};

  try {
    data = JSON.parse(dataStr.value);
  } catch (e: any) {
    console.warn(e);

    err(e);

    return;
  }


  // Getting the preview

  const flext = new Flext().setTemplate(template.value).setData(data);

  const css = await flext.getCss();

  console.log('flext.model', flext.model);


  preview(flext.html, css);
}


// Defining the watchers

watch(template, async () => {
  await upd();
});

watch(dataStr, async () => {
  await upd();
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

  await upd();
});

</script>

<template>
  <div class="templates_page flex flex-col h-full p-4 gap-16 grow">
    <div class="h-[35vh] flex gap-2">
      <Textarea v-model="template" />
      <Textarea v-model="dataStr" />
    </div>

    <div ref="sandboxEl" />
  </div>
</template>