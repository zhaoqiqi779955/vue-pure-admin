import { $t } from "@/plugins/i18n";
import { scheduler } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/scheduler",
  name: "Scheduler",
  component: Layout,
  redirect: "/scheduler/tasks",
  meta: {
    icon: "ri/time-line",
    title: $t("menus.pureScheduler"),
    rank: scheduler
  },
  children: [
    {
      path: "/scheduler/tasks",
      name: "SchedulerTasks",
      component: () => import("@/views/scheduler/tasks/index.vue"),
      meta: {
        title: $t("menus.pureSchedulerTasks")
      }
    }
  ]
} satisfies RouteConfigsTable;
