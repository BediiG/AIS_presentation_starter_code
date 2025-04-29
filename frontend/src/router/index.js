import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../components/LoginPage.vue";
import SuccessPage from "../components/SuccessPage.vue";

const routes = [
  { path: "/", component: LoginPage },
  { path: "/success", component: SuccessPage },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
