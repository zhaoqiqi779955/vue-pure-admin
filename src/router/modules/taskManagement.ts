import { $t } from "@/plugins/i18n";
import { taskManagement } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/task-management",
  name: "TaskManagement",
  component: Layout,
  redirect: "/task-management/tasks",
  meta: {
    icon: "ri/task-line",
    title: $t("menus.pureTaskManagement"),
    rank: taskManagement
  },
  children: [
    {
      path: "/task-management/tasks",
      name: "TaskManagementTasks",
      component: () => import("@/views/task-management/tasks/index.vue"),
      meta: {
        title: $t("menus.pureTaskManagement")
      }
    }
  ]
} satisfies RouteConfigsTable;
