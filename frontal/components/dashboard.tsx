/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/UWyg7Tqn8TV
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
import { toTitleCase, parseSize } from "@/lib/utils";
import { Loading } from "@/components/loading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/ui/navbar";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { CartesianGrid, XAxis, Line, LineChart } from "recharts";
import { RecoveryTable } from "@/components/recovery-table";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
} from "@/components/ui/chart";
import { useState, useEffect } from "react";
import { ClusterInfo } from "../../parietal/bindings/ClusterInfo";
import { IndexInfo } from "../../parietal/bindings/IndexInfo";

import { ColumnDef } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function DatabaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

export function Dashboard() {
  const [clusterInfo, setClusterInfo] = useState<ClusterInfo>();
  const [indices, setIndices] = useState<IndexInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const health = fetch("http://localhost:3030/elastic/health")
      .then((response) => response.json())
      .then((data) => {
        setClusterInfo(data);
      });

    const indices = fetch("http://localhost:3030/elastic/indices")
      .then((response) => response.json())
      .then((data) => {
        setIndices(data);
      });

    Promise.all([health, indices]).then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (!clusterInfo) {
    return <div>Error loading cluster data</div>;
  }

  if (!indices) {
    return <div>Error loading indices</div>;
  }

  const columns: ColumnDef<IndexInfo>[] = [
    {
      accessorKey: "index",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Index
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <Badge variant="outline">{row.original.status}</Badge>,
    },
    {
      accessorKey: "health",
      header: "Health",
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
      accessorKey: "docs_count",
      header: "Documents",
    },
    {
      accessorKey: "store_size",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="text-left"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Store Size
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      sortingFn: (a, b, direction) => {
        const sizeA = parseSize(a.original.store_size);
        const sizeB = parseSize(b.original.store_size);

        if (direction === "asc") {
          return sizeA - sizeB;
        } else {
          return sizeB - sizeA;
        }
      },
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar title={toTitleCase(clusterInfo.cluster_name)} />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <StatCard
          title="Cluster Health"
          elements={[
            {
              value: (
                <DatabaseIcon
                  className={`w-8 h-8 text-${clusterInfo.status}-500`}
                />
              ),
              label: toTitleCase(clusterInfo.status),
            },
            {
              value: clusterInfo.number_of_nodes.toString(),
              label: "Nodes",
            },
            {
              value: clusterInfo.number_of_data_nodes.toString(),
              label: "Data Nodes",
            },
          ]}
        />
        <Dialog>
          <DialogTrigger>
            <StatCard
              title="Shard Health"
              elements={[
                {
                  value: clusterInfo.initializing_shards.toString(),
                  label: "Initializing",
                },
                {
                  value: clusterInfo.relocating_shards.toString(),
                  label: "Relocating",
                },
                {
                  value: clusterInfo.unassigned_shards.toString(),
                  label: "Unassigned",
                },
              ]}
            />
          </DialogTrigger>
          <DialogContent className={"lg:max-w-screen-lg overflow-y-hide max-h-screen"}>
            <DialogHeader>
              <DialogTitle>Shard Health</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              <RecoveryTable />
            </DialogDescription>
          </DialogContent>
        </Dialog>
        <StatCard
          title="Shard Stats"
          elements={[
            {
              value: clusterInfo.active_shards.toString(),
              label: "Active Shards",
            },
            {
              value: clusterInfo.number_of_pending_tasks.toString(),
              label: (
                <>
                  <br />
                  Tasks
                </>
              ),
            },
            {
              value:
                clusterInfo.active_shards_percent_as_number.toFixed(0) + "%",
              label: "Active Shards %",
            },
          ]}
        />

        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Indices</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={indices} />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Node Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Node</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CPU</TableHead>
                  <TableHead>Memory</TableHead>
                  <TableHead>Disk</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>es-node-1</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-500 text-green-50"
                    >
                      Online
                    </Badge>
                  </TableCell>
                  <TableCell>60%</TableCell>
                  <TableCell>32 GB</TableCell>
                  <TableCell>500 GB</TableCell>
                  <TableCell>12h 34m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>es-node-2</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-500 text-green-50"
                    >
                      Online
                    </Badge>
                  </TableCell>
                  <TableCell>70%</TableCell>
                  <TableCell>32 GB</TableCell>
                  <TableCell>500 GB</TableCell>
                  <TableCell>11h 22m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>es-node-3</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-yellow-500 text-yellow-50"
                    >
                      Offline
                    </Badge>
                  </TableCell>
                  <TableCell>80%</TableCell>
                  <TableCell>32 GB</TableCell>
                  <TableCell>500 GB</TableCell>
                  <TableCell>9h 45m</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Query Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <LinechartChart className="aspect-[9/4]" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function LinechartChart(props) {
  return (
    <div {...props}>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
          },
        }}
      >
        <LineChart
          accessibilityLayer
          data={[
            { month: "January", desktop: 186 },
            { month: "February", desktop: 305 },
            { month: "March", desktop: 237 },
            { month: "April", desktop: 73 },
            { month: "May", desktop: 209 },
            { month: "June", desktop: 214 },
          ]}
          margin={{
            left: 12,
            right: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Line
            dataKey="desktop"
            type="natural"
            stroke="var(--color-desktop)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
