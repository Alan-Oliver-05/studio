
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Upload, FileText, Image as ImageIconLucide, Brain, Loader2, Camera, ZoomIn, ZoomOut, RotateCcw as ResetIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InitialNodeData } from '@/types'; 


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
  aiType?: string; 
}

interface AIMindMapDisplayProps {
  initialTopic?: string;
  initialNodes?: InitialNodeData[]; 
}

const MANUAL_NODE_COLOR = 'hsl(var(--primary))'; 
const AI_NODE_COLOR = 'hsl(var(--chart-3))'; 
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
  const initialNodesProcessedRef = useRef(false); 

  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(50); 
  const [translateY, setTranslateY] = useState(50); 

  useEffect(() => {
    if (initialNodesProcessedRef.current) { 
        let newNodes: Node[] = [];
        let rootNodeExists = false;

        if (initialNodes && initialNodes.length > 0) {
            const rootData = initialNodes.find(n => n.type === 'root' || n.id === 'root');
            if (rootData) {
                 newNodes.push({
                    id: rootData.id, text: rootData.text,
                    x: rootData.x !== undefined ? rootData.x : 50, 
                    y: rootData.y !== undefined ? rootData.y : 150,
                    type: 'root', color: rootData.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR,
                    aiGenerated: rootData.aiGenerated || false, parentId: undefined
                });
                rootNodeExists = true;
            }
            
            const rootIdToUse = rootNodeExists ? newNodes[0].id : (initialTopic ? 'root' : DEFAULT_ROOT_NODE.id);
            
            initialNodes.filter(n => n.id !== newNodes[0]?.id).forEach((nodeData, index) => {
                const parentNode = newNodes.find(pn => pn.id === nodeData.parentId) || (rootNodeExists ? newNodes[0] : null);
                const xSpacing = 200; const ySpacing = 45; // Slightly reduced spacing for mobile
                newNodes.push({
                    id: nodeData.id, text: nodeData.text,
                    x: nodeData.x !== undefined ? nodeData.x : (parentNode ? parentNode.x + xSpacing : 50 + xSpacing * (index + 1)),
                    y: nodeData.y !== undefined ? nodeData.y : (parentNode ? parentNode.y + (index - (initialNodes.filter(n=>n.parentId === nodeData.parentId).length-1)/2) * ySpacing : 150 + index * ySpacing),
                    type: nodeData.type || 'leaf', color: nodeData.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR,
                    aiGenerated: nodeData.aiGenerated || false, parentId: nodeData.parentId || (rootNodeExists ? newNodes[0].id : undefined)
                });
            });
        }
        
        if (!rootNodeExists) { 
            const existingRootIndex = nodes.findIndex(n => n.id === 'root');
            const rootText = initialTopic || (newNodes.length > 0 ? newNodes[0].text : DEFAULT_ROOT_NODE.text);
            if (existingRootIndex > -1 && newNodes.length === 0) { 
                newNodes = [{...nodes[existingRootIndex], text: rootText }];
            } else if (newNodes.length === 0) { 
                 newNodes.push({ ...DEFAULT_ROOT_NODE, text: rootText, x:50, y:150 });
            } else if (newNodes.length > 0 && newNodes[0].id !== 'root') { 
                 const newRootNode = { ...DEFAULT_ROOT_NODE, text: rootText, x:50, y:150 };
                 newNodes = [newRootNode, ...newNodes.map(n => ({...n, parentId: n.parentId || newRootNode.id}))];
            }
        }
        setNodes(newNodes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic, initialNodes]);


  useEffect(() => {
    if (initialNodes && initialNodes.length > 0 && !initialNodesProcessedRef.current) {
      const transformedInitialNodes: Node[] = [];
      let currentY = 150; 
      const xSpacing = 200; // Adjusted for smaller screens
      const ySpacing = 45;  // Adjusted
      let rootNodePresent = false;

      const rootData = initialNodes.find(n => n.type === 'root' || n.id === 'root');
      if (rootData) {
        transformedInitialNodes.push({
          id: rootData.id,
          text: rootData.text,
          x: rootData.x !== undefined ? rootData.x : 50, 
          y: rootData.y !== undefined ? rootData.y : currentY,
          type: 'root',
          color: rootData.aiGenerated ? AI_NODE_COLOR : (rootData.color || MANUAL_NODE_COLOR),
          aiGenerated: rootData.aiGenerated || false,
          parentId: undefined
        });
        currentY = transformedInitialNodes[0].y + ySpacing * 1.5; // Adjusted
        rootNodePresent = true;
      } else if (initialTopic) {
         transformedInitialNodes.push({ ...DEFAULT_ROOT_NODE, text: initialTopic, x:50, y: currentY });
         currentY += ySpacing * 1.5; // Adjusted
         rootNodePresent = true;
      } else {
         transformedInitialNodes.push({ ...DEFAULT_ROOT_NODE, x:50, y: currentY });
         currentY += ySpacing * 1.5; // Adjusted
         rootNodePresent = true;
      }
      
      const rootId = transformedInitialNodes[0].id;

      initialNodes.filter(n => n.id !== rootId).forEach((nodeData, index) => { 
        const parentNode = transformedInitialNodes.find(pn => pn.id === nodeData.parentId) || (rootNodePresent ? transformedInitialNodes[0] : null);
        transformedInitialNodes.push({
          id: nodeData.id,
          text: nodeData.text,
          x: nodeData.x !== undefined ? nodeData.x : (parentNode ? parentNode.x + xSpacing : 50 + xSpacing * (index + 1)),
          y: nodeData.y !== undefined ? nodeData.y : (parentNode ? parentNode.y + (initialNodes.filter(nSib => nSib.parentId === nodeData.parentId).findIndex(s => s.id === nodeData.id) - (initialNodes.filter(nSib => nSib.parentId === nodeData.parentId).length -1)/2) * ySpacing : currentY + index * ySpacing),
          type: nodeData.type || 'leaf',
          color: nodeData.aiGenerated ? AI_NODE_COLOR : (nodeData.color || MANUAL_NODE_COLOR),
          aiGenerated: nodeData.aiGenerated || false,
          parentId: nodeData.parentId || (rootNodePresent ? rootId : undefined)
        });
      });

      setNodes(transformedInitialNodes);
      initialNodesProcessedRef.current = true; 
    } else if (!initialNodes && initialTopic && !initialNodesProcessedRef.current) {
        setNodes([{...DEFAULT_ROOT_NODE, text: initialTopic, x: 50, y: 150}]);
        initialNodesProcessedRef.current = true;
    } else if (!initialNodesProcessedRef.current && (!initialNodes || initialNodes.length === 0) && !initialTopic) {
        setNodes([{...DEFAULT_ROOT_NODE, x: 50, y: 150}]);
        initialNodesProcessedRef.current = true;
    }
  }, [initialNodes, initialTopic]);


  const getTransformedPoint = useCallback((screenX: number, screenY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const point = svg.createSVGPoint();
    point.x = screenX;
    point.y = screenY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return {x: 0, y: 0}; 
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
      x: parentNode.x + 180, // Reduced x offset
      y: parentNode.y + (index * 30) - ((subNodesContent.length -1) * 30 / 2), // Reduced y spacing
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
      const yOffset = (nodes.filter(n => n.parentId === parentId).length + index) * 45 - (analysisSuggestions.length > 1 ? ((analysisSuggestions.length-1)*45/2) : 0); // Reduced y spacing
      return {
        id: `ai_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        text: `${suggestion.text} (${Math.round(suggestion.confidence * 100)}%)`,
        x: parentNode.x + 220, // Reduced x offset
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
     event.target.value = ''; 
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
    if (!parentId && nodes.length > 0) parentId = nodes[0].id; 
    else if (!parentId && nodes.length === 0) { 
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
    const yOffset = (siblings.length) * 35 - (siblings.length > 0 ? ((siblings.length -1) * 35 / 2) : 0); // Reduced y spacing

    const newNode: Node = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      text,
      x: parentNode.x + 200, // Reduced x offset
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
    const yOffset = (siblings.length) * 35 - (siblings.length > 0 ? ((siblings.length -1) * 35 / 2) : 0); // Reduced y spacing

    const newNode: Node = {
      id: `ai_smart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      text: `🤖 ${randomSuggestion}`,
      x: parentNode.x + 200, // Reduced x offset
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
    if (id === 'root' && nodes.find(n=>n.id === 'root')?.type === 'root') return; 
    
    const childrenIdsToDelete: string[] = [];
    const findChildrenRecursive = (currentParentId: string) => {
        nodes.forEach(node => {
            if (node.parentId === currentParentId) {
                childrenIdsToDelete.push(node.id);
                findChildrenRecursive(node.id); 
            }
        });
    };
    findChildrenRecursive(id); 

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
    if (e.target !== svgRef.current) return; 
    if (e.target === svgRef.current && !dragInfo) { 
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
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.min(Math.max(scale - e.deltaY * ZOOM_SENSITIVITY * scale, MIN_SCALE), MAX_SCALE);
    
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
    const centerX = rect.width / 2; 
    const centerY = rect.height / 2;
    
    const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);
    setTranslateX(centerX - (centerX - translateX) * (newScale / scale));
    setTranslateY(centerY - (centerY - translateY) * (newScale / scale));
    setScale(newScale);
  };

  const resetView = () => {
    setScale(1);
    setTranslateX(50); 
    setTranslateY(50);
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgElement = svgRef.current;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(source);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    const rootNode = nodes.find(n => n.type === 'root');
    const filenameTopic = rootNode ? rootNode.text : initialTopic || 'mindmap';
    downloadLink.download = `${filenameTopic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };


  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      const parentNode = nodes.find(n => n.id === node.parentId);
      if (!parentNode) return null;

      const nodeWidth = node.type === 'root' ? 100 : Math.min(Math.max(node.text.length * 6 + 20, 80), 250); // Adjusted node width
      const parentNodeWidth = parentNode.type === 'root' ? 100 : Math.min(Math.max(parentNode.text.length * 6 + 20, 80), 250); // Adjusted
      
      const startX = parentNode.x + parentNodeWidth; 
      const startY = parentNode.y + 15; // Adjusted center
      const endX = node.x; 
      const endY = node.y + 15; // Adjusted center
      
      const controlX1 = startX + Math.max(40, (endX - startX) * 0.4);
      const controlY1 = startY;
      const controlX2 = endX - Math.max(40, (endX - startX) * 0.4);
      const controlY2 = endY;

      return (
        <path
          key={`${parentNode.id}-${node.id}`}
          d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
          stroke={node.aiGenerated ? AI_NODE_COLOR : MANUAL_NODE_COLOR}
          strokeWidth={1.5} // Thinner line
          fill="none"
          className="transition-all duration-200"
          strokeDasharray={node.type === 'detail' ? "2,2" : "none"} // Adjusted dash
        />
      );
    });
  };

  const renderNode = (node: Node) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const nodeWidth = node.type === 'root' ? 100 : Math.min(Math.max(node.text.length * 6 + 20, 80), 250); // Adjusted
    const nodeHeight = 30; // Fixed height
    const nodeFill = node.color;
    const textColor = 'hsl(var(--primary-foreground))'; 
    const strokeColor = node.color; 
    const isAIDerived = node.aiGenerated || node.type === 'detail';


    return (
      <g key={node.id} className="select-none cursor-grab active:cursor-grabbing" onMouseDown={(e) => handleNodeMouseDown(e, node)}>
        <rect
          x={node.x}
          y={node.y}
          width={nodeWidth}
          height={nodeHeight} 
          rx={nodeHeight / 2} 
          fill={nodeFill}
          stroke={strokeColor}
          strokeWidth={isSelected ? 2.5 : 1.5} // Adjusted stroke
          className={cn("transition-all duration-200", isSelected ? 'drop-shadow-md' : 'opacity-90 hover:opacity-100')}
          strokeDasharray={isAIDerived && node.type !== 'root' ? "4,2" : "none"} // Adjusted dash
        />
        
        {node.confidence && node.aiGenerated && (
          <Brain 
            className="w-2.5 h-2.5 opacity-80" 
            fill="hsl(var(--primary-foreground))"
            strokeWidth={0.5}
            x={node.x + nodeWidth - 18} 
            y={node.y + 4}
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {!isEditing ? (
          <text
            x={node.x + 12} 
            y={node.y + (nodeHeight / 2) + 3.5} // Vertically center text
            fill={textColor}
            fontSize="10" // Smaller font
            fontWeight={node.type === 'root' ? '600' : '500'}
            className="pointer-events-none select-none"
            onDoubleClick={() => node.type !== 'root' && setEditingNodeId(node.id)}
          >
            {node.text.length > ((nodeWidth - (node.aiGenerated && node.confidence ? 35 : 24))/6) // Adjusted truncation
              ? node.text.substring(0, Math.floor((nodeWidth - (node.aiGenerated && node.confidence ? 35:24))/6 - 2)) + '...' 
              : node.text}
          </text>
        ) : (
          <foreignObject x={node.x + 4} y={node.y + 4} width={nodeWidth - 8} height={nodeHeight - 8}>
            <div xmlns="http://www.w3.org/1999/xhtml" className="h-full">
                <input
                type="text"
                value={node.text}
                onChange={(e) => updateNodeText(node.id, e.target.value)}
                onBlur={() => setEditingNodeId(null)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === 'Escape') setEditingNodeId(null);
                }}
                className="w-full h-full px-2 text-[10px] border border-slate-400 rounded-sm outline-none bg-white text-black" // Smaller font
                autoFocus
                />
            </div>
          </foreignObject>
        )}
        
        {isSelected && !isEditing && (
          <g transform={`translate(${node.x + nodeWidth + 4}, ${node.y + (nodeHeight / 2)})`} className="cursor-pointer">
            <Tooltip>
              <TooltipTrigger asChild>
                <circle cx={8} cy={0} r={8} fill="hsl(var(--primary))" className="hover:opacity-80" onClick={(e) => { e.stopPropagation(); addNode(node.id); }}>
                  <Plus className="text-primary-foreground w-2.5 h-2.5" x={8 - 5} y={0 - 5} />
                </circle>
              </TooltipTrigger>
              <TooltipContent><p>Add child</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <circle cx={25} cy={0} r={8} fill="hsl(var(--chart-3))" className="hover:opacity-80" onClick={(e) => { e.stopPropagation(); addSmartNode(node.id);}}>
                  <Brain className="text-primary-foreground w-2.5 h-2.5"  x={25 - 5} y={0 - 5} />
                </circle>
              </TooltipTrigger>
               <TooltipContent><p>AI Smart Add</p></TooltipContent>
            </Tooltip>
          </g>
        )}
        {isSelected && !isEditing && node.id !== 'root' && ( 
             <g transform={`translate(${node.x - 12}, ${node.y + (nodeHeight / 2)})`} className="cursor-pointer">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle cx={0} cy={-7} r={7} fill="hsl(var(--secondary))" className="hover:opacity-80" onClick={(e) => {e.stopPropagation(); setEditingNodeId(node.id);}}>
                        <Edit2 className="text-secondary-foreground w-2 h-2" x={0-4} y={-7-4} />
                    </circle>
                  </TooltipTrigger>
                  <TooltipContent><p>Edit</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <circle cx={0} cy={7} r={7} fill="hsl(var(--destructive))" className="hover:opacity-80" onClick={(e) => {e.stopPropagation(); deleteNode(node.id);}}>
                        <Trash2 className="text-destructive-foreground w-2 h-2" x={0-4} y={7-4} />
                    </circle>
                  </TooltipTrigger>
                  <TooltipContent><p>Delete</p></TooltipContent>
                </Tooltip>
            </g>
        )}
      </g>
    );
  };

  return (
    <TooltipProvider>
    <div className="w-full h-full bg-slate-100 dark:bg-slate-900/70 relative overflow-hidden rounded-lg border border-border shadow-inner">
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-10 bg-background dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-xl p-2 sm:p-3 w-full max-w-[calc(100%-1rem)] sm:max-w-xs md:w-64 lg:w-72 border border-border">
        <div className="flex items-center space-x-1.5 mb-2">
          <Brain className="w-5 h-5 text-purple-500 flex-shrink-0" />
          <h2 className="text-sm sm:text-base font-semibold text-foreground truncate">AI Mind Map</h2>
        </div>
        
        <div className="space-y-1.5">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="w-full text-xs h-8"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {showUploadPanel ? "Hide Upload" : "Upload & Analyze"}
          </Button>
          
          {showUploadPanel && (
            <div className="bg-muted/50 dark:bg-slate-700/50 p-2 rounded-md border border-border">
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              <div className="grid grid-cols-2 gap-1">
                <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs h-7"><FileText className="w-3 h-3 mr-1" />Docs</Button>
                <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs h-7"><ImageIconLucide className="w-3 h-3 mr-1" />Images</Button>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center space-x-1 text-xs text-primary p-1 bg-primary/10 rounded-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI analyzing...</span>
            </div>
          )}
          
          <ul className="text-xs text-muted-foreground space-y-0.5 pt-1.5 border-t border-border">
            <li>• AI nodes from uploads.</li>
            <li>• Purple button: AI suggestions.</li>
            <li>• Dashed border: AI content.</li>
          </ul>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-background dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-xl p-2 max-w-[120px] sm:max-w-[160px] border border-border">
          <h3 className="text-xs font-semibold text-foreground mb-0.5">Analyzed:</h3>
          <div className="space-y-0.5 max-h-16 sm:max-h-20 overflow-y-auto text-xs pr-0.5 scrollbar-thin">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-1 text-muted-foreground">
                {file.type.startsWith('image/') ? <Camera className="w-2.5 h-2.5 text-primary flex-shrink-0" /> : <FileText className="w-2.5 h-2.5 text-green-600 flex-shrink-0" />}
                <span className="truncate text-[10px]" title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
       <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10 flex flex-col gap-1 sm:gap-1.5">
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoom(1.25)} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 sm:h-9 sm:w-9 border-border"><ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" /></Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Zoom In</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoom(0.8)} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 sm:h-9 sm:w-9 border-border"><ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" /></Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Zoom Out</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={resetView} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 sm:h-9 sm:w-9 border-border"><ResetIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" /></Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Reset View</p></TooltipContent>
        </Tooltip>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDownloadSVG} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 sm:h-9 sm:w-9 border-border">
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="right"><p>Download as SVG</p></TooltipContent>
        </Tooltip>
      </div>

      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-10 bg-background dark:bg-slate-800 rounded-md sm:rounded-lg shadow-md p-1.5 sm:p-2 border border-border">
        <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: MANUAL_NODE_COLOR}}></div>
                <span className="text-foreground text-[10px] sm:text-xs">Manual</span>
            </li>
            <li className="flex items-center space-x-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: AI_NODE_COLOR}}></div>
                <span className="text-foreground text-[10px] sm:text-xs">AI</span>
            </li>
            <li className="flex items-center space-x-1">
                <Brain className="w-2.5 h-2.5" style={{color: AI_NODE_COLOR}} />
                <span className="text-foreground text-[10px] sm:text-xs">AI Score</span>
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
        onMouseLeave={handleMouseUp} 
        onMouseDown={handleCanvasMouseDown} 
        onWheel={handleWheel} 
      >
        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
            {renderConnections()}
            {nodes.map(node => renderNode(node))}
        </g>
      </svg>
      
    </div>
    </TooltipProvider>
  );
};

export default AIMindMapDisplay;
