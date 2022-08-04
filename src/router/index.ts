import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '../views/Home.vue';
import $load from '@cps/GlobalLoading';
import { useAppStore } from '@store/index';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  // {
  //   path: "/about",
  //   name: "about",
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () =>
  //     import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  // },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  // 每次进来，先确定是否拿到钱包
  // const appStore = useAppStore();
  //不是admin跳转首页
  // if (to.meta.admin && !appStore.isAdmin) {
  //   router.replace({ name: "ido" })
  // }

  // if (appStore.defaultAccount) {
  //   next(true);
  // } else {
  //   $load({ isShow: true });
  //   await appStore.linkWallet();
  //   $load({ isShow: false });
  //   next(true);
  // }
  next(true);
});

export default router;
