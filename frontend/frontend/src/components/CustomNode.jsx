// CustomNode.jsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import './tooltip.css';

const CustomNode = ({ data }) => {
  return (
    <div className="custom-node">
      <div className="tooltip-box">
        <strong>{data.label}</strong>
        <div className="tooltip-content">
          ⏱ {data.time} mins<br />
          📊 {data.status}
        </div>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CustomNode;
