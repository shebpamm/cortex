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

const GET_RELOCATING = gql`
  query relocating {
    relocating {
      index
      node
    }
  }
`;

function transformData(data) {
  const nodes = [];
  const edges = [];

  // Create a map to keep track of node IDs and their labels
  const nodeMap = new Map();

  // Iterate through the data to create nodes and edges
  data.relocating.forEach((item, index) => {
    const [source, target] = item.node.split(" -> ");
    const sourceId = source.trim();
    const targetId = target.split(" ").reverse()[0].trim();

    // Add source node if it doesn't exist
    if (!nodeMap.has(sourceId)) {
      nodeMap.set(sourceId, `Node ${sourceId}`);
      nodes.push({
        id: sourceId,
        position: { x: 0, y: nodes.length * 100 },
        data: { label: sourceId },
      });
    }

    // Add target node if it doesn't exist
    if (!nodeMap.has(targetId)) {
      nodeMap.set(targetId, `Node ${targetId}`);
      nodes.push({
        id: targetId,
        position: { x: 100, y: nodes.length * 100 },
        data: { label: targetId },
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
  const { data, loading } = useQuery(GET_RELOCATING);

  if (loading) {
    return <>Loading...</>;
  }

  console.log(data);

  const { nodes, edges } = transformData(data);

  return (
    <div className="w-full h-full aspect-square">
      <FlowChart nodes={nodes} edges={edges} />
    </div>
  );
}
