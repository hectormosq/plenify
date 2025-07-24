import Link from "next/link";
import classes from "./header.module.scss";
import { useState } from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { Box, Divider, Drawer, IconButton } from "@mui/material";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
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

      <Box sx={{ display: { xs: "none", sm: "flex" }, justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
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
      </Box>
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
          </div>
        </Drawer>
      </nav>
    </header>
  );
}
