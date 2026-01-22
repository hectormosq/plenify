"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Stack,
  Alert,
  Chip
} from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import GoogleIcon from "@mui/icons-material/Google";

import classes from "./profile.module.scss";
import Card from "../components/Card/Card";
import Button from "../components/buttons/Button";
import TextField from "../components/inputs/TextField";
import Switch from "../components/inputs/Switch";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [passphrase, setPassphrase] = useState("");
  const [isEncrypted, setIsEncrypted] = useState(false); // Placeholder for session state
  const [autoSync, setAutoSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "local_ahead" | "local_behind" | "unknown">("unknown");

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

  const handleSavePassphrase = () => {
    // TODO: Implement passphrase saving logic (Phase 4)
    if (passphrase.length > 0) {
      setIsEncrypted(true);
      alert("Passphrase saved for this session!");
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

      {/* Encryption Settings */}
      <Card
        icon={isEncrypted ? <LockOpenIcon color="success" /> : <LockIcon color="action" />}
        title="Encryption"
        description="Enter a passphrase to secure your data before syncing to the cloud. This passphrase is never stored and must be entered each time you start a new session."
      >
          {!isEncrypted ? (
             <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Encryption Passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button variant="contained" onClick={handleSavePassphrase} disabled={!passphrase}>
                  Unlock
                </Button>
             </Stack>
          ) : (
            <Alert severity="success">
              Session unlocked. Ready to sync.
            </Alert>
          )}
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
                Last Synced: <strong>Never</strong> {/* TODO: dynamic date */}
              </Typography>
        }
      >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} className={classes.actionStack}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              disabled={!isEncrypted}
              fullWidth
            >
              Push to Cloud
            </Button>
            <Button
              variant="outlined"
              startIcon={<CloudDownloadIcon />}
              disabled={!isEncrypted}
              fullWidth
            >
              Pull from Cloud
            </Button>
          </Stack>

          <Divider className={classes.divider} />

          <Switch
            checked={autoSync}
            onChange={(e, checked) => setAutoSync(checked)}
            disabled={!isEncrypted}
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
