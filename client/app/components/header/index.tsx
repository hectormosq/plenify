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
            <Link href="/list">Transaction List</Link>
          </li>
          <li>
            <Link href="/admin">Add</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
