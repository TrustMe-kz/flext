<script setup lang="ts">

import { onMounted, ref, watch } from 'vue';
import { Obj } from '@/types';
import { Textarea } from '@/shadcn/components/ui/textarea';
import Flext from '@flext';
import exampleTemplateSyntax from './example-template/syntax.hbs?raw';
import exampleTemplateData from './example-template/data.json';


// Defining the variables

const previewEl = ref<any>();
const template = ref<string|null>(exampleTemplateSyntax);
const dataStr = ref<string|null>(JSON.stringify(exampleTemplateData, null, 2));


// Defining the functions

const preview = (val: string): void => { previewEl.value.innerHTML = val; };

const err = (e: Error): void => preview(e?.message ?? 'Unknown Error');

const upd = (): void => {

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

  preview(flext.html);
}


// Defining the watchers

watch(template, () => {
  upd();
});

watch(dataStr, () => {
  upd();
});


// Defining the hoooks

onMounted(() => {
  upd();
});

</script>

<template>
  <div class="templates_page flex flex-col h-full p-4 gap-16 grow">
    <div class="h-[35vh] flex gap-2">
      <Textarea v-model="template" />
      <Textarea v-model="dataStr" />
    </div>

    <div ref="previewEl" />
  </div>
</template>