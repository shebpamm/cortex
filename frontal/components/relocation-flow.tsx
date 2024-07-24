import { gql, useQuery } from "@apollo/client";
import "@xyflow/react/dist/style.css";
import React, { useEffect } from "react";
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
import ELK from 'elkjs';

// Define types for the data structures
interface NodeAttribute {
  key: String,
  value: String
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
          key
          value
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

const layoutGraph = async (nodes: any, edges: Edge[]) => {
  const elk = new ELK();

  const graph = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN"
    },
    children: nodes.map((node: any) => ({
      id: node.id,
      width: 150,
      height: 50
    })),
    edges: edges.map((edge: Edge) => ({
      id: `${edge.source}-${edge.target}`,
      sources: [edge.source],
      targets: [edge.target]
    }))
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
