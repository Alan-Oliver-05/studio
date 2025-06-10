
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Upload, FileText, Image as ImageIconLucide, Brain, Loader2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'root' | 'leaf' | 'detail';
  color: string; // Base color for the node (e.g., blue for manual, purple for AI)
  aiGenerated: boolean;
  parentId?: string;
  confidence?: number;
  aiType?: string;
}

interface AIMindMapDisplayProps {
  initialTopic?: string;
}

const MANUAL_NODE_COLOR = '#3b82f6'; // blue-500
const AI_NODE_COLOR = '#8b5cf6';     // purple-500

const AIMindMapDisplay: React.FC<AIMindMapDisplayProps> = ({ initialTopic }) => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'root',
      text: initialTopic || 'AI Learning Map',
      x: 100,
      y: 300,
      type: 'root',
      color: MANUAL_NODE_COLOR,
      aiGenerated: false
    }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  // const [aiSuggestions, setAISuggestions] = useState<{text: string, type: string, confidence: number}[]>([]); // Kept for potential future use
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTopic) {
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === 'root' ? { ...node, text: initialTopic, color: MANUAL_NODE_COLOR } : node
        )
      );
    }
  }, [initialTopic]);

  const analyzeContent = useCallback(async (file: File) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // Simulate variable processing
    
    const fileType = file.type;
    let suggestions: { text: string, type: string, confidence: number }[] = [];
    
    if (fileType.startsWith('image/')) {
      suggestions = [
        { text: 'Visual Concepts', type: 'concept', confidence: Math.random() * 0.2 + 0.75 },
        { text: 'Key Objects', type: 'topic', confidence: Math.random() * 0.2 + 0.7 },
        { text: 'Image Style', type: 'visual', confidence: Math.random() * 0.2 + 0.65 }
      ];
    } else if (fileType === 'application/pdf' || fileType.startsWith('text/')) {
      suggestions = [
        { text: 'Main Themes', type: 'objective', confidence: Math.random() * 0.2 + 0.78 },
        { text: 'Key Definitions', type: 'definition', confidence: Math.random() * 0.2 + 0.72 },
        { text: 'Potential Questions', type: 'exercise', confidence: Math.random() * 0.2 + 0.68 },
        { text: 'Summary Points', type: 'summary', confidence: Math.random() * 0.2 + 0.75 }
      ];
    } else {
      suggestions = [{ text: `Content from ${file.name.substring(0,15)}...`, type: 'general', confidence: Math.random() * 0.2 + 0.6 }];
    }
    
    setIsProcessing(false);
    return suggestions;
  }, []);

  const generateDetailNodes = useCallback((parentId: string, parentColor: string, aiType: string | undefined) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    let subNodesContent: { text: string }[] = [];
    
    switch (aiType) {
      case 'concept': subNodesContent = [ { text: 'Core Principles' }, { text: 'Related Ideas' }, { text: 'Applications' } ]; break;
      case 'topic': subNodesContent = [ { text: 'Sub-topic A' }, { text: 'Sub-topic B' } ]; break;
      case 'objective': subNodesContent = [ { text: 'Goal 1' }, { text: 'Goal 2' } ]; break;
      default: subNodesContent = [ { text: 'Detail 1' }, { text: 'Detail 2' } ];
    }

    const detailNodesToAdd = subNodesContent.map((sub, index) => ({
      id: `detail_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      text: sub.text,
      x: parentNode.x + 200,
      y: parentNode.y + (index * 35) - ((subNodesContent.length -1) * 35 / 2),
      type: 'detail' as 'detail',
      color: parentColor, // Inherit base color, visual styling (fill/stroke) differentiates
      parentId,
      aiGenerated: true // Detail nodes are also AI-generated in this context
    }));
    
    setNodes(prevNodes => [...prevNodes, ...detailNodesToAdd]);
  }, [nodes]);

  const generateNodesFromAnalysis = useCallback((analysisSuggestions: {text: string, type: string, confidence: number}[], parentId = 'root') => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newGeneratedNodes: Node[] = analysisSuggestions.map((suggestion, index) => {
      const yOffset = (nodes.filter(n => n.parentId === parentId).length + index) * 50 - (analysisSuggestions.length > 1 ? ((analysisSuggestions.length-1)*50/2) : 0);
      return {
        id: `ai_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        text: `${suggestion.text} (${Math.round(suggestion.confidence * 100)}%)`,
        x: parentNode.x + 250,
        y: parentNode.y + yOffset,
        type: 'leaf' as 'leaf',
        color: AI_NODE_COLOR, // All AI generated nodes get purple base color
        parentId,
        aiGenerated: true,
        confidence: suggestion.confidence,
        aiType: suggestion.type
      };
    });

    setNodes(prevNodes => [...prevNodes, ...newGeneratedNodes]);
    
    setTimeout(() => {
      newGeneratedNodes.forEach(node => {
        if (node.confidence && node.confidence > 0.85 && node.aiType) { // Slightly lower threshold for auto-details
          generateDetailNodes(node.id, node.color, node.aiType);
        }
      });
    }, 500);
  }, [nodes, generateDetailNodes]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const currentFiles = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...currentFiles]);
    
    for (const file of currentFiles) {
      const analysisSuggestions = await analyzeContent(file);
      // setAISuggestions(prev => [...prev, ...analysisSuggestions]);
      generateNodesFromAnalysis(analysisSuggestions, selectedNodeId || 'root');
    }
     event.target.value = ''; // Reset file input
  }, [analyzeContent, generateNodesFromAnalysis, selectedNodeId]);

  const getSmartSuggestions = (nodeText: string): string[] => {
    const suggestionsPool: Record<string, string[]> = {
      'math': ['Formula', 'Theorem', 'Example', 'Proof'],
      'science': ['Hypothesis', 'Experiment', 'Observation', 'Conclusion'],
      'history': ['Key Event', 'Important Figure', 'Cause & Effect', 'Timeline'],
      'language': ['Grammar Rule', 'Vocabulary', 'Synonym', 'Antonym']
    };
    const lowerText = nodeText.toLowerCase();
    for (const [category, items] of Object.entries(suggestionsPool)) {
      if (lowerText.includes(category)) return items;
    }
    return ['Key Concept', 'Supporting Detail', 'Example', 'Question'];
  };

  const addNode = (parentId: string | undefined, text = 'New Idea') => {
    if (!parentId) parentId = 'root';
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const siblings = nodes.filter(n => n.parentId === parentId);
    const yOffset = (siblings.length) * 40 - (siblings.length > 0 ? ((siblings.length -1) * 40 / 2) : 0);

    const newNode: Node = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text,
      x: parentNode.x + 220,
      y: parentNode.y + yOffset,
      type: 'leaf',
      color: MANUAL_NODE_COLOR, // Manual nodes are blue
      parentId,
      aiGenerated: false
    };
    setNodes(prev => [...prev, newNode]);
  };

  const addSmartNode = (parentId: string) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;
    const suggestions = getSmartSuggestions(parentNode.text);
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    const siblings = nodes.filter(n => n.parentId === parentId);
    const yOffset = (siblings.length) * 40 - (siblings.length > 0 ? ((siblings.length -1) * 40 / 2) : 0);

    const newNode: Node = {
      id: `ai_smart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: `🤖 ${randomSuggestion}`,
      x: parentNode.x + 220,
      y: parentNode.y + yOffset,
      type: 'leaf',
      color: AI_NODE_COLOR, // Smart add implies AI suggestion
      parentId,
      aiGenerated: true 
    };
    setNodes(prev => [...prev, newNode]);
  };

  const updateNode = (id: string, updates: Partial<Node>) => {
    setNodes(prevNodes => prevNodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (id: string) => {
    if (id === 'root') return;
    const childrenIdsToDelete: string[] = [];
    const findChildren = (parentId: string) => {
        nodes.forEach(node => {
            if (node.parentId === parentId) {
                childrenIdsToDelete.push(node.id);
                findChildren(node.id);
            }
        });
    };
    findChildren(id);
    setNodes(prevNodes => prevNodes.filter(node => node.id !== id && !childrenIdsToDelete.includes(node.id)));
    setSelectedNodeId(null);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGRectElement>, node: Node) => {
    if (editingNodeId) return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragOffset({ x: x - node.x, y: y - node.y });
    setSelectedNodeId(node.id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateNode(selectedNodeId, { x: x - dragOffset.x, y: y - dragOffset.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      const parentNode = nodes.find(n => n.id === node.parentId);
      if (!parentNode) return null;

      const nodeWidth = node.type === 'root' ? 120 : Math.min(Math.max(node.text.length * 7 + 20, 120), 350);
      const parentNodeWidth = parentNode.type === 'root' ? 120 : Math.min(Math.max(parentNode.text.length * 7 + 20, 120), 350);
      
      const startX = parentNode.x + parentNodeWidth;
      const startY = parentNode.y + 17.5;
      const endX = node.x;
      const endY = node.y + 17.5;
      
      const controlX1 = startX + Math.max(50, (endX - startX) * 0.3);
      const controlY1 = startY;
      const controlX2 = endX - Math.max(50, (endX - startX) * 0.3);
      const controlY2 = endY;

      return (
        <path
          key={`${parentNode.id}-${node.id}`}
          d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
          stroke={node.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR}
          strokeWidth={2}
          fill="none"
          className="transition-all duration-200"
          strokeDasharray={node.type === 'detail' ? "3,3" : "none"}
        />
      );
    });
  };

  const renderNode = (node: Node) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const nodeWidth = node.type === 'root' ? 120 : Math.min(Math.max(node.text.length * 7 + 30, 120), 350); // +30 for padding & potential icon
    const nodeFill = node.color;
    const textColor = 'white'; // All nodes have white text for contrast against blue/purple
    const strokeColor = node.color;
    const isAIDerived = node.aiGenerated || node.type === 'detail';


    return (
      <g key={node.id} className="select-none">
        <rect
          x={node.x}
          y={node.y}
          width={nodeWidth}
          height={35}
          rx={17.5} // More rounded
          fill={nodeFill}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 2}
          className={cn("transition-all duration-200 cursor-grab", isSelected ? 'drop-shadow-lg' : 'opacity-90 hover:opacity-100', isDragging && selectedNodeId === node.id && 'cursor-grabbing')}
          onMouseDown={(e) => handleMouseDown(e, node)}
          strokeDasharray={isAIDerived && node.type !== 'root' ? "6,3" : "none"}
        />
        
        {node.confidence && node.aiGenerated && (
          <Brain 
            className="w-3 h-3 opacity-80" 
            fill="white" // Make brain icon white to stand out on colored nodes
            strokeWidth={0.5}
            x={node.x + nodeWidth - 22} 
            y={node.y + 5}
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {!isEditing ? (
          <text
            x={node.x + 15} // More padding from left
            y={node.y + 22.5} // Vertically center
            fill={textColor}
            fontSize="11"
            fontWeight={node.type === 'root' ? '600' : '500'}
            className="pointer-events-none select-none"
            onDoubleClick={() => node.type !== 'root' && setEditingNodeId(node.id)}
          >
            {node.text.length > ((nodeWidth - 30)/7) ? node.text.substring(0, Math.floor((nodeWidth - 30)/7 - 3)) + '...' : node.text}
          </text>
        ) : (
          <foreignObject x={node.x + 5} y={node.y + 5} width={nodeWidth - 10} height={25}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="h-full">
                <input
                type="text"
                value={node.text}
                onChange={(e) => updateNode(node.id, { text: e.target.value })}
                onBlur={() => setEditingNodeId(null)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') setEditingNodeId(null);
                }}
                className="w-full h-full px-2.5 text-xs border border-slate-400 rounded-md outline-none bg-white text-black"
                autoFocus
                />
            </div>
          </foreignObject>
        )}
        
        {isSelected && !isEditing && (
          <g transform={`translate(${node.x + nodeWidth + 5}, ${node.y + 17.5})`}>
            {/* Add Child */}
            <circle cx={10} cy={0} r={10} fill="#10b981" className="cursor-pointer hover:opacity-80" onClick={() => addNode(node.id)}>
              <title>Add child node</title>
              <Plus className="text-white w-3 h-3" x={10 - 6} y={0 - 6} />
            </circle>
            {/* AI Smart Add */}
            <circle cx={32} cy={0} r={10} fill="#a78bfa" className="cursor-pointer hover:opacity-80" onClick={() => addSmartNode(node.id)}>
              <title>AI Smart Add</title>
              <Brain className="text-white w-3 h-3"  x={32 - 6} y={0 - 6} />
            </circle>
          </g>
        )}
        {isSelected && !isEditing && node.id !== 'root' && (
             <g transform={`translate(${node.x - 15}, ${node.y + 17.5})`}>
                {/* Edit Node */}
                <circle cx={0} cy={-9} r={8} fill="#60a5fa" className="cursor-pointer hover:opacity-80" onClick={() => setEditingNodeId(node.id)}>
                    <title>Edit node</title>
                    <Edit2 className="text-white w-2.5 h-2.5" x={0-5} y={-9-5} />
                </circle>
                {/* Delete Node */}
                <circle cx={0} cy={9} r={8} fill="#f87171" className="cursor-pointer hover:opacity-80" onClick={() => deleteNode(node.id)}>
                    <title>Delete node</title>
                    <Trash2 className="text-white w-2.5 h-2.5" x={0-5} y={9-5} />
                </circle>
            </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-slate-100 dark:bg-slate-800/50 relative overflow-hidden rounded-lg">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-white dark:bg-slate-700 rounded-xl shadow-lg p-4 w-64">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">AI Mind Map</h2>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="default"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Upload className="w-4 h-4 mr-2" />
            {showUploadPanel ? "Hide Upload" : "Upload & Analyze"}
          </Button>
          
          {showUploadPanel && (
            <div className="bg-slate-50 dark:bg-slate-600/50 p-3 rounded-md border border-slate-200 dark:border-slate-600">
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs dark:bg-slate-500 dark:hover:bg-slate-400 dark:text-slate-100"><FileText className="w-3.5 h-3.5 mr-1" />Docs</Button>
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs dark:bg-slate-500 dark:hover:bg-slate-400 dark:text-slate-100"><ImageIconLucide className="w-3.5 h-3.5 mr-1" />Images</Button>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center space-x-1.5 text-sm text-blue-600 dark:text-blue-400 p-1.5 bg-blue-500/10 rounded-md">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI analyzing...</span>
            </div>
          )}
          
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
            <li>• AI auto-generates nodes from uploads.</li>
            <li>• Purple button = AI smart suggestions.</li>
            <li>• Dashed borders = AI generated content.</li>
          </ul>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-white dark:bg-slate-700 rounded-xl shadow-lg p-3 max-w-[220px]">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Analyzed Files:</h3>
          <div className="space-y-1 max-h-24 overflow-y-auto text-xs pr-1 scrollbar-thin">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-300">
                {file.type.startsWith('image/') ? <Camera className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                <span className="truncate" title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {renderConnections()}
        {nodes.map(node => renderNode(node))}
      </svg>

      <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-slate-700 rounded-lg shadow-md p-3">
        <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            <li className="flex items-center space-x-1.5">
                <div className={cn("w-3 h-3 rounded-sm")} style={{backgroundColor: MANUAL_NODE_COLOR}}></div>
                <span>Manual Nodes</span>
            </li>
            <li className="flex items-center space-x-1.5">
                <div className={cn("w-3 h-3 rounded-sm")} style={{backgroundColor: AI_NODE_COLOR}}></div>
                <span>AI Generated</span>
            </li>
            <li className="flex items-center space-x-1.5">
                <Brain className={cn("w-3 h-3")} style={{color: AI_NODE_COLOR}} />
                <span>AI Confidence Score</span>
            </li>
        </ul>
      </div>
       <style jsx global>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) hsl(var(--background));
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 5px;
        }
      `}</style>
    </div>
  );
};

export default AIMindMapDisplay;
