import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import { updateTopicProgress, getProgressForPlan } from '../utils/studyPlanUtils';

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

const flattenRoadmap = (items, acc = [], visited = new Set(), level = 0) => {
  if (!Array.isArray(items)) return acc;
  for (const item of items) {
    const id = item.id?.toString() || item.topic || `topic-${acc.length}`;
    if (!id || visited.has(id)) continue;
    visited.add(id);
    const flatItem = {
      id,
      label: item.topic || item.title || `Topic ${acc.length + 1}`,
      prerequisites: (item.prerequisites || []).map((p) => p.toString()),
      estimated_time_minutes: Math.round((item.estimated_time_hours || item.time_hours || 0) * 60) || item.estimated_time_minutes || 0,
      estimated_time_hours: item.estimated_time_hours || item.time_hours || 0,
    };
    acc.push(flatItem);
    if (item.subtopics && Array.isArray(item.subtopics) && item.subtopics.length > 0) {
      flattenRoadmap(item.subtopics, acc, visited, level + 1);
    }
  }
  return acc;
};

function RoadmapGraph({ roadmapData, title, studyPlanId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeStatuses, setNodeStatuses] = useState({});

  useEffect(() => {
    if (!roadmapData || !Array.isArray(roadmapData) || roadmapData.length === 0) return;

    const flat = flattenRoadmap(roadmapData);

    // Load saved progress if exists, else all "Not Started"
    let initialStatuses = {};
    if (studyPlanId) {
      const savedProgress = getProgressForPlan(studyPlanId);
      if (Object.keys(savedProgress).length > 0) {
        initialStatuses = savedProgress;
      }
    }

    const topicNodes = flat.map((item) => {
      const topicName = item.topic || item.title || `Topic ${item.id}`;
      const status = initialStatuses[item.id] || initialStatuses[topicName] || 'Not Started';
      let bg = '#3b82f6';
      if (status === 'In Progress') bg = '#f59e0b';
      else if (status === 'Completed') bg = '#10b981';

      return {
        id: item.id,
        data: {
          label: (
            <div
              onClick={() => handleNodeClick(item)}
              style={{ cursor: 'pointer', fontWeight: 'bold' }}
            >
              {item.label}
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
          cursor: 'pointer',
          transition: 'background-color 0.3s ease', // smooth color change
        },
        position: { x: 0, y: 0 },
        estimated_time_minutes: item.estimated_time_minutes,
        estimated_time_hours: item.estimated_time_hours,
      };
    });

    const topicEdges = [];
    flat.forEach((item) => {
      if (item.prerequisites.length === 0) return;
      item.prerequisites.forEach((pre) => {
        if (!flat.find((n) => n.id === pre)) return;
        topicEdges.push({
          id: `e-${pre}-${item.id}`,
          source: pre,
          target: item.id,
          animated: true,
          markerEnd: { type: 'arrowclosed' },
        });
      });
    });

    const layouted = getLayoutedElements(topicNodes, topicEdges, 'TB');
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [roadmapData]);

  const handleNodeClick = (item) => {
    setSelectedNode(item);
    const topicName = item.topic || item.title || `Topic ${item.id}`;
    const current = nodeStatuses[item.id] || nodeStatuses[topicName] || 'Not Started';
    const next =
      current === 'Not Started'
        ? 'In Progress'
        : current === 'In Progress'
        ? 'Completed'
        : 'Not Started';

    const updated = {
      ...nodeStatuses,
      [item.id]: next,
      [topicName]: next,
    };
    setNodeStatuses(updated);

    if (studyPlanId) {
      updateTopicProgress(studyPlanId, topicName, next);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return '#10b981';
    if (status === 'In Progress') return '#f59e0b';
    return '#3b82f6';
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '88vh', backgroundColor: '#000', position: 'relative' }}>
      
      {selectedNode && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '220px',
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            fontSize: '14px',
            zIndex: 1000,
          }}
        >
          <h4 style={{ marginBottom: '10px', fontSize: '15px', color: '#f8fafc' }}>{selectedNode.label}</h4>
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Status:</span>
            <div style={{ marginTop: '4px' }}>
              <span
                style={{
                  color: getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started'),
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: `${getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started')}20`,
                  border: `1px solid ${getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started')}40`,
                  fontSize: '12px'
                }}
              >
                {nodeStatuses[selectedNode.id] || 'Not Started'}
              </span>
            </div>
          </div>
          <div>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>Estimated Time:</span>
            <div style={{ color: '#f8fafc', fontWeight: 'bold', marginTop: '4px' }}>
              {selectedNode.estimated_time_minutes
                ? `${selectedNode.estimated_time_minutes} min`
                : selectedNode.estimated_time_hours
                ? `${Math.round(selectedNode.estimated_time_hours * 60)} min`
                : 'Not specified'}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '100%', width: '100%', flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          style={{ backgroundColor: '#000' }}
        >
          <Controls showZoom showFitView />
        </ReactFlow>
      </div>
    </div>
  );
}

export default RoadmapGraph;
