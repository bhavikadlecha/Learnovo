import React, { useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { useParams } from 'react-router-dom'; // ✅ get plan ID from URL

const nodeWidth = 200;
const nodeHeight = 70;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = 'top';
    node.sourcePosition = 'bottom';
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

const flattenRoadmap = (items, acc = [], visited = new Set()) => {
  for (const item of items) {
    const id = item.id?.toString() || item.topic;
    if (!id || visited.has(id)) continue;
    visited.add(id);

    acc.push({
      id,
      label: item.topic,
      prerequisites: (item.prerequisites || []).map((p) => p.toString()),
      estimated_time_minutes: Math.round((item.estimated_time_hours || 0) * 60),
    });

    if (Array.isArray(item.subtopics)) {
      flattenRoadmap(item.subtopics, acc, visited);
    }
  }
  return acc;
};

function RoadmapGraph({ roadmap: passedRoadmap }) {
  const { id } = useParams(); // ✅ grab from URL
  const [roadmap, setRoadmap] = useState(passedRoadmap || null);
  const [loading, setLoading] = useState(!passedRoadmap);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState(() => {
    const stored = localStorage.getItem('nodeStatuses');
    return stored ? JSON.parse(stored) : {};
  });

  // ✅ Fetch roadmap from backend if not passed via state
  useEffect(() => {
    if (!roadmap) {
      setLoading(true);
      fetch(`http://localhost:8000/roadmap/roadmap/get_plan/${id}/`)
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ Fetched roadmap from backend:", data);
          setRoadmap(data);
        })
        .catch((err) => {
          console.error("❌ Failed to fetch roadmap", err);
        })
        .finally(() => setLoading(false));
    }
  }, [id, roadmap]);

  useEffect(() => {
    if (!roadmap || !Array.isArray(roadmap.roadmaps) || roadmap.roadmaps.length === 0) {
      console.warn('❌ Empty or invalid roadmap received:', roadmap);
      return;
    }

    const flat = flattenRoadmap(roadmap.roadmaps);
    console.log('✅ Flattened Roadmap:', flat);

    const topicNodes = flat.map((item) => {
      const status = nodeStatuses[item.id] || 'Not Started';
      let bg = '#3b82f6';
      if (status === 'In Progress') bg = '#f59e0b';
      else if (status === 'Completed') bg = '#10b981';

      return {
        id: item.id,
        data: {
          label: (
            <div onClick={() => handleNodeClick(item)}>
              <div style={{ fontWeight: 'bold' }}>{item.label}</div>
            </div>
          ),
        },
        style: {
          background: bg,
          color: 'white',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '14px',
          border: '1px solid #ddd',
        },
        position: { x: 0, y: 0 },
      };
    });

    const topicEdges = [];
    flat.forEach((item) => {
      if (item.prerequisites.length === 0) return;
      item.prerequisites.forEach((pre) => {
        if (!flat.find((n) => n.id === pre)) {
          console.warn(`⚠️ Skipped edge, unknown prerequisite ID: ${pre}`);
          return;
        }

        topicEdges.push({
          id: `e-${pre}-${item.id}`,
          source: pre,
          target: item.id,
          animated: true,
          markerEnd: { type: 'arrowclosed' },
        });
      });
    });

    if (topicEdges.length === 0 && flat.length > 1) {
      for (let i = 1; i < flat.length; i++) {
        topicEdges.push({
          id: `e-${flat[i - 1].id}-${flat[i].id}`,
          source: flat[i - 1].id,
          target: flat[i].id,
          animated: true,
          markerEnd: { type: 'arrowclosed' },
        });
      }
    }

    const layouted = getLayoutedElements(topicNodes, topicEdges);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [roadmap, nodeStatuses]);

  const handleNodeClick = (item) => {
    setSelectedNode(item);
    const current = nodeStatuses[item.id] || 'Not Started';
    const next =
      current === 'Not Started'
        ? 'In Progress'
        : current === 'In Progress'
        ? 'Completed'
        : 'Not Started';

    const updated = { ...nodeStatuses, [item.id]: next };
    setNodeStatuses(updated);
    localStorage.setItem('nodeStatuses', JSON.stringify(updated));
  };

  const resetProgress = () => {
    localStorage.removeItem('nodeStatuses');
    setNodeStatuses({});
    setSelectedNode(null);
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return '#10b981';
    if (status === 'In Progress') return '#f59e0b';
    return '#9ca3af';
  };

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;

  return (
    <div style={{ width: '100%', height: '88vh', backgroundColor: '#000', position: 'relative' }}>
      <div style={{ height: '85%', width: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          style={{ backgroundColor: '#000' }}
        >
          <Controls />
        </ReactFlow>
      </div>

      {selectedNode && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#1e293b',
            color: 'white',
            borderRadius: '12px',
            width: '40%',
            marginLeft: 'auto',
            marginRight: 'auto',
            marginBottom: '1rem',
            textAlign: 'center',
            border: '1px solid #000000ff',
          }}
        >
          <h3 style={{ marginBottom: '0.5rem' }}>{selectedNode.label}</h3>
          <p>
            Estimated Time: <strong>{selectedNode.estimated_time_minutes} minutes</strong>
          </p>
          <p>
            Status:{' '}
            <span style={{ color: getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started') }}>
              {nodeStatuses[selectedNode.id] || 'Not Started'}
            </span>
          </p>
        </div>
      )}

      <button
        onClick={resetProgress}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        Reset Progress
      </button>
    </div>
  );
}

export default RoadmapGraph;
