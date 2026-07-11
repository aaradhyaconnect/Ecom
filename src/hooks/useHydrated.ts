import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function useHydrated() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  return hydrated;
}
