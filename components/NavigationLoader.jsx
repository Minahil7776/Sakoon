"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";

export default function NavigationLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      const link = event.target.closest("a");

      if (!link) return;

      const url = new URL(link.href);

      if (
        url.origin === window.location.origin &&
        url.pathname !== window.location.pathname &&
        !link.target &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.shiftKey &&
        !event.altKey &&
        !event.defaultPrevented
      ) {
        setLoading(true);
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  if (!loading) return null;

  return <Loader text="Loading page..." />;
}