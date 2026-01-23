"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
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
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load initial settings
  useEffect(() => {
    const savedAutoSync = plenifyService.getSetting("autoSync");
    if (savedAutoSync !== undefined) {
      setAutoSync(savedAutoSync);
    }
  }, []);

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
          
          // 2. Upload (Create or Update)
          await driveService.uploadBackup(session.accessToken, existingFile?.id);
          
          setSyncStatus("synced");
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
          
          setSyncStatus("synced");
          setSuccessMsg("Successfully pulled and restored data from Google Drive.");
      } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to pull from cloud.");
      } finally {
          setLoading(false);
      }
  };

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
                label={syncStatus === "unknown" ? "Unknown Status" : syncStatus.replace("_", " ").toUpperCase()} 
                color={syncStatus === "synced" ? "success" : "warning"} 
                variant="outlined" 
                size="small" 
             />
        }
        description={
            <Typography variant="body2" sx={{ mb: 1 }}>
                Backup your data to Google Drive to access it from other devices or restore it later.
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
              disabled={loading}
              fullWidth
            >
              {loading ? "Syncing..." : "Push to Cloud"}
            </Button>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} color="inherit"/> : <CloudDownloadIcon />}
              onClick={handlePullFromCloud}
              disabled={loading}
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
