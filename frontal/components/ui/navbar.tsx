import Link from "next/link";

export interface NavbarProps {
  title: string;
}

export function Navbar(props: NavbarProps) {
  return (<header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
    <Link href="#" className="flex items-center gap-2" prefetch={false}>
      <img
        src="/elasticsearch-logo.svg"
        alt="Elasticsearch"
        width={32}
        height={32}
      />
      <span className="text-lg font-bold">
        {props.title}
      </span>
    </Link>
    <nav className="flex items-center gap-6">
      <Link href="#" className="hover:underline" prefetch={false}>
        Overview
      </Link>
      <Link href="#" className="hover:underline" prefetch={false}>
        Indices
      </Link>
      <Link href="#" className="hover:underline" prefetch={false}>
        Nodes
      </Link>
      <Link href="#" className="hover:underline" prefetch={false}>
        Queries
      </Link>
      <Link href="#" className="hover:underline" prefetch={false}>
        Settings
      </Link>
    </nav>
  </header>)
}
