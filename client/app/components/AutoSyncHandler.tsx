"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { plenifyService } from "../services/index";
import { driveService } from "../services/driveService";

const DEBOUNCE_MS = 10000; // 10 seconds debounce

export default function AutoSyncHandler() {
  const { data: session } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const performSync = async (accessToken: string) => {
    try {
      console.log("[AutoSync] Starting background sync...");
      // 1. Find existing file to get ID and Metadata
      const file = await driveService.findBackupFile(accessToken);
      
      // 2. Safety Check: Optimistic Locking
      if (file) {
          const remoteVersion = parseInt(file.appProperties?.lastUpdated || "0");
          const localAnchor = plenifyService.getSetting("lastSyncedRemoteVersion") || 0;

          if (remoteVersion > localAnchor) {
              console.warn("[AutoSync] CONFLICT DETECTED: Cloud has newer changes. Aborting auto-sync.");
              // TODO: Notify user? They will see "Cloud Newer" in Profile page next time they look.
              return; 
          }
      }
      
      // 3. Upload
      await driveService.uploadBackup(accessToken, file?.id);
      console.log("[AutoSync] Sync completed successfully.");
    } catch (error) {
      console.error("[AutoSync] Failed:", error);
    }
  };

  useEffect(() => {
    if (!session?.accessToken) return;

    // Listener for TinyBase changes
    const listenerId = plenifyService.store.addTablesListener(() => {
        const isAutoSyncEnabled = plenifyService.getSetting("autoSync");
        
        if (!isAutoSyncEnabled) {
            return;
        }

        console.log("[AutoSync] Change detected, scheduling sync...");
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            if (session?.accessToken) {
                performSync(session.accessToken);
            }
        }, DEBOUNCE_MS);
    });

    return () => {
        plenifyService.store.delListener(listenerId);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };
  }, [session?.accessToken]);

  return null; // Renderless component
}
