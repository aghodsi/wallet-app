import { useEffect, useState } from "react";

const getOperatingSystem = () => {
  const userAgent = window.navigator.userAgent;

  if (userAgent.indexOf("Mac") !== -1) {
    return "Mac";
  } else if (userAgent.indexOf("Win") !== -1) {
    return "Windows";
  } else if (userAgent.indexOf("Linux") !== -1) {
    return "Linux";
  } else {
    return "Unknown";
  }
};

export function useIsMac() {
  const [os, setOs] = useState<string>("Unknown");

  useEffect(() => {
    // Set OS on client side to avoid SSR issues
    setOs(getOperatingSystem());
  }, []);

  return os === "Mac";
}
