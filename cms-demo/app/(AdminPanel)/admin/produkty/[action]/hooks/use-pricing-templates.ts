import { useState, useEffect } from "react";

interface PricingTemplate {
  id: string;
  name: string;
}

export function usePricingTemplates() {
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>(
    []
  );
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    const fetchPricingTemplates = async () => {
      try {
        const response = await fetch("/api/admin/pricing-templates");
        if (response.ok) {
          const templates = await response.json();
          setPricingTemplates(templates);
        } else {
        }
      } catch (error) {
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchPricingTemplates();
  }, []);

  return {
    pricingTemplates,
    isLoadingTemplates,
  };
}
