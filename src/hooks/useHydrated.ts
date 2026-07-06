import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getClientSnapshot() {
  return true;
}

let isServer = true;
function getServerSnapshot() {
  if (isServer) return false;
  return true;
}

export function useHydrated() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  if (hydrated) isServer = false;
  return hydrated;
}
