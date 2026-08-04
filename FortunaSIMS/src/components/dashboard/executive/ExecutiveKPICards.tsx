"use client";

import { useEffect, useState } from "react";
import axios from "axios";

import {
  GroupIcon,
  BoxIconLine,
} from "@/icons";

import ExecutiveKPICard from "./ExecutiveKPICard";

interface DashboardMetrics {
  totalCustomers: number;
  totalVendors: number;
  totalItems: number;
  totalWarehouses: number;

  totalPR: number;
  totalRFQ: number;
  totalPO: number;
  totalGRN: number;

  totalOrders: number;
  totalRevenue: number;
}

export default function ExecutiveKPICards() {
const [metrics, setMetrics] = useState<DashboardMetrics>({
  totalCustomers: 0,
  totalVendors: 0,
  totalItems: 0,
  totalWarehouses: 0,

  totalPR: 0,
  totalRFQ: 0,
  totalPO: 0,
  totalGRN: 0,

  totalOrders: 0,
  totalRevenue: 0,
});

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/ecommerce/metrics"
      );

      setMetrics(res.data);
    } catch (err) {
      console.error("Metrics API Error:", err);
    }
  };

  const cards = [
    {
      title: "Customers",
      value: metrics.totalCustomers,
      growth: "12%",
      icon: <GroupIcon className="size-6 text-white" />,
      gradient: "from-[#C8102E] to-[#005F99]",
      positive: true,
      subtitle: "Active Customers",
    },
    {
      title: "Orders",
      value: metrics.totalOrders,
      growth: "5%",
      icon: <BoxIconLine className="size-6 text-white" />,
      gradient: "from-[#005F99] to-[#C8102E]",
      positive: true,
      subtitle: "Purchase Orders",
    },
    {
  title: "Total PR",
  value: metrics.totalPR,
  growth: "8%",
  icon: <GroupIcon className="size-6 text-white" />,
  gradient: "from-[#C8102E] to-[#005F99]",
  positive: true,
  subtitle: "Purchase Requisitions",
},
    {
  title: "Active RFQs",
  value: metrics.totalRFQ,
  growth: "4%",
  icon: <BoxIconLine className="size-6 text-white" />,
  gradient: "from-[#005F99] to-[#C8102E]",
  positive: true,
  subtitle: "Waiting for Quotations",
},
    {
      title: "Open POs",
      value: 31,
      growth: "2%",
      icon: <BoxIconLine className="size-6 text-white" />,
      gradient: "from-[#C8102E] to-[#005F99]",
      positive: true,
      subtitle: "Purchase Orders",
    },
    {
      title: "GRN This Month",
      value: 67,
      growth: "9%",
      icon: <GroupIcon className="size-6 text-white" />,
      gradient: "from-[#005F99] to-[#C8102E]",
      positive: true,
      subtitle: "Goods Receipts",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <ExecutiveKPICard
          key={card.title}
          title={card.title}
          value={card.value}
          growth={card.growth}
          icon={card.icon}
          gradient={card.gradient}
          positive={card.positive}
          subtitle={card.subtitle}
        />
      ))}
    </div>
  );
}