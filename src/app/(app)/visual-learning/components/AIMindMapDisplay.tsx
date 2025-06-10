
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Upload, FileText, Image as ImageIconLucide, Brain, Loader2, Camera, Book, Lightbulb, Target, Users, DollarSign, Flame, BookOpen, Rocket, Code, Calculator, Type } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Assuming button is used, or remove
import { cn } from '@/lib/utils';

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
  initialTopic?: string; // Optional: to set the root node text
}

const AIMindMapDisplay: React.FC<AIMindMapDisplayProps> = ({ initialTopic }) => {
  const [nodes, setNodes] = useState<Node[]>([
    {
      id: 'root',
      text: initialTopic || 'AI Learning Map',
      x: 100,
      y: 300,
      type: 'root',
      color: '#3b82f6', // blue-500
      aiGenerated: false
    }
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [aiSuggestions, setAISuggestions] = useState<{text: string, type: string, confidence: number}[]>([]);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect to update root node if initialTopic changes
  useEffect(() => {
    if (initialTopic) {
      setNodes(prevNodes =>
        prevNodes.map(node =>
          node.id === 'root' ? { ...node, text: initialTopic } : node
        )
      );
    }
  }, [initialTopic]);

  // Simulated AI content analysis
  const analyzeContent = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const fileType = file.type;
    let suggestions = [];
    
    if (fileType.startsWith('image/')) {
      suggestions = [
        { text: 'Visual Concepts Identified', type: 'concept', confidence: 0.95 },
        { text: 'Geometric Shapes', type: 'topic', confidence: 0.88 },
        { text: 'Mathematical Formulas', type: 'formula', confidence: 0.92 },
        { text: 'Diagrams & Charts', type: 'visual', confidence: 0.85 }
      ];
    } else if (fileType === 'application/pdf' || fileType.startsWith('text/')) {
      suggestions = [
        { text: 'Key Learning Objectives', type: 'objective', confidence: 0.93 },
        { text: 'Important Definitions', type: 'definition', confidence: 0.87 },
        { text: 'Practice Problems', type: 'exercise', confidence: 0.91 },
        { text: 'Summary Points', type: 'summary', confidence: 0.89 }
      ];
    }
    
    setIsProcessing(false);
    return suggestions;
  }, []);

  const generateDetailNodes = useCallback((parentId: string, aiType: string | undefined) => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    let subNodesContent: { text: string, icon: string }[] = [];
    
    switch (aiType) {
      case 'concept':
        subNodesContent = [ { text: 'Core Principles', icon: '🎯' }, { text: 'Related Topics', icon: '🔗' }, { text: 'Applications', icon: '⚡' } ];
        break;
      case 'formula':
        subNodesContent = [ { text: 'Variables & Constants', icon: '📊' }, { text: 'Step-by-step Solution', icon: '📝' }, { text: 'Example Problems', icon: '💡' } ];
        break;
      case 'objective':
        subNodesContent = [ { text: 'Learning Goals', icon: '🎯' }, { text: 'Assessment Criteria', icon: '✅' }, { text: 'Required Skills', icon: '🛠️' } ];
        break;
      default:
        subNodesContent = [ { text: 'Key Points', icon: '⭐' }, { text: 'Examples', icon: '📋' } ];
    }

    const detailNodesToAdd = subNodesContent.map((sub, index) => ({
      id: `detail_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
      text: `${sub.icon} ${sub.text}`,
      x: parentNode.x + 200,
      y: parentNode.y + (index * 35) - ((subNodesContent.length -1) * 35 / 2), // Center vertically
      type: 'detail' as 'detail',
      color: parentNode.color,
      parentId,
      aiGenerated: true
    }));
    
    setNodes(prevNodes => [...prevNodes, ...detailNodesToAdd]);
  }, [nodes]);


  // Auto-generate mind map nodes from AI analysis
  const generateNodesFromAnalysis = useCallback((analysisSuggestions: {text: string, type: string, confidence: number}[], parentId = 'root') => {
    const parentNode = nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newGeneratedNodes: Node[] = analysisSuggestions.map((suggestion, index) => {
      const colors: Record<string, string> = {
        concept: '#10b981', topic: '#f59e0b', formula: '#8b5cf6', visual: '#06b6d4',
        objective: '#ef4444', definition: '#84cc16', exercise: '#f97316', summary: '#6b7280'
      };
      const yOffset = (nodes.filter(n => n.parentId === parentId).length + index) * 50 - (analysisSuggestions.length > 1 ? ((analysisSuggestions.length-1)*50/2) : 0);

      return {
        id: `ai_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`,
        text: `${suggestion.text} (${Math.round(suggestion.confidence * 100)}%)`,
        x: parentNode.x + 250,
        y: parentNode.y + yOffset,
        type: 'leaf' as 'leaf',
        color: colors[suggestion.type] || '#6b7280',
        parentId,
        aiGenerated: true,
        confidence: suggestion.confidence,
        aiType: suggestion.type
      };
    });

    setNodes(prevNodes => [...prevNodes, ...newGeneratedNodes]);
    
    setTimeout(() => {
      newGeneratedNodes.forEach(node => {
        if (node.confidence && node.confidence > 0.9 && node.aiType) {
          generateDetailNodes(node.id, node.aiType);
        }
      });
    }, 1000);
  }, [nodes, generateDetailNodes]);


  // Handle file upload
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const currentFiles = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...currentFiles]);
    
    for (const file of currentFiles) {
      const analysisSuggestions = await analyzeContent(file);
      setAISuggestions(prev => [...prev, ...analysisSuggestions]); // Store raw suggestions if needed
      generateNodesFromAnalysis(analysisSuggestions, selectedNodeId || 'root');
    }
  }, [analyzeContent, generateNodesFromAnalysis, selectedNodeId]);

  // Smart content suggestions based on existing nodes
  const getSmartSuggestions = (nodeText: string): string[] => {
    const suggestionsPool: Record<string, string[]> = {
      'math': ['Algebra', 'Geometry', 'Calculus', 'Statistics'],
      'science': ['Physics', 'Chemistry', 'Biology', 'Earth Science'],
      'history': ['Ancient History', 'Modern History', 'World Wars', 'Civilizations'],
      'language': ['Grammar', 'Vocabulary', 'Literature', 'Writing Skills']
    };
    
    const lowerText = nodeText.toLowerCase();
    for (const [category, items] of Object.entries(suggestionsPool)) {
      if (lowerText.includes(category)) {
        return items;
      }
    }
    return ['Key Concept', 'Supporting Detail', 'Example', 'Question'];
  };

  const addNode = (parentId: string | undefined, text = 'New Node') => {
    if (!parentId) parentId = 'root'; // Default to root if no parentId
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
      color: parentNode.color,
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
    addNode(parentId, `🤖 ${randomSuggestion}`);
  };

  const updateNode = (id: string, updates: Partial<Node>) => {
    setNodes(prevNodes => prevNodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    ));
  };

  const deleteNode = (id: string) => {
    if (id === 'root') return; // Cannot delete root
    // Recursively find all children to delete
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
    
    setDragOffset({
      x: x - node.x,
      y: y - node.y
    });
    setSelectedNodeId(node.id);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !selectedNodeId || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    updateNode(selectedNodeId, {
      x: x - dragOffset.x,
      y: y - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderConnections = () => {
    return nodes.map(node => {
      if (!node.parentId) return null;
      
      const parentNode = nodes.find(n => n.id === node.parentId);
      if (!parentNode) return null;

      const startX = parentNode.x + (parentNode.type === 'root' ? 120 : Math.min(Math.max(parentNode.text.length * 7, 120), 350)); // width of parent
      const startY = parentNode.y + 17.5; // Mid-height of node (35/2)
      const endX = node.x;
      const endY = node.y + 17.5;
      
      const controlX1 = startX + (endX - startX) * 0.5;
      const controlY1 = startY;
      const controlX2 = startX + (endX - startX) * 0.5;
      const controlY2 = endY;

      return (
        <path
          key={`${parentNode.id}-${node.id}`}
          d={`M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`}
          stroke={node.color}
          strokeWidth={node.aiGenerated ? 3 : 2}
          fill="none"
          className="transition-all duration-200"
          strokeDasharray={node.aiGenerated ? "5,5" : "none"}
        />
      );
    });
  };

  const renderNode = (node: Node) => {
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingNodeId === node.id;
    const nodeWidth = node.type === 'root' ? 120 : Math.min(Math.max(node.text.length * 7 + 20, 120), 350); // +20 for padding
    
    return (
      <g key={node.id} className="select-none">
        <rect
          x={node.x}
          y={node.y}
          width={nodeWidth}
          height={35}
          rx={17}
          fill={node.type === 'root' ? node.color : node.aiGenerated ? `${node.color}20` : 'hsl(var(--card))'}
          stroke={node.color}
          strokeWidth={node.type === 'root' ? 0 : node.aiGenerated ? 3 : 2}
          className={cn("transition-all duration-200 cursor-grab", isSelected ? 'drop-shadow-lg' : '', isDragging && selectedNodeId === node.id && 'cursor-grabbing')}
          onMouseDown={(e) => handleMouseDown(e, node)}
          strokeDasharray={node.aiGenerated && node.type !== 'root' ? "8,4" : "none"}
        />
        
        {node.aiGenerated && node.type !== 'root' && (
          <Brain 
            className="w-3 h-3 text-purple-500 opacity-70" 
            x={node.x + nodeWidth - 20} 
            y={node.y + 5}
            style={{ pointerEvents: 'none' }}
          />
        )}
        
        {!isEditing ? (
          <text
            x={node.x + 10}
            y={node.y + 22}
            fill={node.type === 'root' ? 'hsl(var(--primary-foreground))' : node.color}
            fontSize="11"
            fontWeight={node.type === 'root' ? 'bold' : node.aiGenerated ? '600' : 'normal'}
            className="pointer-events-none select-none"
            onDoubleClick={() => node.type !== 'root' && setEditingNodeId(node.id)}
          >
            {node.text.length > (nodeWidth/7 - 2) ? node.text.substring(0, Math.floor(nodeWidth/7 - 5)) + '...' : node.text}
          </text>
        ) : (
          <foreignObject x={node.x + 5} y={node.y + 5} width={nodeWidth - 10} height={25}>
             {/* Namespace for foreignObject content to avoid conflicts with SVG */}
            <div xmlns="http://www.w3.org/1999/xhtml" className="h-full">
                <input
                type="text"
                value={node.text}
                onChange={(e) => updateNode(node.id, { text: e.target.value })}
                onBlur={() => setEditingNodeId(null)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditingNodeId(null);
                    if (e.key === 'Escape') setEditingNodeId(null);
                }}
                className="w-full h-full px-1 text-xs border border-blue-300 rounded-sm outline-none bg-white text-black"
                autoFocus
                />
            </div>
          </foreignObject>
        )}
        
        {isSelected && !isEditing && (
          <g>
            <circle cx={node.x + nodeWidth + 15} cy={node.y + 17.5} r={10} fill="#10b981" className="cursor-pointer hover:fill-green-600" onClick={() => addNode(node.id)}>
              <title>Add child node</title>
              <Plus className="text-white w-3 h-3 relative top-[3px] left-[3px]" x={node.x + nodeWidth + 15 - 6} y={node.y + 17.5 -6} />
            </circle>
            <circle cx={node.x + nodeWidth + 40} cy={node.y + 17.5} r={10} fill="#8b5cf6" className="cursor-pointer hover:fill-purple-600" onClick={() => addSmartNode(node.id)}>
              <title>AI Smart Add</title>
              <Brain className="text-white w-3 h-3"  x={node.x + nodeWidth + 40 - 6} y={node.y + 17.5 -6} />
            </circle>
            {node.id !== 'root' && (
                <>
                <circle cx={node.x - 15} cy={node.y + 8} r={8} fill="#3b82f6" className="cursor-pointer hover:fill-blue-600" onClick={() => setEditingNodeId(node.id)}>
                    <title>Edit node</title>
                    <Edit2 className="text-white w-2.5 h-2.5" x={node.x - 15 -5} y={node.y + 8 -5} />
                </circle>
                <circle cx={node.x - 15} cy={node.y + 27} r={8} fill="#ef4444" className="cursor-pointer hover:fill-red-600" onClick={() => deleteNode(node.id)}>
                    <title>Delete node</title>
                    <Trash2 className="text-white w-2.5 h-2.5" x={node.x - 15 -5} y={node.y + 27 -5} />
                </circle>
                </>
            )}
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-[calc(100vh-10rem)] md:h-[calc(100vh-12rem)] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-purple-900 dark:to-pink-900 relative overflow-hidden rounded-lg shadow-inner border">
      {/* AI Control Panel */}
      <div className="absolute top-2 left-2 z-10 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-[280px]">
        <div className="flex items-center space-x-1.5 mb-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h2 className="text-md font-semibold text-foreground">AI Mind Map Tools</h2>
        </div>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="w-full text-xs"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {showUploadPanel ? "Hide Upload Panel" : "Upload & Analyze Content"}
          </Button>
          
          {showUploadPanel && (
            <div className="bg-muted/50 p-2.5 rounded-md border">
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
              <div className="grid grid-cols-2 gap-1.5">
                <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs"><FileText className="w-3 h-3 mr-1" />Docs</Button>
                <Button size="xs" variant="secondary" onClick={() => fileInputRef.current?.click()} className="text-xs"><ImageIconLucide className="w-3 h-3 mr-1" />Images</Button>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center space-x-1.5 text-xs text-blue-600 dark:text-blue-400 p-1.5 bg-blue-500/10 rounded-md">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI analyzing...</span>
            </div>
          )}
          
          <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t mt-1.5">
            <p className="flex items-center"><Plus className="w-2.5 h-2.5 mr-1 text-green-500"/> Add node manually.</p>
            <p className="flex items-center"><Brain className="w-2.5 h-2.5 mr-1 text-purple-500"/> Use AI smart add.</p>
            <p>Dashed borders = AI auto-generated.</p>
          </div>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-card/80 backdrop-blur-sm rounded-lg shadow-lg p-2.5 max-w-[200px]">
          <h3 className="text-xs font-semibold text-foreground mb-1.5">Analyzed Files:</h3>
          <div className="space-y-1 max-h-28 overflow-y-auto text-[10px] pr-1">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center space-x-1.5 text-muted-foreground">
                {file.type.startsWith('image/') ? <Camera className="w-3 h-3 text-blue-500 flex-shrink-0" /> : <FileText className="w-3 h-3 text-green-500 flex-shrink-0" />}
                <span className="truncate" title={file.name}>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <svg ref={svgRef} width="100%" height="100%" className="cursor-grab active:cursor-grabbing" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        {/* Connections rendered first so nodes are on top */}
        {renderConnections()}
        {/* Nodes */}
        {nodes.map(node => renderNode(node))}
      </svg>

      {/* Legend - simplified or could be part of the control panel */}
      <div className="absolute bottom-2 right-2 bg-card/70 backdrop-blur-sm rounded-md shadow p-2 text-[10px] text-muted-foreground">
        <p>Drag nodes to move. Double-click text to edit.</p>
        <p>Use buttons on selected node for actions.</p>
      </div>
    </div>
  );
};

export default AIMindMapDisplay;


    