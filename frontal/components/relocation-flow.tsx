import { gql, useQuery } from "@apollo/client";
import "@xyflow/react/dist/style.css";
import React, { useEffect, useMemo } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useEdgesState,
  useNodesState,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
} from "@xyflow/react";
import ELK from "elkjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "./ui/dialog";
import mix from "mix-color";
import { contrastColor } from "contrast-color";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ShardTable } from "./shard-table";
import { RelocatingTable } from "./relocating-table";
import { NodeInfo } from "./node-info";

// Define types for the data structures
interface NodeAttribute {
  key: string;
  value: string;
}

interface NodeData {
  name: string;
  attributes: [NodeAttribute];
}

interface NodesQueryData {
  nodes: {
    nodes: NodeData[];
  };
}

interface RelocatingItem {
  index: number;
  node: string;
}

interface RelocatingQueryData {
  relocating: RelocatingItem[];
}

interface Config {
  colorscheme: keyof typeof colorScheme;
  flow: {
    node: {
      colorAttribute: string;
      attributes: string[];
    };
    edge: {
      attributes: string[];
    };
  };
}

const colorScheme = {
  neon: ["#071952", "#0B666A", "#35A29F", "#97FEED"],
  pastel: ["#FFB6C1", "#FFD700", "#FFA07A", "#FF69B4", "#FF6347", "#FF4500"],
  dark: ["#8B0000", "#006400", "#00008B", "#8B008B", "#008B8B", "#8B8B00"],
};

const GET_RELOCATING = gql`
  query relocating {
    relocating {
      index
      node
    }
  }
`;

const GET_NODES = gql`
  query nodes {
    nodes {
      nodes {
        name
        attributes {
          key
          value
        }
      }
    }
  }
`;

const GET_CONFIG = gql`
  query config {
    config {
      colorscheme
      flow {
        node {
          colorAttribute
          attributes
        }
        edge {
          attributes
        }
      }
    }
  }
`;

function generateColors(nodesData: NodesQueryData, config: Config) {
  const attributeTypes = new Set<string>();
  nodesData.nodes.nodes.forEach((node) => {
    const attribute: NodeAttribute | undefined = node.attributes.find(
      (attr) => {
        return attr.key === config.flow.node.colorAttribute;
      },
    );
    attributeTypes.add(attribute?.value || "");

    const edgeAttributes = node.attributes.filter((attr) =>
      config.flow.edge.attributes.includes(attr.key),
    );
    edgeAttributes.forEach((attr) => {
      attributeTypes.add(attr.key);
    });
  });

  const colors = new Map<string, string>();
  const palette: string[] = colorScheme[config.colorscheme];
  if (!palette) {
    throw new Error(`Unknown color scheme: ${config.colorscheme}`);
  }

  let i = 0;
  attributeTypes.forEach((type) => {
    colors.set(type, palette[i % palette.length]);
    i++;
  });

  return colors;
}

