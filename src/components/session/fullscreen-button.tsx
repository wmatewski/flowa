"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export const FullscreenButton = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    handleChange();
    document.addEventListener("fullscreenchange", handleChange);

    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const handleClick = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await document.documentElement.requestFullscreen();
  };

  return (
    <Button
      aria-label={isFullscreen ? "Wyłącz pełny ekran" : "Włącz pełny ekran"}
      className="wf-live-fullscreen-btn"
      size="icon"
      type="button"
      variant="secondary"
      onClick={handleClick}
    >
      {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
    </Button>
  );
};
