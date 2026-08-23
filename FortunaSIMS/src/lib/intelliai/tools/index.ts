/**
 * Fortuna IntelliAI
 * Tools Engine
 *
 * This layer defines the operational capabilities available
 * to Fortuna IntelliAI.
 *
 * Current stage:
 * - Tool definitions only
 * - No real SIMS database/API calls yet
 *
 * Future stage:
 * - Connect each tool to authorized SIMS APIs
 * - Return real operational data
 * - Allow IntelliAI to reason over that data
 */

export type IntelliAIToolCategory =
  | "inventory"
  | "demand"
  | "procurement"
  | "vendor"
  | "warehouse"
  | "reports"
  | "alerts";

export type IntelliAITool = {
  name: string;
  description: string;
  category: IntelliAIToolCategory;
  enabled: boolean;
  requiresLiveData: boolean;
};

/**
 * Fortuna IntelliAI operational tool registry.
 */
export const INTELLIAI_TOOLS: IntelliAITool[] = [
  // =========================================================
  // INVENTORY
  // =========================================================

  {
    name: "get_inventory_status",
    description:
      "Analyse current inventory status including stock levels, availability and inventory health.",
    category: "inventory",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "identify_low_stock",
    description:
      "Identify items with low stock or potential stock-out risk.",
    category: "inventory",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "identify_overstock",
    description:
      "Identify items with excessive inventory or potential overstock risk.",
    category: "inventory",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_stock_movement",
    description:
      "Analyse inventory movement, consumption and stock movement trends.",
    category: "inventory",
    enabled: true,
    requiresLiveData: true,
  },

  // =========================================================
  // DEMAND FORECASTING
  // =========================================================

  {
    name: "generate_demand_forecast",
    description:
      "Generate demand forecasts using historical demand and relevant supply-chain factors.",
    category: "demand",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_demand_trend",
    description:
      "Analyse demand trends, changes and patterns over time.",
    category: "demand",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "identify_demand_risk",
    description:
      "Identify abnormal demand patterns and potential demand risks.",
    category: "demand",
    enabled: true,
    requiresLiveData: true,
  },

  // =========================================================
  // PROCUREMENT
  // =========================================================

  {
    name: "analyse_purchase_requisitions",
    description:
      "Analyse Purchase Requisitions, status, ageing and procurement requirements.",
    category: "procurement",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_rfqs",
    description:
      "Analyse RFQs, vendor quotations and procurement opportunities.",
    category: "procurement",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_purchase_orders",
    description:
      "Analyse Purchase Orders, status, delivery expectations and procurement risks.",
    category: "procurement",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "identify_procurement_risk",
    description:
      "Identify procurement delays, bottlenecks and potential supply risks.",
    category: "procurement",
    enabled: true,
    requiresLiveData: true,
  },

  // =========================================================
  // VENDOR
  // =========================================================

  {
    name: "analyse_vendor_performance",
    description:
      "Analyse vendor delivery, quality, lead time and performance indicators.",
    category: "vendor",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "compare_vendors",
    description:
      "Compare vendors using relevant operational and commercial performance metrics.",
    category: "vendor",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "identify_vendor_risk",
    description:
      "Identify potential vendor performance and supply risks.",
    category: "vendor",
    enabled: true,
    requiresLiveData: true,
  },

  // =========================================================
  // WAREHOUSE
  // =========================================================

  {
    name: "analyse_warehouse_operations",
    description:
      "Analyse warehouse operations including inbound, outbound and inventory movement.",
    category: "warehouse",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_grn_operations",
    description:
      "Analyse Goods Receipt / GRN processing and identify operational delays.",
    category: "warehouse",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_cycle_counts",
    description:
      "Analyse cycle count activity, discrepancies and inventory accuracy.",
    category: "warehouse",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "analyse_stock_transfers",
    description:
      "Analyse stock transfer activity between warehouses or locations.",
    category: "warehouse",
    enabled: true,
    requiresLiveData: true,
  },

  // =========================================================
  // REPORTS
  // =========================================================

  {
    name: "analyse_business_report",
    description:
      "Analyse an authorized SIMS business report and identify important insights.",
    category: "reports",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "generate_business_summary",
    description:
      "Generate an executive summary from available SIMS operational data.",
    category: "reports",
    enabled: true,
    requiresLiveData: true,
  },

  // =========================================================
  // ALERTS
  // =========================================================

  {
    name: "analyse_operational_alerts",
    description:
      "Analyse operational alerts and identify high-priority business risks.",
    category: "alerts",
    enabled: true,
    requiresLiveData: true,
  },

  {
    name: "prioritize_business_risks",
    description:
      "Prioritize operational risks based on severity, urgency and business impact.",
    category: "alerts",
    enabled: true,
    requiresLiveData: true,
  },
];

/**
 * Return all enabled IntelliAI tools.
 */
export function getEnabledIntelliAITools(): IntelliAITool[] {
  return INTELLIAI_TOOLS.filter((tool) => tool.enabled);
}

/**
 * Return tools belonging to a specific category.
 */
export function getIntelliAIToolsByCategory(
  category: IntelliAIToolCategory
): IntelliAITool[] {
  return INTELLIAI_TOOLS.filter(
    (tool) => tool.category === category && tool.enabled
  );
}

/**
 * Find a tool by its name.
 */
export function getIntelliAITool(
  name: string
): IntelliAITool | undefined {
  return INTELLIAI_TOOLS.find((tool) => tool.name === name);
}

/**
 * Convert the tool registry into a readable description
 * for the AI model.
 */
export function formatIntelliAITools(): string {
  const enabledTools = getEnabledIntelliAITools();

  return enabledTools
    .map(
      (tool) =>
        `• ${tool.name}: ${tool.description}`
    )
    .join("\n");
}