function transformData(
  relocationData: RelocatingQueryData,
  nodesData: NodesQueryData,
  config: Config,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const colors = generateColors(nodesData, config);
  const nodeMap = new Map<string, string>();

  relocationData.relocating.forEach((item) => {
    if (!item.node) {
      return;
    }
    const [source, target] = item.node.split(" -> ");
    if (!source || !target) {
      return;
    }
    const sourceId = source.trim();
    const targetId = target.split(" ").reverse()[0].trim();

    const sourceNode = nodesData.nodes.nodes.find(
      (node) => node.name === sourceId,
    );
    const targetNode = nodesData.nodes.nodes.find(
      (node) => node.name === targetId,
    );

    if (!targetNode || !sourceNode) {
      return;
    }
    const sourceAttributeType = sourceNode.attributes.find(
      (attr) => attr.key === config.flow.node.colorAttribute,
    )?.value;
    const targetAttributeType = targetNode.attributes.find(
      (attr) => attr.key === config.flow.node.colorAttribute,
    )?.value;

    const sourceAttributes = sourceNode.attributes.filter((attr) =>
      config.flow.node.attributes.includes(attr.key),
    );
    const targetAttributes = targetNode.attributes.filter((attr) =>
      config.flow.node.attributes.includes(attr.key),
    );

    const sourceEdgeAttributes = sourceNode.attributes.filter((attr) =>
      config.flow.edge.attributes.includes(attr.key),
    );
    const targetEdgeAttributes = targetNode.attributes.filter((attr) =>
      config.flow.edge.attributes.includes(attr.key),
    );

    // Diff the edge attributes and see if they're different
    const edgeAttributes = sourceEdgeAttributes.filter((attr) => {
      const targetAttr = targetEdgeAttributes.find(
        (tAttr) => tAttr.key === attr.key,
      );
      return targetAttr && targetAttr.value !== attr.value;
    });

    if (!nodeMap.has(sourceId)) {
      nodeMap.set(sourceId, `Node ${sourceId}`);
      nodes.push({
        id: sourceId,
        type: "machine",
        position: { x: 0, y: nodes.length * 100 },
        data: {
          label: sourceId,
          attributes: sourceAttributes,
          node: sourceNode,
          relocation: item
        },
        style: {
          color: contrastColor({
            bgColor: colors.get(sourceAttributeType || ""),
          }),
          backgroundColor: colors.get(sourceAttributeType || ""),
        },
      });
    }

    if (!nodeMap.has(targetId)) {
      nodeMap.set(targetId, `Node ${targetId}`);
      nodes.push({
        id: targetId,
        type: "machine",
        position: { x: 100, y: nodes.length * 100 },
        data: {
          label: targetId,
          attributes: targetAttributes,
          node: targetNode,
          relocation: item
        },
        style: {
          color: contrastColor({
            bgColor: colors.get(targetAttributeType || ""),
          }),
          backgroundColor: colors.get(targetAttributeType || ""),
        },
      });
    }

    // Set color of edge based on whether the edge attributes are different
    let edgeColor;
    if (edgeAttributes.length == 1) {
      edgeColor = colors.get(edgeAttributes[0].value);
    } else if (edgeAttributes.length > 1) {
      // blend colors
      edgeColor = edgeAttributes
        .map((attr) => colors.get(attr.key))
        .reduce((acc, color) => {
          if (!acc) {
            return color;
          }
          return mix(acc, color, 0.5);
        });
    } else {
      edgeColor = "black";
    }

    edges.push({
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      animated: true,
      style: {
        stroke: edgeColor,
        strokeWidth: 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });
  });

  return { nodes, edges };
}

const layoutGraph = async (nodes: any, edges: Edge[], config: Config) => {
  const elk = new ELK();

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
    },
    children: nodes.map((node: any) => ({
      id: node.id,
      width: 200,
      height: 50 + 50 * config.flow.node.attributes.length,
    })),
    edges: edges.map((edge: Edge) => ({
      id: `${edge.source}-${edge.target}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);

  nodes.forEach((node: any) => {
    const layoutNode = layout.children?.find((n) => n.id === node.id);
    if (layoutNode) {
      node.position = { x: layoutNode.x || 0, y: layoutNode.y || 0 };
    }
  });

  return nodes;
};

const MachineNode: React.FC<{ data: any }> = ({ data }) => {
  return (
    <Dialog>
      <DialogTrigger>
        <div className="flex flex-col items-center justify-center p-2 shadow-md">
          {data.label}
          {data.attributes.map((attr: NodeAttribute) => (
            <div key={attr.key} className="text-xs text-gray-500">
              {attr.key}: {attr.value}
            </div>
          ))}
          <Handle
            style={{ opacity: 0 }}
            type="source"
            position={Position.Bottom}
          />
          <Handle
            style={{ opacity: 0 }}
            type="target"
            position={Position.Top}
          />
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <span className="text-lg font-bold">{data.label}</span>
        </DialogHeader>
        <Tabs defaultValue="node">
          <TabsList>
            <TabsTrigger value="node">Node</TabsTrigger>
            <TabsTrigger value="shard">Shard</TabsTrigger>
          </TabsList>
          <TabsContent value="node">
            <NodeInfo node={data.node.name} />
          </TabsContent>
          <TabsContent value="shard">
            <RelocatingTable filter={data.relocation.index} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface FlowChartProps {
  nodes: Node[];
  edges: Edge[];
  config: Config;
}

const FlowChart: React.FC<FlowChartProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  config: config,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const layout = async () => {
      const laidOutNodes = await layoutGraph(
        initialNodes,
        initialEdges,
        config,
      );
      setNodes(laidOutNodes);
    };
    layout();
  }, [initialNodes, initialEdges]);

  const onConnect = (params: any) => setEdges((eds) => [...eds, params]);

  const nodeTypes = useMemo(
    () => ({
      machine: MachineNode,
    }),
    [],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
      nodeTypes={nodeTypes}
    >
      <MiniMap />
      <Controls />
      <Background variant={BackgroundVariant.Dots} />
    </ReactFlow>
  );
};

export function RelocationFlow() {
  const { data: relocationData, loading: relocationLoading } =
    useQuery<RelocatingQueryData>(GET_RELOCATING);
  const { data: nodesData, loading: nodesLoading } =
    useQuery<NodesQueryData>(GET_NODES);
  const { data: config, loading: configLoading } = useQuery(GET_CONFIG);

  if (relocationLoading || nodesLoading || configLoading) {
    return <>Loading...</>;
  }

  const { nodes, edges } = transformData(
    relocationData as RelocatingQueryData,
    nodesData as NodesQueryData,
    config.config,
  );

  return (
    <div className="w-full h-full aspect-square">
      <FlowChart nodes={nodes} edges={edges} config={config.config} />
    </div>
  );
}
