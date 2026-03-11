"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProperties } from "@/lib/api-client";
import {
  buildOfferPropertyOptions,
  DEMO_PROPERTY_ID,
} from "@/lib/demo-properties";

type UseOfferPropertyOptionsResult = {
  defaultPropertyId: string;
  propertyOptions: ReturnType<typeof buildOfferPropertyOptions>;
  propertiesError: string | null;
  propertiesLoading: boolean;
};

export function useOfferPropertyOptions(queryKey: string): UseOfferPropertyOptionsResult {
  const propertiesQuery = useQuery({
    queryKey: [queryKey],
    queryFn: () => fetchProperties({ activeOnly: true }),
  });

  const { propertyOptions, defaultPropertyId } = useMemo(() => {
    if (propertiesQuery.isPending) {
      return {
        propertyOptions: [],
        defaultPropertyId: "",
      };
    }

    if (propertiesQuery.isError) {
      return {
        propertyOptions: [],
        defaultPropertyId: DEMO_PROPERTY_ID,
      };
    }

    const options = buildOfferPropertyOptions(propertiesQuery.data ?? []);

    return {
      propertyOptions: options,
      defaultPropertyId: options[0]?.propertyId ?? DEMO_PROPERTY_ID,
    };
  }, [propertiesQuery.data, propertiesQuery.isError, propertiesQuery.isPending]);

  return {
    defaultPropertyId,
    propertyOptions,
    propertiesError: propertiesQuery.isError ? "Unable to load properties." : null,
    propertiesLoading: propertiesQuery.isLoading,
  };
}
