"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, gql } from "@apollo/client";
import { IndexInfo } from "../../../parietal/bindings/IndexInfo";
import { Badge } from "./badge";
import { parseSize } from "@/lib/utils";

interface Data {
  indices: Index[];
}

interface Index {
  index: string;
  status: string;
  health: string;
  docsCount: number;
  storeSize: string;
}

const columns: ColumnDef<Index>[] = [
  {
    accessorKey: "index",
    header: wrapSortable.bind(null, "Index"),
  },
  {
    accessorKey: "status",
    header: wrapSortable.bind(null, "Status"),
    cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
  },
  {
    accessorKey: "health",
    header: wrapSortable.bind(null, "Health"),
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={`bg-${row.original.health}-500 text-${row.original.health}-50`}
      >
        {row.original.health}
      </Badge>
    ),
  },
  {
    accessorKey: "docsCount",
    header: wrapSortable.bind(null, "Docs Count"),
  },
  {
    accessorKey: "storeSize",
    header: wrapSortable.bind(null, "Store Size"),
    sortingFn: (a, b, direction) => {
      const sizeA = parseSize(a.original.storeSize);
      const sizeB = parseSize(b.original.storeSize);

      if (direction === "asc") {
        return sizeA - sizeB;
      } else {
        return sizeB - sizeA;
      }
    },
  },
];

const GET_INDICES = gql`
  query GetIndices {
    indices {
      index
      status
      health
      docsCount
      storeSize
    }
  }
`;

export function wrapSortable(cell: React.ReactNode | string, { column }: any) {
  return (
    <Button
      variant="ghost"
      className="text-left"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {cell}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
}

export function DataTable() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { loading, error, data } = useQuery<Data>(GET_INDICES);

  const indices = data ? data.indices : [];

  const table = useReactTable({
    data: indices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
