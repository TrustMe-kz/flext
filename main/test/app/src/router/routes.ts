import { RouteRecordRaw } from 'vue-router';
import HomePage from '@/pages/home';


// Third-parties

export const routes: RouteRecordRaw[] = [
    {
        name: 'Home',
        path: '/',
        component: HomePage,
    },
];


export default routes;
