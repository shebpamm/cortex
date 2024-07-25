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
import TableFilter from "./filter-view";
import { useEffect, useRef, useState } from "react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: any) => void;
}

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

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterViewOpen, setFilterViewOpen] = useState(false);
  const [filterMethod, setFilterMethod] = useState<any>(null);
  const [filteredData, setFilteredData] = useState(data);

  const filterRef = useRef<any>(null);

  // Update filteredData whenever data or filterMethod changes
  useEffect(() => {
    const applyFilter = async () => {
      if (!filterMethod) {
        setFilteredData(data);
        return;
      }

      try {
        const result = await filterMethod(data);
        setFilteredData(result);
      } catch (error) {
        console.error("Error applying filter:", error);
        return;
      }
    };
    applyFilter();
  }, [data, filterMethod]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  function onFilterViewClose(): void {
    setFilterViewOpen(false);
    if (filterRef.current) {
      setFilterMethod(() => filterRef.current.getValue());
    }
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
                onClick={() => onRowClick?.(row)}
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
      <TableFilter
        ref={filterRef}
        open={filterViewOpen}
        onClose={onFilterViewClose}
        sample={data.length ? data[0] : null}
      />
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilterViewOpen(true)}
        >
          Filter...
        </Button>
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
