"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          try {
            const valueToStore = value instanceof Function ? value(prev) : value;
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            return valueToStore;
          } catch (error: any) {
            console.error(`Error setting localStorage key "${key}":`, error);
            if (error.name === 'QuotaExceededError' ||
              (error.message && error.message.includes('exceeded the quota'))) {
              toast.error("Memoria piena! Impossibile salvare le modifiche. Prova a cancellare i dati o usare immagini più piccole.");
            }
            return prev;
          }
        });
      } catch (error) {
        console.error(`Error updating state for key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}
