import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  const indent = '  '.repeat(level);
  console.log(`${indent}🔄 Flattening level ${level}, items:`, items?.length || 0);
  
  if (!Array.isArray(items)) {
    console.warn(`${indent}❌ Items is not an array:`, typeof items, items);
    return acc;
  }
  
  for (const item of items) {
    const id = item.id?.toString() || item.topic || `topic-${acc.length}`;
    console.log(`${indent}📝 Processing item: ${item.topic} (ID: ${id})`);
    
    if (!id || visited.has(id)) {
      console.log(`${indent}⚠️ Skipping duplicate or empty ID: ${id}`);
      continue;
    }
    visited.add(id);

    // Add current item to flattened array
    const flatItem = {
      id,
      label: item.topic || item.title || `Topic ${acc.length + 1}`,
      prerequisites: (item.prerequisites || []).map((p) => p.toString()),
      estimated_time_minutes: Math.round((item.estimated_time_hours || item.time_hours || 0) * 60) || item.estimated_time_minutes || 0,
      estimated_time_hours: item.estimated_time_hours || item.time_hours || 0,
    };
    
    acc.push(flatItem);
    console.log(`${indent}✅ Added to flatten: ${flatItem.label} (${flatItem.id})`);

    // Recursively process subtopics
    if (item.subtopics && Array.isArray(item.subtopics) && item.subtopics.length > 0) {
      console.log(`${indent}🔄 Found ${item.subtopics.length} subtopics for ${item.topic}, recursing...`);
      flattenRoadmap(item.subtopics, acc, visited, level + 1);
    } else {
      console.log(`${indent}📝 No subtopics for ${item.topic}`);
    }
  }
  
  if (level === 0) {
    console.log(`✅ Final flattened result: ${acc.length} total items`);
    acc.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.label} (${item.id}) - ${item.estimated_time_minutes}min`);
    });
  }
  
  return acc;
};

function RoadmapGraph({ roadmapData, title, studyPlanId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [nodeStatuses, setNodeStatuses] = useState(() => {
    const stored = localStorage.getItem('nodeStatuses');
    return stored ? JSON.parse(stored) : {};
  });

  const handleNodeClick = useCallback((item) => {
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

    if (studyPlanId) {
      const progressKey = `roadmap_progress_${studyPlanId}`;
      const existingProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
      
      const studyPlanStatus = next === 'Not Started' ? 'not-started' : 
                             next === 'In Progress' ? 'in-progress' : 'completed';
      
      existingProgress[item.label] = studyPlanStatus;
      localStorage.setItem(progressKey, JSON.stringify(existingProgress));
      
      window.dispatchEvent(new CustomEvent('progressUpdated', { 
        detail: { 
          studyPlanId, 
          topic: item.label, 
          status: studyPlanStatus,
          allProgress: existingProgress
        } 
      }));
    }
  }, [nodeStatuses, studyPlanId]);

  useEffect(() => {
    if (!roadmapData || !Array.isArray(roadmapData) || roadmapData.length === 0) {
      console.warn('❌ Empty or invalid roadmap received:', roadmapData);
      setIsInitialLoading(false); // Set loading to false even if no data
      return;
    }
    
    console.log('📊 RoadmapGraph received data:', {
      roadmapData: roadmapData,
      dataType: typeof roadmapData,
      isArray: Array.isArray(roadmapData),
      length: Array.isArray(roadmapData) ? roadmapData.length : 'N/A',
      firstItem: roadmapData[0],
      firstItemKeys: roadmapData[0] ? Object.keys(roadmapData[0]) : 'N/A',
      hasSubtopics: roadmapData[0] ? !!roadmapData[0].subtopics : false,
      subtopicsCount: roadmapData[0] && roadmapData[0].subtopics ? roadmapData[0].subtopics.length : 0
    });

    const flat = flattenRoadmap(roadmapData);
    console.log('🔍 Flattening Debug:');
    console.log('  Input data:', roadmapData);
    console.log('  Flattened result:', flat);
    console.log('  Input length:', roadmapData?.length);
    console.log('  Output length:', flat?.length);

    const topicNodes = flat.map((item) => {
      const status = nodeStatuses[item.id] || 'Not Started';
      let bg, borderColor, textShadow;
      
      if (status === 'Completed') {
        bg = 'linear-gradient(135deg, #10b981, #059669)';
        borderColor = '#059669';
        textShadow = '0 1px 2px rgba(0,0,0,0.3)';
      } else if (status === 'In Progress') {
        bg = 'linear-gradient(135deg, #f59e0b, #d97706)';
        borderColor = '#d97706';
        textShadow = '0 1px 2px rgba(0,0,0,0.3)';
      } else {
        bg = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        borderColor = '#2563eb';
        textShadow = '0 1px 2px rgba(0,0,0,0.3)';
      }

      return {
        id: item.id,
        className: 'node-hover',
        data: {
          label: (
            <div onClick={() => handleNodeClick(item)} style={{ 
              cursor: 'pointer',
              textAlign: 'center',
              width: '100%'
            }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '14px',
                marginBottom: '4px',
                textShadow: textShadow,
                lineHeight: '1.2'
              }}>
                {item.label}
              </div>
              {item.estimated_time_minutes && (
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.9,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {item.estimated_time_minutes} min
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: bg,
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          border: `2px solid ${borderColor}`,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '160px',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center',
          willChange: 'transform, background, border-color, box-shadow'
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
          style: {
            stroke: '#64748b',
            strokeWidth: 2,
            strokeDasharray: '5,5'
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#64748b',
            width: 20,
            height: 20
          }
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
    
    // Only show loading on initial load, not on subsequent updates
    if (!hasInitialized) {
      setHasInitialized(true);
      setIsInitialLoading(false);
    }
  }, [roadmapData, hasInitialized]);

  // Separate effect for updating node colors without re-layout
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const updatedNodes = nodes.map(node => {
      const status = nodeStatuses[node.id] || 'Not Started';
      let bg, borderColor;
      
      if (status === 'Completed') {
        bg = 'linear-gradient(135deg, #10b981, #059669)';
        borderColor = '#059669';
      } else if (status === 'In Progress') {
        bg = 'linear-gradient(135deg, #f59e0b, #d97706)';
        borderColor = '#d97706';
      } else {
        bg = 'linear-gradient(135deg, #3b82f6, #2563eb)';
        borderColor = '#2563eb';
      }

      return {
        ...node,
        style: {
          ...node.style,
          background: bg,
          borderColor: borderColor,
          border: `2px solid ${borderColor}`,
        }
      };
    });
    
    setNodes(updatedNodes);
  }, [nodeStatuses, setNodes]);

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

  const stats = useMemo(() => {
    const flatData = flattenRoadmap(roadmapData || []);
    const totalTopics = flatData.length;
    const completedTopics = Object.values(nodeStatuses).filter(status => status === 'Completed').length;
    const inProgressTopics = Object.values(nodeStatuses).filter(status => status === 'In Progress').length;
    const notStartedTopics = totalTopics - completedTopics - inProgressTopics;
    return {
      flatData,
      totalTopics,
      completedTopics,
      inProgressTopics,
      notStartedTopics
    };
  }, [roadmapData, nodeStatuses]);

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      height: '100%', 
      backgroundColor: '#0f0f23',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Loading overlay - only show on initial load */}
      {isInitialLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f0f23',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          flexDirection: 'column'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid #2d2d5a',
            borderTop: '3px solid #6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px'
          }}></div>
          <div style={{
            color: '#cbd5e1',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Loading Roadmap...
          </div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              
              @keyframes slideInLeft {
                0% { 
                  transform: translateX(-100%);
                  opacity: 0;
                }
                100% { 
                  transform: translateX(0);
                  opacity: 1;
                }
              }
              
              .node-hover:hover {
                transform: scale(1.05) !important;
                box-shadow: 0 8px 20px rgba(0,0,0,0.25) !important;
              }
            `}
          </style>
        </div>
      )}
      
      {selectedNode && (
        <div
          style={{
            width: '350px',
            backgroundColor: '#1a1a2e',
            color: 'white',
            padding: '24px',
            borderRight: '2px solid #3b82f6',
            zIndex: 1000,
            overflowY: 'auto',
            boxShadow: '4px 0 16px rgba(0,0,0,0.3)',
            position: 'relative',
            borderTopRightRadius: '12px',
            borderBottomRightRadius: '12px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateX(0)',
            animation: 'slideInLeft 0.3s ease-out'
          }}
        >
          <button
            onClick={() => setSelectedNode(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#cbd5e1',
              fontSize: '16px',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.target.style.color = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.target.style.color = '#cbd5e1';
            }}
          >
            ×
          </button>
          
          <h3 style={{ 
            marginBottom: '24px', 
            fontSize: '20px', 
            color: '#f8fafc',
            fontWeight: '700',
            borderBottom: '2px solid #3b82f6',
            paddingBottom: '12px',
            textAlign: 'center'
          }}>
            📚 {selectedNode.label}
          </h3>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '12px' 
            }}>
              <span style={{ 
                color: '#94a3b8', 
                fontSize: '14px', 
                fontWeight: '600',
                marginRight: '8px'
              }}>
                ⏱️ Estimated Time:
              </span>
            </div>
            <div style={{ 
              color: '#f8fafc', 
              fontWeight: 'bold', 
              fontSize: '18px',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '2px solid rgba(99, 102, 241, 0.4)',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)'
            }}>
              {selectedNode.estimated_time_minutes
                ? `${selectedNode.estimated_time_minutes} minutes`
                : selectedNode.estimated_time_hours
                ? `${Math.round(selectedNode.estimated_time_hours * 60)} minutes`
                : 'Time not specified'}
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '12px' 
            }}>
              <span style={{ 
                color: '#94a3b8', 
                fontSize: '14px', 
                fontWeight: '600',
                marginRight: '8px'
              }}>
                📊 Status:
              </span>
            </div>
            <div style={{ 
              textAlign: 'center',
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: `${getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started')}15`,
              border: `2px solid ${getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started')}`,
              boxShadow: `0 4px 12px ${getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started')}20`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)',
              willChange: 'background-color, border-color, box-shadow'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: getStatusColor(nodeStatuses[selectedNode.id] || 'Not Started'),
                marginBottom: '8px',
                transition: 'color 0.3s ease'
              }}>
                {nodeStatuses[selectedNode.id] === 'Completed' && '✅ '}
                {nodeStatuses[selectedNode.id] === 'In Progress' && '🔄 '}
                {(nodeStatuses[selectedNode.id] === 'Not Started' || !nodeStatuses[selectedNode.id]) && '⏸️ '}
                {nodeStatuses[selectedNode.id] || 'Not Started'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                fontStyle: 'italic'
              }}>
                Click node to change status
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: 'rgba(79, 70, 229, 0.15)',
            border: '2px solid rgba(79, 70, 229, 0.4)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px'
          }}>
            <p style={{ 
              fontSize: '13px', 
              color: '#cbd5e1', 
              margin: 0, 
              lineHeight: '1.6',
              textAlign: 'center'
            }}>
              💡 <strong>How to use:</strong><br/>
              Click the node again to cycle through:<br/>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>⏸️ Not Started</span> → 
              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}> 🔄 In Progress</span> → 
              <span style={{ color: '#10b981', fontWeight: 'bold' }}> ✅ Completed</span>
            </p>
          </div>
        </div>
      )}

      <div style={{ 
        height: '100%', 
        width: selectedNode ? 'calc(100% - 350px)' : '100%', 
        flex: 1,
        position: 'relative'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          style={{ 
            backgroundColor: '#0f0f23',
            width: '100%',
            height: '100%'
          }}
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
          }}
        >
          <Controls 
            style={{
              bottom: '20px',
              left: '20px'
            }}
          />
        </ReactFlow>
      </div>

      <button
        onClick={resetProgress}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '12px 20px',
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          fontSize: '14px',
          fontWeight: '600',
          transition: 'all 0.2s',
          zIndex: 1001
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#dc2626';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#ef4444';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
        }}
      >
        🔄 Reset Progress
      </button>

    </div>
  );
}

export default RoadmapGraph;
