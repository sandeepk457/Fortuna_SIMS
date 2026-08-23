/**
 * Fortuna IntelliAI
 * Context Engine
 *
 * The Context Engine defines the business context
 * available to IntelliAI for each request.
 *
 * Current stage:
 * - Static application context
 * - No live database access yet
 *
 * Future stage:
 * - SIMS API context
 * - User context
 * - Warehouse context
 * - Inventory context
 * - Procurement context
 * - Demand context
 * - Vendor context
 */

export type IntelliAIContext = {
  application: ApplicationContext;
  user?: UserContext;
  business?: BusinessContext;
  data?: DataContext;
};

export type ApplicationContext = {
  product: string;
  productDescription: string;
  environment: "development" | "production";
  modules: string[];
};

export type UserContext = {
  userId?: string;
  role?: string;
  name?: string;
};

export type BusinessContext = {
  company?: string;
  region?: string;
  branch?: string;
  warehouse?: string;
};

export type DataContext = {
  inventory?: unknown;
  demand?: unknown;
  procurement?: unknown;
  vendors?: unknown;
  warehouse?: unknown;
};

/**
 * Base Fortuna SIMS application context.
 *
 * This information is always available to IntelliAI.
 */
export const FORTUNA_APPLICATION_CONTEXT: ApplicationContext = {
  product: "Fortuna SIMS",

  productDescription:
    "Fortuna SIMS is a Supply & Inventory Management System designed to provide operational visibility and intelligence across supply-chain processes.",

  environment: "development",

  modules: [
    "Item Master",
    "UOM Management",
    "Customer Management",
    "Vendor Management",
    "Warehouse Management",
    "Purchase Requisition",
    "RFQ",
    "Purchase Orders",
    "Goods Inward",
    "GRN",
    "Inventory",
    "Stock Dashboard",
    "Stock Adjustment",
    "Cycle Count",
    "Stock Transfer",
    "Dispatch",
    "Returns",
    "Reports",
    "Alerts",
    "Demand Forecasting",
  ],
};

/**
 * Creates the IntelliAI context for a request.
 *
 * This function will eventually collect context from
 * authenticated user/session, SIMS APIs and business tools.
 */
export function createIntelliAIContext(
  context?: Partial<IntelliAIContext>
): IntelliAIContext {
  return {
    application: {
      ...FORTUNA_APPLICATION_CONTEXT,
      ...context?.application,
    },

    user: context?.user,

    business: context?.business,

    data: context?.data,
  };
}

/**
 * Converts the context into a readable format that can
 * later be supplied to the AI model.
 */
export function formatIntelliAIContext(
  context: IntelliAIContext
): string {
  const sections: string[] = [];

  sections.push(`
APPLICATION CONTEXT
-------------------
Product: ${context.application.product}
Description: ${context.application.productDescription}
Environment: ${context.application.environment}
`);

  sections.push(`
AVAILABLE MODULES
-----------------
${context.application.modules
  .map((module) => `• ${module}`)
  .join("\n")}
`);

  if (context.user) {
    sections.push(`
USER CONTEXT
------------
User ID: ${context.user.userId ?? "Not available"}
Role: ${context.user.role ?? "Not available"}
Name: ${context.user.name ?? "Not available"}
`);
  }

  if (context.business) {
    sections.push(`
BUSINESS CONTEXT
----------------
Company: ${context.business.company ?? "Not available"}
Region: ${context.business.region ?? "Not available"}
Branch: ${context.business.branch ?? "Not available"}
Warehouse: ${context.business.warehouse ?? "Not available"}
`);
  }

  if (context.data) {
    sections.push(`
AVAILABLE BUSINESS DATA
-----------------------
Inventory: ${
      context.data.inventory ? "Available" : "Not available"
    }

Demand: ${
      context.data.demand ? "Available" : "Not available"
    }

Procurement: ${
      context.data.procurement ? "Available" : "Not available"
    }

Vendors: ${
      context.data.vendors ? "Available" : "Not available"
    }

Warehouse: ${
      context.data.warehouse ? "Available" : "Not available"
    }
`);
  }

  return sections.join("\n");
}