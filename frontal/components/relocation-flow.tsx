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
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import dagre from "dagre";

const colorPreset = [
  "#9B59F6",
  "#9E81F6",
  "#A2AAF6",
  "#A5D2F5",
  "#A8FAF5",
]

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

function generateColors(nodesData) {
  const storageTypes = new Set();
  nodesData.nodes.nodes.forEach((node) => {
    storageTypes.add(node.attributes?.storageType);
  });

  const colors = new Map();
  let i = 0;
  storageTypes.forEach((type) => {
    colors.set(type, colorPreset[i % colorPreset.length]);
    i++;
  });

  return colors;
}

function transformData(relocationData, nodesData) {
  const nodes = [];
  const edges = [];


  const colors = generateColors(nodesData);
  // Create a map to keep track of node IDs and their labels
  const nodeMap = new Map();

  // Iterate through the data to create nodes and edges
  relocationData.relocating.forEach((item, index) => {
    const [source, target] = item.node.split(" -> ");
    const sourceId = source.trim();
    const targetId = target.split(" ").reverse()[0].trim();
    const sourceStorageType = nodesData.nodes.nodes.find(
      (node) => node.name === sourceId,
    )?.attributes.storageType;
    const targetStorageType = nodesData.nodes.nodes.find(
      (node) => node.name === targetId,
    )?.attributes.storageType;

    // Add source node if it doesn't exist
    if (!nodeMap.has(sourceId)) {
      nodeMap.set(sourceId, `Node ${sourceId}`);
      nodes.push({
        id: sourceId,
        position: { x: 0, y: nodes.length * 100 },
        data: { label: sourceId },
        style: {
          backgroundColor: colors.get(sourceStorageType),
        },
      });
    }

    // Add target node if it doesn't exist
    if (!nodeMap.has(targetId)) {
      nodeMap.set(targetId, `Node ${targetId}`);
      nodes.push({
        id: targetId,
        position: { x: 100, y: nodes.length * 100 },
        data: { label: targetId },
        style: {
          backgroundColor: colors.get(targetStorageType),
        },
      });
    }

    // Add edge between source and target
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

const layoutGraph = (nodes: Node<CustomNodeData>[], edges: Edge[]) => {
  const g = new dagre.graphlib.Graph();

  g.setGraph({ rankdir: "LR" });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes
  nodes.forEach((node) => {
    g.setNode(node.id, { width: 150, height: 50 });
  });

  // Add edges
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  // Update node positions
  nodes.forEach((node) => {
    const { x, y } = g.node(node.id);
    node.position = { x: x || 0, y: y || 0 };
  });

  return nodes;
};

const FlowChart: React.FC<FlowChartProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
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
    useQuery(GET_RELOCATING);
  const { data: nodesData, loading: nodesLoading } = useQuery(GET_NODES);

  if (relocationLoading || nodesLoading) {
    return <>Loading...</>;
  }

  const { nodes, edges } = transformData(relocationData, nodesData);

  return (
    <div className="w-full h-full aspect-square">
      <FlowChart nodes={nodes} edges={edges} />
    </div>
  );
}
