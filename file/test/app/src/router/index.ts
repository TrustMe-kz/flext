import { createRouter, createWebHistory } from 'vue-router';
import routes from './routes';


// Constants

export const SHELL_BASE = import.meta.env.VITE_BASE_PATH ?? '';


// Variables

export const history = createWebHistory(SHELL_BASE);

export const router = createRouter({ history, routes });


export default router;
