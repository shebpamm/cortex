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
import { useQuery, gql } from "@apollo/client";
import { toTitleCase } from "@/lib/utils";
import { Loading } from "@/components/loading";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CartesianGrid, XAxis, Line, LineChart } from "recharts";
import { RecoveryTable } from "@/components/recovery-table";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
} from "@/components/ui/chart";

import { RelocatingTable } from "./relocating-table";
import { IndicesTable } from "./indices-table";
import { NodesTable } from "./nodes-table";

import { RelocationFlow } from "./relocation-flow";
import { ShardTable } from "./shard-table";

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


const GET_CLUSTERINFO = gql`
    query GetClusterInfo {
      health {
        clusterName
        status
        numberOfNodes
        numberOfDataNodes
        activeShards
        relocatingShards
        initializingShards
        unassignedShards
        activeShardsPercentAsNumber
        numberOfPendingTasks
      }
    }
`
export function Dashboard() {
  const { loading, error, data: clusterInfo } = useQuery(GET_CLUSTERINFO);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div>Error loading cluster data</div>;
  }


  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <StatCard
          title="Cluster Health"
          elements={[
            {
              value: (
                <DatabaseIcon
                  className={`w-8 h-8 text-${clusterInfo.health.status}-500`}
                />
              ),
              label: toTitleCase(clusterInfo.health.status),
            },
            {
              value: clusterInfo.health.numberOfNodes.toString(),
              label: "Nodes",
            },
            {
              value: clusterInfo.health.numberOfDataNodes.toString(),
              label: "Data Nodes",
            },
          ]}
        />
        <StatCard
          title="Shard Health"
          elements={[
            {
              value: clusterInfo.health.initializingShards.toString(),
              label: "Initializing",
            },
            {
              value: clusterInfo.health.relocatingShards.toString(),
              label: "Relocating",
              dialog: {
                title: "Relocating Shards",
                content: <RelocatingTable />,
              },
            },
            {
              value: clusterInfo.health.unassignedShards.toString(),
              label: "Unassigned",
            },
          ]}
        />
        <StatCard
          title="Shard Stats"
          elements={[
            {
              value: clusterInfo.health.activeShards.toString(),
              label: "Active Shards",
            },
            {
              value: clusterInfo.health.numberOfPendingTasks.toString(),
              label: (
                <>
                  <br />
                  Tasks
                </>
              ),
            },
            {
              value:
                clusterInfo.health.activeShardsPercentAsNumber.toFixed(0) + "%",
              label: "Active Shards %",
            },
          ]}
        />

        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Indices</CardTitle>
          </CardHeader>
          <CardContent>
            <IndicesTable />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recovery</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryTable />
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Node Status</CardTitle>
          </CardHeader>
          <CardContent>
            <NodesTable />     
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Relocation Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <RelocationFlow />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
