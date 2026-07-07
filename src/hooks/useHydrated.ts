import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getClientSnapshot() {
  return true;
}

const isServer = true;
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
  return hydrated;
}
