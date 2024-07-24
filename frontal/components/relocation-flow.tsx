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
import { Dialog } from "./ui/dialog";

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

const colorScheme = {
  neon: ["#FFFF80", "#FFAA80", "#FF5580", "#FF0080"],
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
      nodeColorAttribute
      colorscheme
    }
  }
`;

function generateColors(
  nodesData: NodesQueryData,
  attrName: string,
  colorSchemeName: keyof typeof colorScheme,
) {
  const attributeTypes = new Set<string>();
  nodesData.nodes.nodes.forEach((node) => {
    const attribute: NodeAttribute | undefined = node.attributes.find(
      (attr) => {
        return attr.key === attrName;
      },
    );
    attributeTypes.add(attribute?.value || "");
  });

  const colors = new Map<string, string>();
  const palette: string[] = colorScheme[colorSchemeName];
  if (!palette) {
    throw new Error(`Unknown color scheme: ${colorSchemeName}`);
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
  attribute: string,
  colorSchemeName: keyof typeof colorScheme,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const colors = generateColors(nodesData, attribute, colorSchemeName);
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
    const sourceAttributeType = nodesData.nodes.nodes
      .find((node) => node.name === sourceId)
      ?.attributes.find((attr) => attr.key === attribute)?.value;
    const targetAttributeType = nodesData.nodes.nodes
      .find((node) => node.name === targetId)
      ?.attributes.find((attr) => attr.key === attribute)?.value;

    if (!nodeMap.has(sourceId)) {
      nodeMap.set(sourceId, `Node ${sourceId}`);
      nodes.push({
        id: sourceId,
        type: "machine",
        position: { x: 0, y: nodes.length * 100 },
        data: { label: sourceId },
        style: {
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
        data: { label: targetId },
        style: {
          backgroundColor: colors.get(targetAttributeType || ""),
        },
      });
    }

    edges.push({
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    });
  });

  return { nodes, edges };
}

const layoutGraph = async (nodes: any, edges: Edge[]) => {
  const elk = new ELK();

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
    },
    children: nodes.map((node: any) => ({
      id: node.id,
      width: 150,
      height: 50,
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
    <div
      className="flex flex-col items-center justify-center p-2 shadow-md"
    >
      {data.label}
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
  );
};

interface FlowChartProps {
  nodes: Node[];
  edges: Edge[];
}

const FlowChart: React.FC<FlowChartProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const layout = async () => {
      const laidOutNodes = await layoutGraph(initialNodes, initialEdges);
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
    config.config.nodeColorAttribute,
    config.config.colorscheme,
  );

  return (
    <div className="w-full h-full aspect-square">
      <FlowChart nodes={nodes} edges={edges} />
    </div>
  );
}
