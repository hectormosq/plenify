import Link from "next/link";

export default function Header() {
  return (
    <header>
      <nav>
        <ul >
          <li>
            <Link href="/">Main</Link>
          </li>
          <li>
            <Link href="/admin">Add</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
