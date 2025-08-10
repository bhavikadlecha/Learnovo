import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

const MermaidRoadmap = ({ roadmapData, title }) => {
  const mermaidRef = useRef(null);

  useEffect(() => {
    // Initialize Mermaid with dark theme
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#1e3a8a',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#3b82f6',
        lineColor: '#60a5fa',
        secondaryColor: '#1e40af',
        tertiaryColor: '#1d4ed8',
        background: '#0f172a',
        mainBkg: '#1e40af',
        secondBkg: '#1e3a8a'
      }
    });
  }, []);

  const generateMermaidDiagram = () => {
    if (!roadmapData || roadmapData.length === 0) {
      return `
        flowchart TD
          START([🚀 Begin Learning Journey]) 
          START --> EMPTY[No roadmap data available]
          
          classDef startNode fill:#dc2626,stroke:#f87171,stroke-width:3px,color:#ffffff
          class START startNode
      `;
    }

    let diagram = `
%%{init: {'theme':'dark', 'themeVariables': { 'primaryColor':'#1e3a8a', 'primaryTextColor':'#ffffff', 'primaryBorderColor':'#3b82f6', 'lineColor':'#60a5fa', 'secondaryColor':'#1e40af', 'tertiaryColor':'#1d4ed8', 'background':'#0f172a', 'mainBkg':'#1e40af', 'secondBkg':'#1e3a8a', 'tertiaryColor':'#1d4ed8'}}}%%

flowchart TD
    START([🚀 Begin ${title || 'Learning Journey'}])
    `;

    // Generate nodes for each topic
    roadmapData.forEach((item, index) => {
      const nodeId = `TOPIC${index}`;
      const topic = item.title || item.topic || `Topic ${index + 1}`;
      const hours = parseFloat(item.estimated_time_hours || item.time_hours || 0);
      const emoji = index === 0 ? '📐' : index === 1 ? '🐍' : index === 2 ? '📊' : index < roadmapData.length * 0.5 ? '🤖' : index < roadmapData.length * 0.8 ? '🧠' : '🏗️';
      
      diagram += `
    ${nodeId}[${emoji} ${topic}<br/>${hours} hours]`;
    });

    // Generate connections
    diagram += `
    
    START --> TOPIC0`;
    
    if (roadmapData.length > 1) {
      diagram += `
    START --> TOPIC1`;
    }

    // Connect topics in sequence with some branching
    for (let i = 0; i < roadmapData.length - 1; i++) {
      if (i < 2 && roadmapData.length > 3) {
        // Foundation topics connect to core topics
        diagram += `
    TOPIC${i} --> TOPIC${Math.min(i + 2, roadmapData.length - 1)}`;
      } else if (i < roadmapData.length - 1) {
        // Sequential progression
        diagram += `
    TOPIC${i} --> TOPIC${i + 1}`;
      }
    }

    // Add final achievement node
    if (roadmapData.length > 0) {
      diagram += `
    TOPIC${roadmapData.length - 1} --> COMPLETE([🎓 Expert Level!])`;
    }

    // Add styling classes
    diagram += `
    
    %% Styling for nodes
    classDef foundationNode fill:#1e40af,stroke:#3b82f6,stroke-width:2px,color:#ffffff
    classDef intermediateNode fill:#1e3a8a,stroke:#60a5fa,stroke-width:2px,color:#ffffff
    classDef advancedNode fill:#7c3aed,stroke:#a78bfa,stroke-width:2px,color:#ffffff
    classDef projectNode fill:#059669,stroke:#34d399,stroke-width:2px,color:#ffffff
    classDef milestoneNode fill:#dc2626,stroke:#f87171,stroke-width:3px,color:#ffffff
    
    %% Apply styles`;

    // Apply styles based on topic position
    const foundationTopics = [];
    const intermediateTopics = [];
    const advancedTopics = [];
    
    roadmapData.forEach((item, index) => {
      if (index < roadmapData.length * 0.4) {
        foundationTopics.push(`TOPIC${index}`);
      } else if (index < roadmapData.length * 0.8) {
        intermediateTopics.push(`TOPIC${index}`);
      } else {
        advancedTopics.push(`TOPIC${index}`);
      }
    });

    if (foundationTopics.length > 0) {
      diagram += `
    class ${foundationTopics.join(',')} foundationNode`;
    }
    if (intermediateTopics.length > 0) {
      diagram += `
    class ${intermediateTopics.join(',')} intermediateNode`;
    }
    if (advancedTopics.length > 0) {
      diagram += `
    class ${advancedTopics.join(',')} advancedNode`;
    }
    
    diagram += `
    class START,COMPLETE milestoneNode`;

    return diagram;
  };

  useEffect(() => {
    if (mermaidRef.current && roadmapData) {
      const diagramDefinition = generateMermaidDiagram();
      
      // Clear previous content
      mermaidRef.current.innerHTML = '';
      
      // Create a unique ID for this diagram
      const diagramId = `mermaid-${Date.now()}`;
      
      // Render the diagram
      mermaid.render(diagramId, diagramDefinition).then(({ svg }) => {
        mermaidRef.current.innerHTML = svg;
      }).catch((error) => {
        console.error('Mermaid rendering error:', error);
        mermaidRef.current.innerHTML = '<p class="text-red-500">Error rendering diagram</p>';
      });
    }
  }, [roadmapData, title]);

  const totalHours = roadmapData ? roadmapData.reduce((sum, item) => 
    sum + parseFloat(item.estimated_time_hours || item.time_hours || 0), 0
  ) : 0;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-900 to-blue-900 min-h-screen">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗺️</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{title || 'Learning Roadmap'}</h1>
              <p className="text-blue-100">Visual learning path with dependency tracking</p>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {roadmapData && roadmapData.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-gray-700">
                  <strong>{roadmapData.length}</strong> Learning Topics
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-700">
                  <strong>{totalHours.toFixed(1)}</strong> Total Hours
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span className="text-gray-700">
                  <strong>{Math.ceil(totalHours / 10)}</strong> Weeks (10h/week)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mermaid Diagram */}
        <div className="p-6">
          <div 
            ref={mermaidRef}
            className="w-full overflow-x-auto bg-gray-900 rounded-lg p-4 min-h-[400px] flex items-center justify-center"
            style={{ backgroundColor: '#0f172a' }}
          >
            <div className="text-gray-400">Loading diagram...</div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📖 Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-gray-700">Foundation Topics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-800 rounded"></div>
              <span className="text-gray-700">Intermediate Topics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-600 rounded"></div>
              <span className="text-gray-700">Advanced Topics</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-gray-700">Milestones</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 text-white p-4 text-center">
          <p className="text-gray-300">
            🚀 Interactive Learning Roadmap • Powered by Mermaid.js
          </p>
        </div>
      </div>
    </div>
  );
};

export default MermaidRoadmap;
