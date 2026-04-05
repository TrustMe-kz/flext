import { RouteRecordRaw } from 'vue-router';
import TemplatesPage from '@/pages/templates';
import FilePage from '@/pages/templates/file';


// Third-parties

export const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: TemplatesPage,
        children: [
            {
                name: 'Home',
                path: '',
                component: FilePage,
            },

            {
                name: 'File',
                path: 'file',
                component: FilePage,
            },
        ]
    },
];


export default routes;
