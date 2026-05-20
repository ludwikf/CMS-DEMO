"use client";
import { useEffect, useState } from "react";
import PricingTemplatesTable from "./PricingTemplatesTable";

export default function CennikPage() {
  const [pricingTemplates, setPricingTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const fetchPricingTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch("/api/admin/pricing-templates");
      if (!res.ok) throw new Error("Failed to fetch pricing templates");
      const data = await res.json();
      setPricingTemplates(data);
    } catch (e) {
      setPricingTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchPricingTemplates();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PricingTemplatesTable
        initialTemplates={pricingTemplates}
        onRefresh={fetchPricingTemplates}
        loading={loadingTemplates}
      />
    </div>
  );
}
