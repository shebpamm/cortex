import { gql, useQuery } from "@apollo/client";
import prettyBytes from "pretty-bytes";

const GET_NODES = gql`
  query nodes {
    nodes {
      nodes {
        name
        ip
        attributes {
          key
          value
        }
        fs {
          total {
            totalInBytes
            freeInBytes
            availableInBytes
          }
        }
        process {
          cpu {
            percent
          }
        }
        os {
          mem {
            totalInBytes
            freeInBytes
            usedInBytes
            usedPercent
          }
        }
      }
    }
  }
`;

export function NodeInfo(props: { node: string }) {
  const { data, loading } = useQuery(GET_NODES);

  if (loading) {
    return <p>Loading...</p>;
  }

  const node = data.nodes.nodes.find((node: any) => node.name === props.node);

  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-[150px_1fr] items-center gap-4">
        <p className="font-medium">Node Name:</p>
        <p>{node.name}</p>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-4">
        <p className="font-medium">IP Address:</p>
        <p>{node.ip}</p>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-4">
        <p className="font-medium">Total Disk Space:</p>
        <p>{prettyBytes(parseInt(node.fs.total.totalInBytes))}</p>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-4">
        <p className="font-medium">Available Disk Space:</p>
        <p>{prettyBytes(parseInt(node.fs.total.availableInBytes))}</p>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-4">
        <p className="font-medium">CPU Usage:</p>
        <p>{node.process.cpu.percent}%</p>
      </div>
      <div className="grid grid-cols-[150px_1fr] items-center gap-4">
        <p className="font-medium">Memory Usage:</p>
        <p>{prettyBytes(parseInt(node.os.mem.usedInBytes))} / {prettyBytes(parseInt(node.os.mem.totalInBytes))}</p>
      </div>
    </div>
  );
}
