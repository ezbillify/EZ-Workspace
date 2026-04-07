import axios, { AxiosRequestConfig } from "axios";
import { useCallback } from "react";

export function useApi() {
  const request = useCallback(
    async <T>(config: AxiosRequestConfig): Promise<T> => {
      const res = await axios(config);
      return res.data as T;
    },
    []
  );

  return { request };
}
