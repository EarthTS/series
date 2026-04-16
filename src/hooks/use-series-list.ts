"use client";

import { useEffect, useState } from "react";
import { fetchSeriesList } from "@/lib/api/series-api";
import type { Series } from "@/lib/types";

export function useSeriesList(): Series[] {
  const [list, setList] = useState<Series[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchSeriesList()
      .then((items) => {
        if (mounted) setList(items);
      })
      .catch(() => {
        if (mounted) setList([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return list;
}

export function useRefreshSeriesList(): [Series[], () => void] {
  const [list, setList] = useState<Series[]>([]);
  const refresh = () => {
    fetchSeriesList()
      .then(setList)
      .catch(() => setList([]));
  };

  useEffect(() => {
    refresh();
  }, []);

  return [list, refresh];
}
