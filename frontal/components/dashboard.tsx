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
import Link from "next/link"
import { Loading } from "@/components/loading"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CartesianGrid, XAxis, Line, LineChart } from "recharts"
import { ChartTooltipContent, ChartTooltip, ChartContainer } from "@/components/ui/chart"
import { useState, useEffect } from "react"
import { ClusterInfo } from "../../parietal/bindings/ClusterInfo"

function toTitleCase(str: string) : string {
  return str.replace(
    /\w\S*/g,
    text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
  );
}

export function Dashboard() {
  const [ clusterInfo, setClusterInfo ] = useState<ClusterInfo>()
  const [ loading, setLoading ] = useState(true)

  useEffect(() => {
    fetch("http://localhost:3030/elastic/health")
      .then((response) => response.json())
      .then((data) => {
        setClusterInfo(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <Loading />
  }

  if (!clusterInfo) {
    return <div>Error loading data</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6 flex items-center justify-between">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <img src="/elasticsearch-logo.svg" alt="Elasticsearch" width={32} height={32} />
          <span className="text-lg font-bold">{toTitleCase(clusterInfo.cluster_name)}</span>
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
      </header>
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Cluster Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">
                  <DatabaseIcon className={`w-8 h-8 text-${clusterInfo.status}-500`} />
                </div>
                <div className="text-sm text-muted-foreground">{toTitleCase(clusterInfo.status)}</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.number_of_nodes}</div>
                <div className="text-sm text-muted-foreground">Nodes</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.number_of_data_nodes}</div>
                <div className="text-sm text-muted-foreground">Data Nodes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shard Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.initializing_shards}</div>
                <div className="text-sm text-muted-foreground">Initializing</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.relocating_shards}</div>
                <div className="text-sm text-muted-foreground">Relocating</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.unassigned_shards}</div>
                <div className="text-sm text-muted-foreground">Unassigned</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shard Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.active_shards}</div>
                <div className="text-sm text-muted-foreground">Active Shards</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.active_shards_percent_as_number}%</div>
                <div className="text-sm text-muted-foreground">Active Shards %</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-4xl font-bold">{clusterInfo.number_of_pending_tasks}</div>
                <div className="text-sm text-muted-foreground">Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Indices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Shards</TableHead>
                  <TableHead>Replicas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>products</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-500 text-green-50">
                      Green
                    </Badge>
                  </TableCell>
                  <TableCell>1,234,567</TableCell>
                  <TableCell>12.3 GB</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>users</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-500 text-yellow-50">
                      Yellow
                    </Badge>
                  </TableCell>
                  <TableCell>456,789</TableCell>
                  <TableCell>3.4 GB</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>1</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>logs</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-500 text-red-50">
                      Red
                    </Badge>
                  </TableCell>
                  <TableCell>789,012</TableCell>
                  <TableCell>6.7 GB</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>0</TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
                    <Badge variant="outline" className="bg-green-500 text-green-50">
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
                    <Badge variant="outline" className="bg-green-500 text-green-50">
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
                    <Badge variant="outline" className="bg-yellow-500 text-yellow-50">
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
  )
}

function DatabaseIcon(props) {
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
  )
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
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
