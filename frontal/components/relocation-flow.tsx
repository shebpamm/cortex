import { gql, useQuery } from "@apollo/client";
import "@xyflow/react/dist/style.css";
import React from "react";
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
} from "@xyflow/react";
import dagre from "dagre";

// Define types for the data structures
interface NodeAttributes {
  storageType?: string;
}

interface NodeData {
  name: string;
  attributes: NodeAttributes;
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

const colorPreset = [
  "#9B59F6",
  "#9E81F6",
  "#A2AAF6",
  "#A5D2F5",
  "#A8FAF5",
];

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
          storageType
        }
      }
    }
  }
`;

function generateColors(nodesData: NodesQueryData) {
  const storageTypes = new Set<string>();
  nodesData.nodes.nodes.forEach((node) => {
    storageTypes.add(node.attributes?.storageType || "");
  });

  const colors = new Map<string, string>();
  let i = 0;
  storageTypes.forEach((type) => {
    colors.set(type, colorPreset[i % colorPreset.length]);
    i++;
  });

  return colors;
}

function transformData(
  relocationData: RelocatingQueryData,
  nodesData: NodesQueryData,
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const colors = generateColors(nodesData);
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
    const sourceStorageType = nodesData.nodes.nodes.find(
      (node) => node.name === sourceId,
    )?.attributes.storageType;
    const targetStorageType = nodesData.nodes.nodes.find(
      (node) => node.name === targetId,
    )?.attributes.storageType;

    if (!nodeMap.has(sourceId)) {
      nodeMap.set(sourceId, `Node ${sourceId}`);
      nodes.push({
        id: sourceId,
        position: { x: 0, y: nodes.length * 100 },
        data: { label: sourceId },
        style: {
          backgroundColor: colors.get(sourceStorageType || ""),
        },
      });
    }

    if (!nodeMap.has(targetId)) {
      nodeMap.set(targetId, `Node ${targetId}`);
      nodes.push({
        id: targetId,
        position: { x: 100, y: nodes.length * 100 },
        data: { label: targetId },
        style: {
          backgroundColor: colors.get(targetStorageType || ""),
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

const layoutGraph = (nodes: any, edges: Edge[]) => {
  const g = new dagre.graphlib.Graph();

  g.setGraph({ rankdir: "LR" });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node: any) => {
    g.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  nodes.forEach((node : any) => {
    const { x, y } = g.node(node.id);
    node.position = { x: x || 0, y: y || 0 };
  });

  return nodes;
};

interface FlowChartProps {
  nodes: Node[];
  edges: Edge[];
}

const FlowChart: React.FC<FlowChartProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
}) => {
  const [nodes, _, onNodesChange] = useNodesState(
    layoutGraph(initialNodes, initialEdges),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = (params: any) => setEdges((eds) => [...eds, params]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
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

  if (relocationLoading || nodesLoading) {
    return <>Loading...</>;
  }

  const { nodes, edges } = transformData(
    relocationData as RelocatingQueryData,
    nodesData as NodesQueryData,
  );

  return (
    <div className="w-full h-full aspect-square">
      <FlowChart nodes={nodes} edges={edges} />
    </div>
  );
}
