import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

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
  const [selectedNodeId, setSelectedNodeId] = useState(null); // Track selected node ID separately
  const [nodeStatuses, setNodeStatuses] = useState(() => {
    // Use plan-specific storage if studyPlanId is provided, otherwise use global
    const storageKey = studyPlanId ? `nodeStatuses_${studyPlanId}` : 'nodeStatuses';
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  });

  const handleNodeClick = (item) => {
    // Don't set selectedNode here since it's already set in onNodeClick
    const current = nodeStatuses[item.id] || 'Not Started';
    const next =
      current === 'Not Started'
        ? 'In Progress'
        : current === 'In Progress'
        ? 'Completed'
        : 'Not Started';

    const updated = { ...nodeStatuses, [item.id]: next };
    setNodeStatuses(updated);
    
    // Use plan-specific storage if studyPlanId is provided, otherwise use global
    const storageKey = studyPlanId ? `nodeStatuses_${studyPlanId}` : 'nodeStatuses';
    localStorage.setItem(storageKey, JSON.stringify(updated));
    
    // Dispatch events to notify other components about the progress update
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('progressUpdated', { 
        detail: { nodeId: item.id, status: next, allStatuses: updated, studyPlanId } 
      }));
      window.dispatchEvent(new CustomEvent('studyPlansUpdated'));
    }, 0);
  };

  const onNodeClick = (event, node) => {
    console.log('Node clicked:', node);
    if (roadmapData && Array.isArray(roadmapData)) {
      const flat = flattenRoadmap(roadmapData);
      const fullItem = flat.find(item => item.id === node.id);
      if (fullItem) {
        // If clicking the same node that's already selected, update its status
        if (selectedNodeId === node.id) {
          const current = nodeStatuses[fullItem.id] || 'Not Started';
          const next =
            current === 'Not Started'
              ? 'In Progress'
              : current === 'In Progress'
              ? 'Completed'
              : 'Not Started';

          const updated = { ...nodeStatuses, [fullItem.id]: next };
          setNodeStatuses(updated);
          
          // Save to localStorage
          const storageKey = studyPlanId ? `nodeStatuses_${studyPlanId}` : 'nodeStatuses';
          localStorage.setItem(storageKey, JSON.stringify(updated));
          
          // Dispatch events
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('progressUpdated', { 
              detail: { nodeId: fullItem.id, status: next, allStatuses: updated, studyPlanId } 
            }));
            window.dispatchEvent(new CustomEvent('studyPlansUpdated'));
          }, 0);
        } else {
          // If clicking a different node, just select it
          console.log('Setting selectedNode to:', fullItem);
          setSelectedNode(fullItem);
          setSelectedNodeId(node.id);
        }
      }
    }
  };


  // Update selectedNode when roadmapData changes to ensure it has the latest data
  useEffect(() => {
    if (selectedNodeId && roadmapData && Array.isArray(roadmapData)) {
      const flat = flattenRoadmap(roadmapData);
      const fullItem = flat.find(item => item.id === selectedNodeId);
      if (fullItem) {
        setSelectedNode(fullItem);
      }
    }
  }, [roadmapData, selectedNodeId]);

  // Debug: Log selectedNode changes
  useEffect(() => {
    console.log('selectedNode state changed:', selectedNode);
  }, [selectedNode]);

  useEffect(() => {
    if (!roadmapData || !Array.isArray(roadmapData) || roadmapData.length === 0) return;

    const flat = flattenRoadmap(roadmapData);

    const topicNodes = flat.map((item) => {
      const status = nodeStatuses[item.id] || 'Not Started';
      let bg = '#3b82f6';
      if (status === 'In Progress') bg = '#f59e0b';
      else if (status === 'Completed') bg = '#10b981';

      return {
        id: item.id,
        data: {
          label: (
            <div style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              {item.label}
            </div>
          ),
          fullItem: item,
        },
        style: {
          background: bg,
          color: 'white',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '14px',
          border: '1px solid #ddd',
          cursor: 'pointer',
        },
        position: { x: 0, y: 0 },
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
  }, [roadmapData]); // Only depend on roadmapData, not nodeStatuses

  // Update node colors when status changes, without affecting selectedNode
  useEffect(() => {
    setNodes(prevNodes => 
      prevNodes.map(node => {
        const status = nodeStatuses[node.id] || 'Not Started';
        let bg = '#3b82f6';
        if (status === 'In Progress') bg = '#f59e0b';
        else if (status === 'Completed') bg = '#10b981';

        return {
          ...node,
          style: {
            ...node.style,
            background: bg,
          }
        };
      })
    );
  }, [nodeStatuses]);


  // Note: Removed click outside handler to keep info panel always visible

  const resetProgress = () => {
    // Use plan-specific storage if studyPlanId is provided, otherwise use global
    const storageKey = studyPlanId ? `nodeStatuses_${studyPlanId}` : 'nodeStatuses';
    localStorage.removeItem(storageKey);
    setNodeStatuses({});
    setSelectedNode(null);
    setSelectedNodeId(null);
    
    // Dispatch events to notify other components about the progress reset
    window.dispatchEvent(new CustomEvent('progressUpdated', { 
      detail: { reset: true, allStatuses: {}, studyPlanId } 
    }));
    window.dispatchEvent(new CustomEvent('studyPlansUpdated'));
  };

  const getStatusColor = (status) => {
    if (status === 'Completed') return '#10b981';
    if (status === 'In Progress') return '#f59e0b';
    return '#9ca3af';
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '88vh', backgroundColor: '#000', position: 'relative' }}>
      
      {/* Info panel - only visible when node is selected */}
      {selectedNode && (
        <div
          data-info-panel
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
          {/* Topic Name */}
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc', fontWeight: 'bold' }}>
              {selectedNode.label}
            </h4>
          </div>

          {/* Status Section */}
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

          {/* Estimated Time Section */}
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
          onNodeClick={onNodeClick}
          fitView
          style={{ backgroundColor: '#000' }}
        >
          <Controls showZoom showFitView />
        </ReactFlow>
      </div>

      <button
        data-reset-button
        onClick={resetProgress}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 16px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          fontSize: '0.875rem',
        }}
      >
        Reset Progress
      </button>

    </div>
  );
}

export default RoadmapGraph;