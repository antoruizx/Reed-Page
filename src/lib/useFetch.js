import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

// Pide datos a la API y maneja carga/error. `deps` define cuándo volver a pedir.
export function useFetch(path, options, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api(path, options)
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => run(), [run]);

  return { ...state, reload: run };
}
