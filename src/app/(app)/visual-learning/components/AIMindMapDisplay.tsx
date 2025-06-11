
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Upload, FileText, Image as ImageIconLucide, Brain, Loader2, Camera, ZoomIn, ZoomOut, RotateCcw as ResetIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import type { InitialNodeData } from '@/types'; // Import the shared type


// Node interface internal to this component
interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  type: 'root' | 'leaf' | 'detail';
  color: string;
  aiGenerated: boolean;
  parentId?: string;
  confidence?: number;
  aiType?: string; // Used for smart suggestions logic
}

interface AIMindMapDisplayProps {
  initialTopic?: string;
  initialNodes?: InitialNodeData[]; // Use the shared type
}

const MANUAL_NODE_COLOR = 'hsl(var(--primary))'; 
const AI_NODE_COLOR = 'hsl(var(--chart-3))'; // Purple from theme
const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;
const ZOOM_SENSITIVITY = 0.001;

const DEFAULT_ROOT_NODE: Node = {
  id: 'root',
  text: 'AI Learning Map',
  x: 100,
  y: 150,
  type: 'root',
  color: MANUAL_NODE_COLOR,
  aiGenerated: false
};

const AIMindMapDisplay: React.FC<AIMindMapDisplayProps> = ({ initialTopic, initialNodes }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { ...DEFAULT_ROOT_NODE, text: initialTopic || DEFAULT_ROOT_NODE.text }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [dragInfo, setDragInfo] = useState<{ type: 'node' | 'canvas', id?: string, offset: { x: number, y: number }, startCoords: { x: number, y: number }} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialNodesProcessedRef = useRef(false); // Ref to track if initialNodes have been processed

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(50); 
  const [translateY, setTranslateY] = useState(50); 

  useEffect(() => {
    if (initialTopic && (!initialNodes || initialNodes.length === 0) && !initialNodesProcessedRef.current) {
      setNodes(prevNodes => {
        const rootExists = prevNodes.some(n => n.id === 'root');
        if (rootExists) {
          return prevNodes.map(node =>
            node.id === 'root' ? { ...node, text: initialTopic, color: MANUAL_NODE_COLOR } : node
          );
        }
        return [{ ...DEFAULT_ROOT_NODE, text: initialTopic }];
      });
    }
  }, [initialTopic, initialNodes]);


  useEffect(() => {
    if (initialNodes && initialNodes.length > 0 && !initialNodesProcessedRef.current) {
      const transformedInitialNodes: Node[] = [];
      let currentY = 50; // Initial Y for root
      const xSpacing = 220;
      const ySpacing = 50;
      let rootNodePresent = false;

      // Find or create root node
      const rootData = initialNodes.find(n => n.type === 'root' || n.id === 'root');
      if (rootData) {
        transformedInitialNodes.push({
          id: rootData.id,
          text: rootData.text,
          x: 50, // Fixed position for root
          y: currentY,
          type: 'root',
          color: rootData.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR,
          aiGenerated: rootData.aiGenerated || false,
          parentId: undefined
        });
        currentY += ySpacing * 2;
        rootNodePresent = true;
      } else if (initialTopic) {
         transformedInitialNodes.push({ ...DEFAULT_ROOT_NODE, text: initialTopic, x:50, y: currentY });
         currentY += ySpacing * 2;
         rootNodePresent = true;
      } else {
         transformedInitialNodes.push({ ...DEFAULT_ROOT_NODE, x:50, y: currentY });
         currentY += ySpacing * 2;
         rootNodePresent = true;
      }
      
      const rootId = transformedInitialNodes[0].id;

      // Add children of the root
      initialNodes.filter(n => n.parentId === rootId && n.id !== rootId).forEach((nodeData, index) => {
        transformedInitialNodes.push({
          id: nodeData.id,
          text: nodeData.text,
          x: 50 + xSpacing,
          y: transformedInitialNodes[0].y + (index * ySpacing) - (initialNodes.filter(n => n.parentId === rootId).length -1) * ySpacing / 2,
          type: nodeData.type || 'leaf',
          color: nodeData.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR,
          aiGenerated: nodeData.aiGenerated || false,
          parentId: rootId
        });
      });
      
      // Add other nodes (grand-children, etc.), very simple layout
      initialNodes.filter(n => n.parentId && n.parentId !== rootId && !transformedInitialNodes.find(tn => tn.id === n.id)).forEach(nodeData => {
          const parentNode = transformedInitialNodes.find(pn => pn.id === nodeData.parentId);
          if (parentNode) {
              const siblings = initialNodes.filter(s => s.parentId === nodeData.parentId);
              const siblingIndex = siblings.findIndex(s => s.id === nodeData.id);
               transformedInitialNodes.push({
                  id: nodeData.id,
                  text: nodeData.text,
                  x: parentNode.x + xSpacing,
                  y: parentNode.y + (siblingIndex * ySpacing) - (siblings.length -1) * ySpacing / 2,
                  type: nodeData.type || 'leaf',
                  color: nodeData.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR,
                  aiGenerated: nodeData.aiGenerated || false,
                  parentId: nodeData.parentId
              });
          }
      });


      setNodes(transformedInitialNodes);
      initialNodesProcessedRef.current = true; // Mark as processed
    }
  }, [initialNodes, initialTopic]);


  const getTransformedPoint = useCallback((screenX: number, screenY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = screenX;
    point.y = screenY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return {x: 0, y: 0}; // Guard against null CTM
    const transformedPoint = point.matrixTransform(ctm.inverse());
    return {
        x: (transformedPoint.x - translateX) / scale,
        y: (transformedPoint.y - translateY) / scale
    };
  }, [translateX, translateY, scale]);


  const analyzeContent = useCallback(async (file: File) => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const fileType = file.type;
    let suggestions: { text: string, type: string, confidence: number }[] = [];
    
    if (fileType.startsWith('image/')) {
      suggestions = [
        { text: 'Visual Concept A', type: 'concept', confidence: Math.random() * 0.2 + 0.75 },
        { text: 'Key Object 1', type: 'topic', confidence: Math.random() * 0.2 + 0.7 },
        { text: 'Image Style Detail', type: 'visual', confidence: Math.random() * 0.2 + 0.65 }
      ];
    } else if (fileType === 'application/pdf' || fileType.startsWith('text/')) {
      suggestions = [
        { text: 'Main Theme from Doc', type: 'objective', confidence: Math.random() * 0.2 + 0.78 },
        { text: 'Important Definition', type: 'definition', confidence: Math.random() * 0.2 + 0.72 },
        { text: 'Question from Content', type: 'exercise', confidence: Math.random() * 0.2 + 0.68 },
        { text: 'Summary Point X', type: 'summary', confidence: Math.random() * 0.2 + 0.75 }
      ];
    } else {
      suggestions = [{ text: `Insight from ${file.name.substring(0,15)}...`, type: 'general', confidence: Math.random() * 0.2 + 0.6 }];
    }
    
    setIsProcessing(false);
    return suggestions;
  }, []);

  const generateDetailNodes = useCallback((parentId: string, parentColor: string, aiType: string | undefined) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    let subNodesContent: { text: string }[] = [];
    
    switch (aiType) {
      case 'concept': subNodesContent = [ { text: 'Core Principle 1' }, { text: 'Related Idea X' }, { text: 'Application Z' } ]; break;
      case 'topic': subNodesContent = [ { text: 'Sub-topic Alpha' }, { text: 'Sub-topic Beta' } ]; break;
      case 'objective': subNodesContent = [ { text: 'Key Goal 1' }, { text: 'Specific Goal 2' } ]; break;
      default: subNodesContent = [ { text: 'Further Detail A' }, { text: 'Further Detail B' } ];
    }

    const detailNodesToAdd = subNodesContent.map((sub, index) => ({
      id: `detail_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      text: sub.text,
      x: parentNode.x + 200,
      y: parentNode.y + (index * 35) - ((subNodesContent.length -1) * 35 / 2),
      type: 'detail' as 'detail',
      color: parentColor, 
      parentId,
      aiGenerated: true
    }));
    
    setNodes(prevNodes => [...prevNodes, ...detailNodesToAdd]);
  }, [nodes]);

  const generateNodesFromAnalysis = useCallback((analysisSuggestions: {text: string, type: string, confidence: number}[], parentId = 'root') => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newGeneratedNodesData: Node[] = analysisSuggestions.map((suggestion, index) => {
      const yOffset = (nodes.filter(n => n.parentId === parentId).length + index) * 50 - (analysisSuggestions.length > 1 ? ((analysisSuggestions.length-1)*50/2) : 0);
      return {
        id: `ai_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        text: `${suggestion.text} (${Math.round(suggestion.confidence * 100)}%)`,
        x: parentNode.x + 250,
        y: parentNode.y + yOffset,
        type: 'leaf' as 'leaf',
        color: AI_NODE_COLOR,
        parentId,
        aiGenerated: true,
        confidence: suggestion.confidence,
        aiType: suggestion.type
      };
    });

    setNodes(prevNodes => [...prevNodes, ...newGeneratedNodesData]);
    
    setTimeout(() => {
      newGeneratedNodesData.forEach(node => {
        if (node.confidence && node.confidence > 0.85 && node.aiType) {
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
    if (!parentId && nodes.length > 0) parentId = nodes[0].id; // Default to first node if no parentId and nodes exist
    else if (!parentId && nodes.length === 0) { // Edge case: adding first node if canvas is empty
        const newNode: Node = {
            id: Date.now().toString() + Math.random().toString(36).substr(2,5),
            text, x: 50, y: 50, type: 'root', color: MANUAL_NODE_COLOR, aiGenerated: false
        };
        setNodes([newNode]);
        return;
    }
    
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
      color: MANUAL_NODE_COLOR,
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
      color: AI_NODE_COLOR,
      parentId,
      aiGenerated: true 
    };
    setNodes(prev => [...prev, newNode]);
  };

  const updateNodeText = (id: string, newText: string) => {
    setNodes(prevNodes => prevNodes.map(node => 
      node.id === id ? { ...node, text: newText } : node
    ));
  };

  const deleteNode = (id: string) => {
    if (id === 'root' && nodes.find(n=>n.id === 'root')?.type === 'root') return; // Prevent deleting the main root if it's the only root
    
    const childrenIdsToDelete: string[] = [];
    const findChildrenRecursive = (currentParentId: string) => {
        nodes.forEach(node => {
            if (node.parentId === currentParentId) {
                childrenIdsToDelete.push(node.id);
                findChildrenRecursive(node.id); // Recursively find children of children
            }
        });
    };
    findChildrenRecursive(id); // Find all descendants of the node to be deleted

    setNodes(prevNodes => prevNodes.filter(node => node.id !== id && !childrenIdsToDelete.includes(node.id)));
    setSelectedNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent<SVGGElement>, node: Node) => {
    e.stopPropagation(); 
    if (editingNodeId) return;
    const transformedPoint = getTransformedPoint(e.clientX, e.clientY);
    setDragInfo({
      type: 'node',
      id: node.id,
      offset: { x: transformedPoint.x - node.x, y: transformedPoint.y - node.y },
      startCoords: { x: transformedPoint.x, y: transformedPoint.y }
    });
    setSelectedNodeId(node.id);
  };
  
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only pan if clicking directly on svg background, not on nodes or other elements
    if (e.target !== svgRef.current) return; 
    // Do not deselect node if it was just selected by clicking on it (handleNodeMouseDown sets selectedNodeId)
    // If the click target is the SVG itself, then deselect.
    if (e.target === svgRef.current && !dragInfo) { // dragInfo check helps distinguish from node drag end
        setSelectedNodeId(null);
    }
    const transformedPoint = getTransformedPoint(e.clientX, e.clientY);
    setDragInfo({
      type: 'canvas',
      offset: { x: 0, y: 0 }, 
      startCoords: { x: e.clientX, y: e.clientY } 
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragInfo) return;
    e.preventDefault();

    if (dragInfo.type === 'node' && dragInfo.id) {
      const transformedPoint = getTransformedPoint(e.clientX, e.clientY);
      const newX = transformedPoint.x - dragInfo.offset.x;
      const newY = transformedPoint.y - dragInfo.offset.y;
      setNodes(prevNodes => prevNodes.map(n => n.id === dragInfo.id ? { ...n, x: newX, y: newY } : n));
    } else if (dragInfo.type === 'canvas') {
      const dx = e.clientX - dragInfo.startCoords.x;
      const dy = e.clientY - dragInfo.startCoords.y;
      setTranslateX(prev => prev + dx);
      setTranslateY(prev => prev + dy);
      setDragInfo(prev => prev ? { ...prev, startCoords: { x: e.clientX, y: e.clientY }} : null);
    }
  };

  const handleMouseUp = () => {
    setDragInfo(null);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    // Calculate mouse position relative to the SVG element
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.min(Math.max(scale - e.deltaY * ZOOM_SENSITIVITY * scale, MIN_SCALE), MAX_SCALE);
    
    // Zoom towards mouse pointer
    const newTranslateX = mouseX - (mouseX - translateX) * (newScale / scale);
    const newTranslateY = mouseY - (mouseY - translateY) * (newScale / scale);

    setScale(newScale);
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);
  };

  const zoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const centerX = rect.width / 2; // Zoom towards center of viewport
    const centerY = rect.height / 2;
    
    const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);
    setTranslateX(centerX - (centerX - translateX) * (newScale / scale));
    setTranslateY(centerY - (centerY - translateY) * (newScale / scale));
    setScale(newScale);
  };

  const resetView = () => {
    setScale(1);
    setTranslateX(50); // Reset to initial pan
    setTranslateY(50);
  };


  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      const parentNode = nodes.find(n => n.id === node.parentId);
      if (!parentNode) return null;

      const nodeWidth = node.type === 'root' ? 120 : Math.min(Math.max(node.text.length * 7 + 20, 100), 300); // Adjusted width for text
      const parentNodeWidth = parentNode.type === 'root' ? 120 : Math.min(Math.max(parentNode.text.length * 7 + 20, 100), 300);
      
      // Calculate connection points from center of right/left edges of the rounded rect
      const startX = parentNode.x + parentNodeWidth; // Right edge of parent
      const startY = parentNode.y + 17.5; // Vertical center of parent
      const endX = node.x; // Left edge of child
      const endY = node.y + 17.5; // Vertical center of child
      
      // Simple Bezier curve calculation
      const controlX1 = startX + Math.max(50, (endX - startX) * 0.4);
      const controlY1 = startY;
      const controlX2 = endX - Math.max(50, (endX - startX) * 0.4);
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
    const nodeWidth = node.type === 'root' ? 120 : Math.min(Math.max(node.text.length * 7 + 30, 100), 300); // Increased min width slightly
    const nodeFill = node.color;
    const textColor = 'hsl(var(--primary-foreground))'; // Use primary-foreground for text on colored backgrounds
    const strokeColor = node.color; // Use node's main color for stroke
    const isAIDerived = node.aiGenerated || node.type === 'detail';


    return (
      <g key={node.id} className="select-none cursor-grab active:cursor-grabbing" onMouseDown={(e) => handleNodeMouseDown(e, node)}>
        <rect
          x={node.x}
          y={node.y}
          width={nodeWidth}
          height={35} // Standard height
          rx={17.5} // Fully rounded ends
          fill={nodeFill}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 2}
          className={cn("transition-all duration-200", isSelected ? 'drop-shadow-lg' : 'opacity-90 hover:opacity-100')}
          strokeDasharray={isAIDerived && node.type !== 'root' ? "6,3" : "none"} // Dashed for AI/detail
        />
        
        {node.confidence && node.aiGenerated && (
          <Brain 
            className="w-3 h-3 opacity-80" 
            fill="hsl(var(--primary-foreground))"
            strokeWidth={0.5}
            x={node.x + nodeWidth - 22} 
            y={node.y + 5}
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {!isEditing ? (
          <text
            x={node.x + 15} // Padding from left
            y={node.y + 22.5} // Vertically centered
            fill={textColor}
            fontSize="11"
            fontWeight={node.type === 'root' ? '600' : '500'}
            className="pointer-events-none select-none"
            onDoubleClick={() => node.type !== 'root' && setEditingNodeId(node.id)}
          >
            {/* Truncate text if it's too long for the node width */}
            {node.text.length > ((nodeWidth - (node.aiGenerated && node.confidence ? 45 : 30))/7) // Adjust truncation based on icon presence
              ? node.text.substring(0, Math.floor((nodeWidth - (node.aiGenerated && node.confidence ? 45:30))/7 - 3)) + '...' 
              : node.text}
          </text>
        ) : (
          <foreignObject x={node.x + 5} y={node.y + 5} width={nodeWidth - 10} height={25}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="h-full">
                <input
                type="text"
                value={node.text}
                onChange={(e) => updateNodeText(node.id, e.target.value)}
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
        
        {/* Action buttons: visible when node is selected and not being edited */}
        {isSelected && !isEditing && (
          <g transform={`translate(${node.x + nodeWidth + 5}, ${node.y + 17.5})`} className="cursor-pointer">
            <Tooltip>
              <TooltipTrigger asChild>
                <circle cx={10} cy={0} r={10} fill="hsl(var(--primary))" className="hover:opacity-80" onClick={(e) => { e.stopPropagation(); addNode(node.id); }}>
                  <Plus className="text-primary-foreground w-3 h-3" x={10 - 6} y={0 - 6} />
                </circle>
              </TooltipTrigger>
              <TooltipContent><p>Add child node</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <circle cx={32} cy={0} r={10} fill="hsl(var(--chart-3))" className="hover:opacity-80" onClick={(e) => { e.stopPropagation(); addSmartNode(node.id);}}>
                  <Brain className="text-primary-foreground w-3 h-3"  x={32 - 6} y={0 - 6} />
                </circle>
              </TooltipTrigger>
               <TooltipContent><p>AI Smart Add</p></TooltipContent>
            </Tooltip>
          </g>
        )}
        {isSelected && !isEditing && node.id !== 'root' && ( // Edit and Delete buttons for non-root selected nodes
             <g transform={`translate(${node.x - 15}, ${node.y + 17.5})`} className="cursor-pointer">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle cx={0} cy={-9} r={8} fill="hsl(var(--secondary))" className="hover:opacity-80" onClick={(e) => {e.stopPropagation(); setEditingNodeId(node.id);}}>
                        <Edit2 className="text-secondary-foreground w-2.5 h-2.5" x={0-5} y={-9-5} />
                    </circle>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit node</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle cx={0} cy={9} r={8} fill="hsl(var(--destructive))" className="hover:opacity-80" onClick={(e) => {e.stopPropagation(); deleteNode(node.id);}}>
                        <Trash2 className="text-destructive-foreground w-2.5 h-2.5" x={0-5} y={9-5} />
                    </circle>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete node</p></TooltipContent>
                </Tooltip>
            </g>
        )}
      </g>
    );
  };

  return (
    <TooltipProvider>
    <div className="w-full h-[70vh] bg-slate-100 dark:bg-slate-900/70 relative overflow-hidden rounded-lg border border-border shadow-inner">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-background dark:bg-slate-800 rounded-xl shadow-xl p-3 md:p-4 w-60 md:w-64 border border-border">
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="w-6 h-6 text-purple-500 flex-shrink-0" />
          <h2 className="text-base md:text-lg font-semibold text-foreground truncate">AI Mind Map</h2>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            {showUploadPanel ? "Hide Upload Panel" : "Upload & Analyze"}
          </Button>
          
          {showUploadPanel && (
            <div className="bg-muted/50 dark:bg-slate-700/50 p-2.5 rounded-md border border-border">
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              <div className="grid grid-cols-2 gap-1.5">
                <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs"><FileText className="w-3.5 h-3.5 mr-1" />Docs</Button>
                <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs"><ImageIconLucide className="w-3.5 h-3.5 mr-1" />Images</Button>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center space-x-1.5 text-sm text-primary p-1.5 bg-primary/10 rounded-md">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI analyzing...</span>
            </div>
          )}
          
          <ul className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
            <li>• AI nodes from uploads.</li>
            <li>• Purple button: AI suggestions.</li>
            <li>• Dashed border: AI content.</li>
          </ul>
        </div>
      </div>

    {/* Uploaded Files Panel - simplified */}
      {uploadedFiles.length > 0 && (
        <div className="absolute top-4 right-4 z-10 bg-background dark:bg-slate-800 rounded-xl shadow-xl p-2.5 max-w-[180px] border border-border">
          <h3 className="text-xs font-semibold text-foreground mb-1">Analyzed Files:</h3>
          <div className="space-y-1 max-h-20 overflow-y-auto text-xs pr-1 scrollbar-thin">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-1 text-muted-foreground">
                {file.type.startsWith('image/') ? <Camera className="w-3 h-3 text-primary flex-shrink-0" /> : <FileText className="w-3 h-3 text-green-600 flex-shrink-0" />}
                <span className="truncate" title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Zoom Controls */}
       <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5">
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoom(1.25)} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-9 w-9 border-border"><ZoomIn className="h-4 w-4 text-foreground" /></Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Zoom In</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoom(0.8)} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-9 w-9 border-border"><ZoomOut className="h-4 w-4 text-foreground" /></Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Zoom Out</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={resetView} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-9 w-9 border-border"><ResetIcon className="h-4 w-4 text-foreground" /></Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Reset View</p></TooltipContent>
        </Tooltip>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-10 bg-background dark:bg-slate-800 rounded-lg shadow-md p-2.5 border border-border">
        <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: MANUAL_NODE_COLOR}}></div>
                <span className="text-foreground">Manual Nodes</span>
            </li>
            <li className="flex items-center space-x-1.5">
                <div className="w-3 h-3 rounded-sm" style={{backgroundColor: AI_NODE_COLOR}}></div>
                <span className="text-foreground">AI Generated</span>
            </li>
            <li className="flex items-center space-x-1.5">
                <Brain className="w-3 h-3" style={{color: AI_NODE_COLOR}} />
                <span className="text-foreground">AI Score</span>
            </li>
        </ul>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Important to stop drag if mouse leaves SVG
        onMouseDown={handleCanvasMouseDown} // For canvas panning and deselecting nodes
        onWheel={handleWheel} // For zoom
      >
        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
            {renderConnections()}
            {nodes.map(node => renderNode(node))}
        </g>
      </svg>
       <style jsx global>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) hsl(var(--background));
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent; /* Or hsl(var(--muted)) if you prefer a visible track */
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 5px;
        }
      `}</style>
    </div>
    </TooltipProvider>
  );
};

export default AIMindMapDisplay;
