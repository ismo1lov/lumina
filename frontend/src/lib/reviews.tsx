import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { api } from "./api";

export type ReviewSummary = { average: number; count: number };

type SummaryRow = { productId: string; average: number; count: number };

type ReviewsContextValue = {
  /** Real rating summary per product (only products that have reviews). */
  summary: Record<string, ReviewSummary>;
  /** Update one product instantly, e.g. right after a review was sent. */
  applySummary: (productId: string, summary: ReviewSummary) => void;
  /** Reload every summary from the API. */
  refresh: () => Promise<void>;
};

const ReviewsContext = createContext<ReviewsContextValue>({
  summary: {},
  applySummary: () => {},
  refresh: async () => {},
});

/**
 * Keeps the customer ratings in one place so that every page (home, catalog,
 * product) shows the same numbers and updates instantly when a review is sent.
 */
export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [summary, setSummary] = useState<Record<string, ReviewSummary>>({});

  const refresh = useCallback(async () => {
    try {
      const rows = await api.get<SummaryRow[]>("/reviews/summary/all");
      const next: Record<string, ReviewSummary> = {};
      for (const row of rows ?? []) {
        next[row.productId] = { average: Number(row.average ?? 0), count: Number(row.count ?? 0) };
      }
      setSummary(next);
    } catch {
      /* keep the current values */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applySummary = useCallback((productId: string, value: ReviewSummary) => {
    setSummary((prev) => ({ ...prev, [productId]: value }));
  }, []);

  const value = useMemo(
    () => ({ summary, applySummary, refresh }),
    [summary, applySummary, refresh],
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  return useContext(ReviewsContext);
}
