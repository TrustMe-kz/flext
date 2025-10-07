import { createApp } from 'vue';
import router from '@/router';
import App from './App.vue';
import 'vue-sonner/style.css';
import './app.css';

createApp(App).use(router).mount('#app');
