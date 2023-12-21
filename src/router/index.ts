import { RouteRecordRaw, createRouter, createWebHashHistory } from 'vue-router'
import { capitalize } from 'lodash-es'

const modules: Record<string, any> = import.meta.glob(
  ["../views/**/*.vue", "!../views/home"],
  {
    eager: true,
  }
);

const ViewsRoutes = Object.keys(modules).map((key: string) => {
  const path = key.replace('../views', '').replace('.vue', '')
  const name = path.split('/').map(s => capitalize(s)).reduce((cur, pre) => cur + pre, '')
  return {
    path: path,
    name: name,
    component: modules[key].default
  }
})
// console.log(modules, 'modulesmodules', ViewsRoutes);

const Home = () => import('../views/home/index.vue');

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  ...ViewsRoutes
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router