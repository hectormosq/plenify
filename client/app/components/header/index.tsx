import Link from "next/link";
import classes from "./header.module.css"

export default function Header() {
  return (
    <header className={classes.header}>
      <nav className={classes.nav}>
        <ul >
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
    </header>
  );
}
