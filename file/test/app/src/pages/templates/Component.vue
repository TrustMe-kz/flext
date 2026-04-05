<script setup lang="ts">

import { useRoute, useRouter, RouterView } from 'vue-router';
import { Tabs, TabsList, TabsTrigger } from '@/shadcn/components/ui/tabs';

const route = useRoute();

const router = useRouter();

</script>

<template>
  <div class="p-6 flex flex-col gap-10">
    <Tabs
        class="w-full gap-10"
        :model-value="String(route.name ?? 'Home')"
        @update:model-value="val => router.push({ name: String(val) })"
    >
      <TabsList class="grid w-[50%] grid-cols-2 bg-[#ECEEEE]">
        <TabsTrigger value="Home">
          New Template
        </TabsTrigger>

        <TabsTrigger value="File">
          From File
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <RouterView />
  </div>
</template>