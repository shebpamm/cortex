import { gql, useQuery } from "@apollo/client";
const GET_RELOCATING = gql`
  query relocating {
    relocating {
      store
    }
  }
`;
import { CartesianGrid, XAxis, Bar, BarChart, Line, LineChart } from "recharts";
import {
  ChartTooltipContent,
  ChartTooltip,
  ChartContainer,
} from "@/components/ui/chart";
import { parseSize } from "@/lib/utils";

function BarchartChart(props: any) {
  return (
    <div {...props}>
      <ChartContainer
        config={{
          desktop: {
            label: "Desktop",
            color: "hsl(var(--chart-1))",
          },
        }}
        className="min-h-[300px]"
      >
        <BarChart accessibilityLayer data={props.data}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="size"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="count" radius={8} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export function RelocatingHistogram() {
  const { data, loading } = useQuery(GET_RELOCATING);

  if (loading) {
    return <div>Loading...</div>;
  }

  const filteredData = data.relocating.filter((item: any) => item.store !== null);

  // Step 2: Convert store values to numbers
  const sizesInGb = filteredData.map((item: any) => parseSize(item.store) / 1024 / 1024 / 1024);

  // Step 3: Create bins for the histogram
  const bins = Array(5).fill(0); // 0-10GB, 10-20GB, 20-30GB, 30-40GB, 40-50GB

  // Step 4: Count the number of entries in each bin
  sizesInGb.forEach((size: number) => {
    if (size >= 0 && size < 10) bins[0]++;
    else if (size >= 10 && size < 20) bins[1]++;
    else if (size >= 20 && size < 30) bins[2]++;
    else if (size >= 30 && size < 40) bins[3]++;
    else if (size >= 40 && size < 50) bins[4]++;
  });

  // Step 5: Create the histogram data
  const histogramData = bins.map((count, index) => ({
    size: `${index * 10} - ${index * 10 + 10} GB`,
    count,
  }));

  return (
    <div className="overflow-auto border rounded-lg">
      <BarchartChart data={histogramData} className="aspect-[16/9]" />
    </div>
  );
}
