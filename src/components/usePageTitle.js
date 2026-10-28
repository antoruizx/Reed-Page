import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Reed` : "Reed · Ropa unisex oversize";
  }, [title]);
}
