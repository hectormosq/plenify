"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Stack,
  Alert,
  Chip,
  CircularProgress
} from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import GoogleIcon from "@mui/icons-material/Google";
import dayjs from "dayjs";

import classes from "./profile.module.scss";
import Card from "../components/Card/Card";
import Button from "../components/buttons/Button";
import Switch from "../components/inputs/Switch";

import { driveService, SyncStatus } from "../services/driveService";
import { plenifyService } from "../services/index";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [autoSync, setAutoSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("unknown");
  const [lastSyncedDate, setLastSyncedDate] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checkSyncStatus = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
        const cloudFile = await driveService.findBackupFile(session.accessToken);
        const localLastUpdated = plenifyService.getSetting("lastUpdated") || 0;

        if (!cloudFile) {
            setSyncStatus("local_ahead"); // Assuming we have local data to push
            setLastSyncedDate("Never");
            return;
        }

        const cloudLastUpdated = parseInt(cloudFile.appProperties?.lastUpdated || "0");
        
        // Display nice date from modifiedTime
        if (cloudFile.modifiedTime) {
           setLastSyncedDate(dayjs(cloudFile.modifiedTime).format("DD MMM YYYY HH:mm"));
        }

        if (cloudLastUpdated > localLastUpdated) {
            setSyncStatus("local_behind");
        } else if (localLastUpdated > cloudLastUpdated) {
             setSyncStatus("local_ahead");
        } else {
            setSyncStatus("synced");
        }

    } catch (err) {
        console.error("Failed to check sync status:", err);
        setSyncStatus("unknown");
    }
  }, [session?.accessToken]);

  // Load initial settings and status
  useEffect(() => {
    if (session) {
        checkSyncStatus();
    }
    const savedAutoSync = plenifyService.getSetting("autoSync");
    if (savedAutoSync !== undefined) {
      setAutoSync(savedAutoSync);
    }
  }, [session, checkSyncStatus]);

  const handleAutoSyncChange = (checked: boolean) => {
    setAutoSync(checked);
    plenifyService.setSetting("autoSync", checked);
  };

  if (!session) {
    return (
      <Box className={classes.signInWrapper}>
        <Card 
            title="Sign In Required"
            className={classes.signInCard}
            description="Please sign in with Google to access your profile and cloud sync settings."
        >
            <Button
              variant="contained"
              startIcon={<GoogleIcon />}
              onClick={() => signIn("google")}
              fullWidth
            >
              Sign In with Google
            </Button>
        </Card>
      </Box>
    );
  }

  const handlePushToCloud = async () => {
      if (!session?.accessToken) return;
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
          // 1. Check for existing file
          const existingFile = await driveService.findBackupFile(session.accessToken);
          
          // 2. Safety Check: Optimistic Locking
          if (existingFile) {
             const remoteVersion = parseInt(existingFile.appProperties?.lastUpdated || "0");
             const localAnchor = plenifyService.getSetting("lastSyncedRemoteVersion") || 0;

             if (remoteVersion > localAnchor) {
                 throw new Error("Cloud has newer changes. Please pull from cloud first.");
             }
          }

          // 3. Upload (Create or Update)
          await driveService.uploadBackup(session.accessToken, existingFile?.id);
          
          await checkSyncStatus(); // Refresh status
          setSuccessMsg("Successfully pushed data to Google Drive.");
      } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to push to cloud.");
      } finally {
          setLoading(false);
      }
  };

  const handlePullFromCloud = async () => {
      if (!session?.accessToken) return;
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      try {
          // 1. Check for existing file
          const existingFile = await driveService.findBackupFile(session.accessToken);
          
          if (!existingFile) {
              throw new Error("No backup file found on Google Drive.");
          }

          // 2. Download and Restore
          await driveService.downloadBackup(session.accessToken, existingFile.id);
          
          await checkSyncStatus(); // Refresh status
          setSuccessMsg("Successfully pulled and restored data from Google Drive.");
      } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to pull from cloud.");
      } finally {
          setLoading(false);
      }
  };

  const getStatusLabel = (status: SyncStatus) => {
      switch (status) {
          case "synced": return "Synced";
          case "local_ahead": return "Local Changes (Push Needed)";
          case "local_behind": return "Cloud Newer (Pull Needed)";
          default: return "Unknown";
      }
  }

  const getStatusColor = (status: SyncStatus) => {
      switch (status) {
          case "synced": return "success";
          case "local_ahead": 
          case "local_behind": return "warning";
          default: return "default";
      }
  }

  return (
    <Box className={classes.container}>
      <Typography variant="h4" gutterBottom className={classes.title}>
        User Profile
      </Typography>

      {/* User Info Card */}
      <Card
        icon={
            <Avatar
              src={session.user?.image || undefined}
              alt={session.user?.name || "User"}
              sx={{ width: 64, height: 64 }}
            />
        }
        title={
            <Box>
              <Typography variant="h6">{session.user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {session.user?.email}
              </Typography>
            </Box>
        }
      >
          <Button variant="outlined" color="error" size="small" onClick={() => signOut()}>
            Sign Out
          </Button>
      </Card>

      {/* Cloud Sync Status */}
      <Card
        icon={<CloudIcon color="primary" />}
        title="Cloud Sync"
        action={
             <Chip 
                label={getStatusLabel(syncStatus)} 
                color={getStatusColor(syncStatus) as any} 
                variant="outlined" 
                size="small" 
             />
        }
        description={
            <Typography variant="body2" sx={{ mb: 1 }}>
                Backup your data to Google Drive to access it from other devices or restore it later.
                <br/>
                {lastSyncedDate && (
                    <Typography component="span" variant="caption" color="text.secondary">
                        Last Synced: <strong>{lastSyncedDate}</strong>
                    </Typography>
                )}
            </Typography>
        }
      >
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className={classes.actionStack}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <CloudUploadIcon />}
              onClick={handlePushToCloud}
              disabled={loading} // || syncStatus === 'synced' ? maybe not, allow force push
              fullWidth
            >
              {loading ? "Syncing..." : "Push to Cloud"}
            </Button>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <CloudDownloadIcon />}
              onClick={handlePullFromCloud}
              disabled={loading} // || syncStatus === 'synced'
              fullWidth
            >
              {loading ? "Syncing..." : "Pull from Cloud"}
            </Button>
          </Stack>

          <Divider className={classes.divider} />

          <Switch
            checked={autoSync}
            onChange={(e, checked) => handleAutoSyncChange(checked)}
            label={
              <Box>
                <Typography variant="body1">Enable Auto-Sync</Typography>
                <Typography variant="caption" color="text.secondary">
                  Automatically upload changes when online
                </Typography>
              </Box>
            }
          />
      </Card>
    </Box>
  );
}
