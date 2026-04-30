"use client";

import { useState } from "react";
import type { AdminActivity } from "@/data/admin-activity";
import type { Lead } from "@/data/leads";
import type { Property } from "@/data/properties";
import { AdminLeadsManager } from "@/components/admin-leads-manager";
import { AdminPropertiesManager } from "@/components/admin-properties-manager";

type Props = {
  initialProperties: Property[];
  initialLeads: Lead[];
  canPersist: boolean;
  crmReady: boolean;
  readOnlyReason?: string;
  initialActivities: AdminActivity[];
  activityReady: boolean;
};

type TabId = "properties" | "leads";

export function AdminCrmDashboard({
  initialProperties,
  initialLeads,
  canPersist,
  crmReady,
  readOnlyReason,
  initialActivities,
  activityReady,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("properties");

  return (
    <>
      <section className="mt-8 flex flex-wrap gap-3">
        {[
          { id: "properties", label: "Propiedades" },
          { id: "leads", label: "Leads" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === tab.id
                ? "bg-[#1f3b4d] text-white"
                : "border border-[#d8cabd] bg-white text-[#5c666d] hover:bg-[#f7efe5]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === "properties" ? (
        <AdminPropertiesManager
          initialProperties={initialProperties}
          canPersist={canPersist}
          readOnlyReason={readOnlyReason}
          initialActivities={initialActivities}
          activityReady={activityReady}
        />
      ) : (
        <AdminLeadsManager
          initialLeads={initialLeads}
          crmReady={crmReady}
          canEdit={canPersist}
          readOnlyReason={readOnlyReason}
          initialActivities={initialActivities}
          activityReady={activityReady}
        />
      )}
    </>
  );
}
