import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Stats from '../views/Stats.vue'
import ApiDocs from '../views/ApiDocs.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/stats',
        name: 'Stats',
        component: Stats
    },
    {
        path: '/api-docs',
        name: 'ApiDocs',
        component: ApiDocs
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
