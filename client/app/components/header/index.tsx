import Link from "next/link";
import classes from "./header.module.scss";
import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { plenifyService } from "../../services";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#1a1f25',
    },
    text: {
      primary: '#ededed',
    }
  },
});

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const open = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownloadDb = () => {
    plenifyService.downloadDb();
    handleMenuClose();
  };

  const handleImportClick = () => {
    handleMenuClose();
    // Trigger hidden input click or open dialog directly
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setImportFile(file);
        setImportDialogOpen(true);
      }
    };
    input.click();
  };

  const handleImportConfirm = async () => {
    if (!importFile) return;
    try {
      const text = await importFile.text();
      await plenifyService.importDb(text);
      setImportDialogOpen(false);
      setImportFile(null);

      alert("Database restored successfully!");

      // Ideally trigger a reload or context refresh if needed, 
      // but TinyBase might reactively update UI if observers are set.
      // However, a hard reload ensures state consistency for now.
      window.location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      alert(error instanceof Error ? error.message : "Failed to import database");
    }
  };

  const handleImportClose = () => {
    setImportDialogOpen(false);
    setImportFile(null);
  };

  return (
    <header className={classes.header}>
      <IconButton
        color="inherit"
        onClick={handleDrawerToggle}
        sx={{ mr: 2, display: { sm: "none" } }}
      >
        <MenuIcon />
      </IconButton>

      <Box
        sx={{
          display: { xs: "none", sm: "flex" },
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Link className={`${classes.mainTitle}`} href="/dashboard">
          Plenify
        </Link>
        <nav className={classes.nav}>
          <ul>
            <li>
              <Link href="/dashboard">Main</Link>
            </li>
            <li>
              <Link href="/transaction-list">List</Link>
            </li>
            <li>
              <Link href="/overview">Overview</Link>
            </li>
            <li>
              <Link href="/admin/add">Add</Link>
            </li>
            <li>
              <Link href="/admin/categories">Categories</Link>
            </li>
            <li>
              <Link href="/admin/upload">Upload</Link>
            </li>
          </ul>
        </nav>
        <Box>
          <IconButton
            onClick={handleMenuClick}
            size="small"
            sx={{ ml: 2 }}
            aria-controls={open ? "account-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
          >
            <SettingsIcon sx={{ color: "white" }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <MenuItem onClick={handleDownloadDb}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Backup / Download DB</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleImportClick}>
              <ListItemIcon>
                <UploadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Import / Restore DB</ListItemText>
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Import Dialog */}
      <ThemeProvider theme={darkTheme}>
        <Dialog open={importDialogOpen} onClose={handleImportClose}>
          <DialogTitle>Restore Database</DialogTitle>
          <DialogContent>
            <DialogContentText>
              You are about to restore data from <strong>{importFile?.name}</strong>.
              <br /><br />
              This action will <strong>REPLACE</strong> all current data on this device with the backup.
              <br />
              Are you sure you want to proceed?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleImportClose}>Cancel</Button>
            <Button onClick={handleImportConfirm} color="error" autoFocus>
              Restore
            </Button>
          </DialogActions>
        </Dialog>
      </ThemeProvider>
      <nav>
        <Drawer
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: "300" },
          }}
        >
          <div className={classes.drawerContainer} onClick={handleDrawerToggle}>
            <Link
              className={`${classes.mainTitle} ${classes.linkItem}`}
              href="/dashboard"
            >
              Plenify
            </Link>
            <Divider />
            <Link className={classes.linkItem} href="/dashboard">
              Main
            </Link>

            <Link className={classes.linkItem} href="/transaction-list">
              List
            </Link>

            <Link className={classes.linkItem} href="/overview">
              Overview
            </Link>

            <Link className={classes.linkItem} href="/admin/add">
              Add
            </Link>

            <Link className={classes.linkItem} href="/admin/categories">
              Categories
            </Link>

            <Link className={classes.linkItem} href="/admin/upload">
              Upload
            </Link>
            <Link
              className={classes.linkItem}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleDownloadDb();
              }}
            >
              Backup DB
            </Link>
            <Link
              className={classes.linkItem}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleImportClick();
              }}
            >
              Import DB
            </Link>
          </div>
        </Drawer>
      </nav>
    </header>
  );
}
