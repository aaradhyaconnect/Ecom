"use client";

import { useState, useEffect } from "react";
import { Users, Loader2, UserPlus, Repeat, TrendingUp } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";

interface Summary {
  totalCustomers: number;
  newThisMonth: number;
  avgLifetimeValue: number;
  repeatRate: number;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string;
}

interface NewByDay {
  date: string;
  count: number;
}

interface CustomersData {
  summary: Summary;
  topCustomers: TopCustomer[];
  newByDay: NewByDay[];
}

export default function CustomersReportPage() {
  const [data, setData] = useState<CustomersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/admin/reports/customers");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-white/40">
        <Users className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">Failed to load customer data.</p>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Customers",
      value: data.summary.totalCustomers,
      icon: Users,
    },
    {
      label: "New This Month",
      value: data.summary.newThisMonth,
      icon: UserPlus,
    },
    {
      label: "Avg Lifetime Value",
      value: formatPrice(data.summary.avgLifetimeValue),
      icon: TrendingUp,
    },
    {
      label: "Repeat Customer Rate",
      value: `${data.summary.repeatRate.toFixed(1)}%`,
      icon: Repeat,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 p-5 rounded-xl"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gold/10 p-2 rounded-lg">
                <card.icon className="h-4 w-4 text-gold-dark" />
              </div>
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          Top Customers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory-dark/60 dark:border-white/10 text-left text-[11px] uppercase tracking-wider font-medium text-gray-500 dark:text-white/40">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4 text-right">Orders</th>
                <th className="py-3 pr-4 text-right">Total Spent</th>
                <th className="py-3 text-right">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-ivory-dark/40 dark:border-white/5 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-white/40 text-xs">
                    {c.email}
                  </td>
                  <td className="py-3 pr-4 text-right text-gray-900 dark:text-white">
                    {c.totalOrders}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium text-gray-900 dark:text-white">
                    {formatPrice(c.totalSpent)}
                  </td>
                  <td className="py-3 text-right text-gray-500 dark:text-white/40 text-xs">
                    {c.lastOrder ? formatDate(c.lastOrder) : "-"}
                  </td>
                </tr>
              ))}
              {data.topCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-white/40">
                    No customer data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-white/5 border border-ivory-dark/60 dark:border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
          New Customers by Day
        </h2>
        {data.newByDay.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-white/40 py-4">
            No new customer signups in this period.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.newByDay.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-white/5"
              >
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(day.date)}
                </span>
                <Badge variant="new">
                  {day.count} new
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
