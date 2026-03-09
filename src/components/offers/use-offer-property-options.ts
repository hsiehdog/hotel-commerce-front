"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProperties } from "@/lib/api-client";
import {
  buildOfferPropertyOptions,
  DEMO_PROPERTY_ID,
  getDefaultOfferPropertyId,
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

  const propertyOptions = useMemo(
    () => (propertiesQuery.isPending ? [] : buildOfferPropertyOptions(propertiesQuery.data ?? [])),
    [propertiesQuery.data, propertiesQuery.isPending],
  );

  const defaultPropertyId = useMemo(() => {
    if (propertiesQuery.isPending) {
      return "";
    }
    if (propertiesQuery.isError) {
      return DEMO_PROPERTY_ID;
    }
    return getDefaultOfferPropertyId(propertiesQuery.data ?? []);
  }, [propertiesQuery.data, propertiesQuery.isError, propertiesQuery.isPending]);

  return {
    defaultPropertyId,
    propertyOptions,
    propertiesError: propertiesQuery.isError ? "Unable to load properties." : null,
    propertiesLoading: propertiesQuery.isLoading,
  };
}
