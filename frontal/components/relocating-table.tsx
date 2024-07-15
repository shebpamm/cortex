/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/gDj8jGpjaBq
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

/** Add fonts into your Next.js project:

import { Inter } from 'next/font/google'

inter({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, wrapSortable } from "./ui/data-table";

import prettyBytes from "pretty-bytes";
import { parseSize } from "@/lib/utils";
import { gql, useQuery } from "@apollo/client";
import { Button } from "./ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import { RelocatingHistogram } from "./relocating-histogram";

const GET_RELOCATING = gql`
  query relocating {
    relocating {
      index
      shard
      state
      ip
      store
    }
  }
`;

export function RelocatingTable() {
  const { data, loading } = useQuery(GET_RELOCATING);
  const [histogramOpen, setHistogramOpen] = useState(false);

  if (loading) {
    return <Progress />;
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "index",
      header: wrapSortable.bind(null, "Index"),
    },
    {
      accessorKey: "shard",
      header: wrapSortable.bind(null, "Shard"),
    },
    {
      accessorKey: "state",
      header: wrapSortable.bind(null, "State"),
    },
    {
      accessorKey: "ip",
      header: wrapSortable.bind(null, "IP"),
    },
    {
      accessorKey: "store",
      header: wrapSortable.bind(null, "Store"),
      sortingFn: (a, b, direction) => {
        if (!a.original.store || !b.original.store) {
          return 0;
        }
        const sizeA = parseSize(a.original.store);
        const sizeB = parseSize(b.original.store);

        if (direction === "asc") {
          return sizeA - sizeB;
        } else {
          return sizeB - sizeA;
        }
      },
    },
  ];

  return (
    <>
      <Dialog open={histogramOpen} onOpenChange={() => setHistogramOpen(false)}>
        <DialogTrigger></DialogTrigger>
        <DialogContent
          className={"lg:max-w-screen-lg overflow-y-hide max-h-screen"}
        >
          <DialogHeader>Size distribution</DialogHeader>
          <RelocatingHistogram />
        </DialogContent>
      </Dialog>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="overflow-auto border rounded-lg">
            <DataTable columns={columns} data={data.relocating} />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem inset onSelect={() => setHistogramOpen(true)}>
            Size Distribution
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
