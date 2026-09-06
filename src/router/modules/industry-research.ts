import { $t } from "@/plugins/i18n";
import { industryResearch } from "@/router/enums";
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/industry-research",
  name: "IndustryResearch",
  component: Layout,
  redirect: "/industry-research/hog-cycle",
  meta: {
    icon: "ri/line-chart-line",
    title: $t("menus.pureIndustryResearch"),
    rank: industryResearch
  },
  children: [
    {
      path: "/industry-research/hog-cycle",
      name: "IndustryResearchHogCycle",
      component: () => import("@/views/industry-research/hog-cycle/index.vue"),
      meta: {
        title: $t("menus.pureHogCycle")
      }
    }
  ]
} satisfies RouteConfigsTable;
