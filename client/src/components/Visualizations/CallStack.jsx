import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './Visualizations.css';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const CallStack = ({ metrics }) => {
  const [functionData, setFunctionData] = useState(null);
  const [callGraphData, setCallGraphData] = useState(null);
  const svgRef = useRef(null);
  
  // Process function call data
  useEffect(() => {
    if (metrics && metrics.functionCalls && metrics.functionCalls.length > 0) {
      // Group function calls by name
      const functionsMap = {};
      
      metrics.functionCalls.forEach(call => {
        if (!functionsMap[call.name]) {
          functionsMap[call.name] = {
            name: call.name,
            totalDuration: 0,
            callCount: 0,
            calls: []
          };
        }
        
        functionsMap[call.name].totalDuration += call.duration;
        functionsMap[call.name].callCount += 1;
        functionsMap[call.name].calls.push(call);
      });
      
      // Calculate average durations
      Object.values(functionsMap).forEach(func => {
        func.avgDuration = func.totalDuration / func.callCount;
      });
      
      // Sort by total duration (descending)
      const sortedFunctions = Object.values(functionsMap).sort((a, b) => 
        b.totalDuration - a.totalDuration
      );
      
      setFunctionData(sortedFunctions);
      
      // Generate call graph data
      const graphData = generateCallGraphData(metrics.functionCalls);
      setCallGraphData(graphData);
    }
  }, [metrics]);
  
  // Generate D3 force-directed graph
  useEffect(() => {
    if (callGraphData && callGraphData.nodes.length > 0 && svgRef.current) {
      // Clear previous graph
      d3.select(svgRef.current).selectAll("*").remove();
      
      const width = svgRef.current.clientWidth;
      const height = 400;
      
      // Create SVG
      const svg = d3.select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);
      
      // Create a force simulation
      const simulation = d3.forceSimulation(callGraphData.nodes)
        .force("link", d3.forceLink(callGraphData.links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide().radius(50));
      
      // Add links
      const link = svg.append("g")
        .selectAll("line")
        .data(callGraphData.links)
        .enter()
        .append("line")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => Math.sqrt(d.value));
      
      // Add nodes
      const node = svg.append("g")
        .selectAll("g")
        .data(callGraphData.nodes)
        .enter()
        .append("g")
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      
      // Add node circles
      node.append("circle")
        .attr("r", d => 20 + Math.min(30, Math.log(countLinksForNode(d.id) + 1) * 10))
        .attr("fill", d => d.id === "global" ? "#ff9800" : "#3f51b5")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);
      
      // Add node labels
      node.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "white")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .text(d => d.id);
      
      // Add tooltips
      node.append("title")
        .text(d => `${d.id}\nCalls: ${countLinksForNode(d.id)}`);
      
      // Update positions on simulation tick
      simulation.on("tick", () => {
        link
          .attr("x1", d => Math.max(30, Math.min(width - 30, d.source.x)))
          .attr("y1", d => Math.max(30, Math.min(height - 30, d.source.y)))
          .attr("x2", d => Math.max(30, Math.min(width - 30, d.target.x)))
          .attr("y2", d => Math.max(30, Math.min(height - 30, d.target.y)));
        
        node
          .attr("transform", d => `translate(${Math.max(30, Math.min(width - 30, d.x))},${Math.max(30, Math.min(height - 30, d.y))})`);
      });
      
      // Helper for counting links connected to a node
      function countLinksForNode(nodeId) {
        return callGraphData.links.filter(link => 
          link.source.id === nodeId || link.target.id === nodeId
        ).length;
      }
      
      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
      
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
      
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    }
  }, [callGraphData]);
  
  // Helper to generate call graph data
  const generateCallGraphData = (functionCalls) => {
    const nodes = new Set();
    const linkMap = new Map();
    
    // Process function calls
    functionCalls.forEach(call => {
      const source = call.caller || 'global';
      const target = call.name;
      
      // Add nodes
      nodes.add(source);
      nodes.add(target);
      
      // Create or update link
      const linkId = `${source}-${target}`;
      if (!linkMap.has(linkId)) {
        linkMap.set(linkId, {
          source,
          target,
          count: 1,
          value: 1
        });
      } else {
        const link = linkMap.get(linkId);
        link.count += 1;
        link.value = link.count;
      }
    });
    
    // Convert to D3 format
    return {
      nodes: Array.from(nodes).map(id => ({ id })),
      links: Array.from(linkMap.values())
    };
  };
  
  // Generate pie chart data for function calls
  const getPieChartData = () => {
    const labels = functionData.map(func => func.name);
    const values = functionData.map(func => func.callCount);
    
    return {
      labels,
      datasets: [
        {
          label: 'Function Calls',
          data: values,
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };
  
  if (!functionData || functionData.length === 0) {
    return (
      <div className="visualization-placeholder">
        <p>No function call data available.</p>
      </div>
    );
  }
  
  return (
    <div className="call-stack-visualization">
      <h3>Function Call Analysis</h3>
      
      <div className="call-graph-container">
        <h4>Call Graph</h4>
        <div className="call-graph-legend">
          <div className="legend-item">
            <div className="legend-color global"></div>
            <span>Global Scope</span>
          </div>
          <div className="legend-item">
            <div className="legend-color function"></div>
            <span>Functions</span>
          </div>
        </div>
        <div className="call-graph-wrapper">
          <svg ref={svgRef} className="call-graph"></svg>
        </div>
        <p className="graph-instructions">Drag nodes to rearrange the graph.</p>
      </div>
      
      <div className="function-stats-container">
        <div className="function-chart">
          <h4>Function Call Distribution</h4>
          <div className="pie-chart-container">
            <Pie data={getPieChartData()} options={{
              plugins: {
                legend: {
                  position: 'right',
                  align: 'start'
                }
              }
            }} />
          </div>
        </div>
        
        <div className="function-table">
          <h4>Function Details</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>Function</th>
                <th>Calls</th>
                <th>Total Time (ms)</th>
                <th>Avg Time (ms)</th>
              </tr>
            </thead>
            <tbody>
              {functionData.map((func, index) => (
                <tr key={index}>
                  <td>{func.name}</td>
                  <td>{func.callCount}</td>
                  <td>{func.totalDuration.toFixed(2)}</td>
                  <td>{func.avgDuration.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CallStack;