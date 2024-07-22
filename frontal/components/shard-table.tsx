import { Progress } from "@/components/ui/progress";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable, wrapSortable } from "./ui/data-table";

import prettyBytes from "pretty-bytes";
import { gql, useQuery } from "@apollo/client";
import { parseSize } from "@/lib/utils";

const GET_SHARDS = gql`
  query shards($index: String) {
    shards(index: $index) {
      shard
      prirep
      node
      state
      store
    }
  }
`;
export function ShardTable(props: { index: string }) {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "shard",
      header: wrapSortable.bind(null, "Shard"),
    },
    {
      accessorKey: "prirep",
      header: wrapSortable.bind(null, "Pri/Rep"),
    },
    {
      accessorKey: "node",
      header: wrapSortable.bind(null, "Node"),
    },
    {
      accessorKey: "state",
      header: wrapSortable.bind(null, "State"),
    },
    {
      accessorKey: "store",
      header: wrapSortable.bind(null, "Size"),
      cell: ({ row }) => {
        return prettyBytes(parseSize(row.original.store));
      },
    },
  ];

  const { data, loading, error } = useQuery(GET_SHARDS, {
    variables: props
  });

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <div>Error</div>;
  }

  return (
    <div className="overflow-auto border rounded-lg">
      <DataTable columns={columns} data={data.shards} />
    </div>
  );
}
