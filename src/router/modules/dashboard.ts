import { $t } from "@/plugins/i18n";
import { dashboard } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/dashboard",
  name: "Dashboard",
  component: Layout,
  redirect: "/dashboard/zhongxin-short",
  meta: {
    icon: "ri/dashboard-line",
    title: $t("menus.pureDashboard"),
    rank: dashboard
  },
  children: [
    {
      path: "/dashboard/zhongxin-short",
      name: "DashboardZhongxinShort",
      component: () => import("@/views/dashboard/zhongxin-short/index.vue"),
      meta: {
        title: $t("menus.pureZhongxinShort")
      }
    }
  ]
} satisfies RouteConfigsTable;
