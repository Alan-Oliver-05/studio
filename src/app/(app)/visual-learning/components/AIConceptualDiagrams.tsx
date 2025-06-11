
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Search, 
  Download, 
  Zap, 
  Eye, 
  EyeOff, 
  Share2,
  Sun,
  Leaf,
  Heart,
  Atom,
  Droplets,
  Lightbulb,
  BookOpen,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw as ResetIcon,
  Camera as ImageIconLucide, // Renamed from Image to avoid conflict
  FileText,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InitialNodeData } from '@/types';


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
  aiType?: string; 
}

interface DiagramElement {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
  icon?: string;
  color: string; 
}

interface DiagramConnection {
  from: string;
  to: string;
  type: string;
  label?: string;
}

interface Diagram {
  title: string;
  type: string;
  elements: DiagramElement[];
  connections: DiagramConnection[];
  generatedAt?: string;
  query?: string;
  aiConfidence?: number;
}

const MANUAL_NODE_COLOR = 'hsl(var(--primary))'; 
const AI_NODE_COLOR = 'hsl(var(--chart-3))'; 
const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;
const ZOOM_SENSITIVITY = 0.001;

const DEFAULT_ROOT_NODE_DIAGRAM_COMPONENT: Node = { // Renamed to avoid conflict with other default root nodes
  id: 'root',
  text: 'AI Learning Map',
  x: 100,
  y: 150,
  type: 'root',
  color: MANUAL_NODE_COLOR,
  aiGenerated: false
};


const AIConceptualDiagrams = () => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [diagramHistory, setDiagramHistory] = useState<Diagram[]>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);
  
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(250); 
  const [translateY, setTranslateY] = useState(150);

  const [nodes, setNodes] = useState<Node[]>([DEFAULT_ROOT_NODE_DIAGRAM_COMPONENT]); // For AIMindMapDisplay if integrated, not directly used here
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null); // For AIMindMapDisplay
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null); // For AIMindMapDisplay
  const [dragInfo, setDragInfo] = useState<{ type: 'node' | 'canvas', id?: string, offset: { x: number, y: number }, startCoords: { x: number, y: number }} | null>(null); // For AIMindMapDisplay


  const diagramTemplates: Record<string, Diagram> = {
    photosynthesis: {
      title: "Photosynthesis Process",
      type: "biological",
      elements: [
        { id: 'sun', type: 'source', x: 100, y: 50, label: 'Sunlight (Light Energy)', icon: 'sun', color: 'hsl(var(--chart-4))' },
        { id: 'leaf', type: 'organ', x: 300, y: 150, label: 'Leaf (Chloroplast)', icon: 'leaf', color: 'hsl(var(--chart-2))' },
        { id: 'co2', type: 'input', x: 150, y: 100, label: 'CO₂ (Carbon Dioxide)', color: 'hsl(var(--muted-foreground))' },
        { id: 'h2o', type: 'input', x: 200, y: 250, label: 'H₂O (Water)', icon: 'droplets', color: 'hsl(var(--chart-1))' },
        { id: 'glucose', type: 'output', x: 450, y: 150, label: 'C₆H₁₂O₆ (Glucose)', color: 'hsl(var(--chart-4))' },
        { id: 'oxygen', type: 'output', x: 400, y: 80, label: 'O₂ (Oxygen)', color: 'hsl(var(--destructive))' },
        { id: 'equation', type: 'formula', x: 250, y: 350, label: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂', color: 'hsl(var(--chart-3))' }
      ],
      connections: [
        { from: 'sun', to: 'leaf', type: 'energy', label: 'Light Energy' },
        { from: 'co2', to: 'leaf', type: 'input', label: 'Absorbed' },
        { from: 'h2o', to: 'leaf', type: 'input', label: 'Absorbed' },
        { from: 'leaf', to: 'glucose', type: 'output', label: 'Produces' },
        { from: 'leaf', to: 'oxygen', type: 'output', label: 'Releases' }
      ]
    },
    heartCirculation: {
      title: "Heart Circulation System",
      type: "anatomical",
      elements: [
        { id: 'heart', type: 'organ', x: 300, y: 200, label: 'Heart', icon: 'heart', color: 'hsl(var(--destructive))' },
        { id: 'lungs', type: 'organ', x: 150, y: 150, label: 'Lungs', color: 'hsl(var(--chart-1))' },
        { id: 'body', type: 'system', x: 450, y: 200, label: 'Body Tissues', color: 'hsl(var(--chart-2))' },
        { id: 'oxygenated', type: 'flow', x: 200, y: 100, label: 'Oxygenated Blood', color: 'hsl(var(--destructive))' },
        { id: 'deoxygenated', type: 'flow', x: 400, y: 300, label: 'Deoxygenated Blood', color: 'hsl(var(--primary))' }
      ],
      connections: [
        { from: 'heart', to: 'lungs', type: 'pulmonary', label: 'Pulmonary Circulation' },
        { from: 'lungs', to: 'heart', type: 'pulmonary', label: 'Oxygenated Return' },
        { from: 'heart', to: 'body', type: 'systemic', label: 'Systemic Circulation' },
        { from: 'body', to: 'heart', type: 'systemic', label: 'Venous Return' }
      ]
    },
    atomStructure: {
      title: "Atomic Structure",
      type: "physics",
      elements: [
        { id: 'nucleus', type: 'core', x: 300, y: 200, label: 'Nucleus', color: 'hsl(var(--destructive))' },
        { id: 'proton', type: 'particle', x: 280, y: 180, label: 'Proton (+)', color: 'hsl(var(--destructive))' },
        { id: 'neutron', type: 'particle', x: 320, y: 220, label: 'Neutron (0)', color: 'hsl(var(--muted-foreground))' },
        { id: 'electron1', type: 'particle', x: 200, y: 150, label: 'Electron (-)', icon: 'atom', color: 'hsl(var(--chart-1))' },
        { id: 'electron2', type: 'particle', x: 250, y: 300, label: 'Electron (-)', icon: 'atom', color: 'hsl(var(--chart-1))' },
        { id: 'orbit', type: 'path', x: 300, y: 200, label: 'Electron Shell', color: 'hsl(var(--chart-3))' }
      ],
      connections: [
        { from: 'nucleus', to: 'electron1', type: 'attraction', label: 'Electromagnetic Force' },
        { from: 'nucleus', to: 'electron2', type: 'attraction', label: 'Electromagnetic Force' }
      ]
    }
  };

  const analyzeQuery = (inputQuery: string): string | null => {
    const q = inputQuery.toLowerCase();
    const patterns: Record<string, string[]> = {
      photosynthesis: ['photosynthesis', 'plant', 'chlorophyll', 'glucose', 'sunlight', 'co2'],
      heartCirculation: ['heart', 'blood', 'circulation', 'cardiovascular', 'pulse'],
      atomStructure: ['atom', 'electron', 'proton', 'neutron', 'nucleus', 'atomic'],
    };
    let bestMatch: string | null = null;
    let maxMatches = 0;
    for (const [type, keywords] of Object.entries(patterns)) {
      const matches = keywords.filter(keyword => q.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = type;
      }
    }
    return bestMatch;
  };

  const generateCustomDiagram = (userQuery: string): Diagram => {
    return {
      title: `AI Generated: ${userQuery.substring(0,25)}${userQuery.length > 25 ? '...' : ''}`,
      type: "custom",
      elements: [
        { id: 'main', type: 'concept', x: 300, y: 200, label: 'Main Concept', color: 'hsl(var(--chart-3))' },
        { id: 'factor1', type: 'factor', x: 150, y: 150, label: 'Factor 1', color: 'hsl(var(--chart-2))' },
        { id: 'factor2', type: 'factor', x: 450, y: 150, label: 'Factor 2', color: 'hsl(var(--chart-4))' },
        { id: 'result1', type: 'result', x: 200, y: 300, label: 'Result 1', color: 'hsl(var(--destructive))' },
      ],
      connections: [
        { from: 'factor1', to: 'main', type: 'input', label: 'Influences' },
        { from: 'factor2', to: 'main', type: 'input', label: 'Influences' },
        { from: 'main', to: 'result1', type: 'output', label: 'Produces' },
      ]
    };
  };

  const handleGenerateDiagram = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); 

    const diagramKey = analyzeQuery(query);
    let newDiagram: Diagram;

    if (diagramKey && diagramTemplates[diagramKey]) {
      newDiagram = diagramTemplates[diagramKey];
    } else {
      newDiagram = generateCustomDiagram(query);
    }
    
    newDiagram.generatedAt = new Date().toISOString();
    newDiagram.query = query;
    newDiagram.aiConfidence = Math.random() * 0.3 + 0.7; 

    setCurrentDiagram(newDiagram);
    setDiagramHistory(prev => [newDiagram, ...prev.slice(0, 4)]);
    setIsGenerating(false);
  };

  const renderElement = (element: DiagramElement) => {
    const getIcon = (iconName?: string) => {
      const iconMap: Record<string, React.ElementType> = {
        sun: Sun, leaf: Leaf, heart: Heart, droplets: Droplets, atom: Atom
      };
      const IconComponent = iconName ? iconMap[iconName] : Lightbulb;
      return <IconComponent className="w-5 h-5" />;
    };
    const isHovered = hoveredElement === element.id;

    return (
      <TooltipProvider key={element.id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <g 
            onMouseEnter={() => setHoveredElement(element.id)}
            onMouseLeave={() => setHoveredElement(null)}
            className="cursor-pointer"
          >
            <circle
              cx={element.x}
              cy={element.y}
              r={element.type === 'organ' ? 35 : element.type === 'formula' ? 50 : 28}
              fill={`${element.color.replace(')', ', 0.2)').replace('hsl(','hsla(')}`} 
              stroke={element.color}
              strokeWidth={isHovered ? 2.5 : 1.5}
              className="transition-all duration-150"
            />
            {element.icon && (
              <foreignObject x={element.x - 10} y={element.y - 10} width="20" height="20" style={{ color: element.color, pointerEvents: 'none' }}>
                  {getIcon(element.icon)}
              </foreignObject>
            )}
            {showLabels && (
              <text
                x={element.x}
                y={element.y + (element.type === 'formula' ? 60 : 40)}
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize={element.type === 'formula' ? '10' : '9'}
                fontWeight="500"
                className="pointer-events-none select-none"
              >
                {element.label.length > 18 ? element.label.substring(0, 15) + '...' : element.label}
              </text>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg text-xs">
          <p className="font-semibold">{element.label}</p>
          <p>Type: {element.type}</p>
        </TooltipContent>
      </Tooltip>
      </TooltipProvider>
    );
  };

  const renderConnection = (connection: DiagramConnection) => {
    if (!currentDiagram) return null;
    const fromEl = currentDiagram.elements.find(e => e.id === connection.from);
    const toEl = currentDiagram.elements.find(e => e.id === connection.to);
    if (!fromEl || !toEl) return null;

    const dx = toEl.x - fromEl.x;
    const dy = toEl.y - fromEl.y;
    const angle = Math.atan2(dy, dx);
    const fromRadius = fromEl.type === 'organ' ? 35 : fromEl.type === 'formula' ? 50 : 28;
    const toRadius = toEl.type === 'organ' ? 35 : toEl.type === 'formula' ? 50 : 28;

    const startX = fromEl.x + Math.cos(angle) * (fromRadius + 2);
    const startY = fromEl.y + Math.sin(angle) * (fromRadius + 2);
    const endX = toEl.x - Math.cos(angle) * (toRadius + 5);
    const endY = toEl.y - Math.sin(angle) * (toRadius + 5);
    
    const arrowColor = 'hsl(var(--muted-foreground))';

    return (
      <g key={`${connection.from}-${connection.to}`}>
        <defs>
          <marker id={`arrow-${connection.from}-${connection.to}`} viewBox="0 0 10 10" refX="8" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3 L 0 6 z" fill={arrowColor} />
          </marker>
        </defs>
        <line
          x1={startX} y1={startY} x2={endX} y2={endY}
          stroke={arrowColor} strokeWidth="1.5"
          markerEnd={`url(#arrow-${connection.from}-${connection.to})`}
        />
        {showLabels && connection.label && (
          <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 6} textAnchor="middle" fill={arrowColor} fontSize="8" fontWeight="500" className="pointer-events-none">
            {connection.label}
          </text>
        )}
      </g>
    );
  };

  const exampleQueries = [
    "Diagram photosynthesis with legible labels", "Show heart circulation system", "Create atomic structure diagram", "Explain water cycle process", "Draw digestive system overview"
  ];
  
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target !== canvasRef.current) return; 
    const svg = canvasRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    const transformedPoint = {
        x: (e.clientX - CTM.e) / CTM.a,
        y: (e.clientY - CTM.f) / CTM.d
    };
    
    setDragInfo({
      type: 'canvas',
      offset: { x: 0, y: 0 }, 
      startCoords: { x: e.clientX, y: e.clientY } 
    });
  };
  
  const handleNodeMouseDown = (e: React.MouseEvent<SVGGElement>, node: DiagramElement) => { // Changed Node to DiagramElement
    e.stopPropagation(); 
    if (editingNodeId) return; // Assuming editingNodeId is for text input, not relevant here directly but good practice
    const svg = canvasRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
     if (!CTM) return;

    const transformedPoint = {
        x: (e.clientX - CTM.e) / CTM.a,
        y: (e.clientY - CTM.f) / CTM.d
    };

    setDragInfo({
      type: 'node',
      id: node.id,
      offset: { x: transformedPoint.x - node.x, y: transformedPoint.y - node.y },
      startCoords: { x: transformedPoint.x, y: transformedPoint.y }
    });
    // setSelectedNodeId(node.id); // Assuming setSelectedNodeId still relevant for other interactions
  };


  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragInfo) return;
    e.preventDefault();
    
    const svg = canvasRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    const transformedPoint = {
        x: (e.clientX - CTM.e) / CTM.a,
        y: (e.clientY - CTM.f) / CTM.d
    };


    if (dragInfo.type === 'node' && dragInfo.id && currentDiagram) {
      const newX = transformedPoint.x - dragInfo.offset.x;
      const newY = transformedPoint.y - dragInfo.offset.y;
      setCurrentDiagram(prevDiagram => prevDiagram ? ({
        ...prevDiagram,
        elements: prevDiagram.elements.map(el => el.id === dragInfo.id ? { ...el, x: newX, y: newY } : el)
      }) : null);
    } else if (dragInfo.type === 'canvas') {
      const dx = e.clientX - dragInfo.startCoords.x;
      const dy = e.clientY - dragInfo.startCoords.y;
      setTranslateX(prev => prev + dx / scale); // Adjust translation by scaled delta
      setTranslateY(prev => prev + dy / scale);
      setDragInfo(prev => prev ? { ...prev, startCoords: { x: e.clientX, y: e.clientY }} : null);
    }
  };

  const handleMouseUp = () => {
    setDragInfo(null);
  };
  
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const svg = canvasRef.current;
    const rect = svg.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - translateX) / scale; // Mouse position relative to current view
    const mouseY = (e.clientY - rect.top - translateY) / scale;

    const newScale = Math.min(Math.max(scale - e.deltaY * ZOOM_SENSITIVITY * scale, MIN_SCALE), MAX_SCALE);
    
    const newTranslateX = translateX - (mouseX * (newScale - scale));
    const newTranslateY = translateY - (mouseY * (newScale - scale));

    setScale(newScale);
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);
  };
  
  const zoom = (factor: number) => {
     if (!canvasRef.current) return;
     const svg = canvasRef.current;
     const rect = svg.getBoundingClientRect();
     const centerX = (rect.width / 2 - translateX) / scale; // Center of the viewport relative to current view
     const centerY = (rect.height / 2 - translateY) / scale;

     const newScale = Math.min(Math.max(scale * factor, MIN_SCALE), MAX_SCALE);
     setTranslateX(translateX - (centerX * (newScale - scale)));
     setTranslateY(translateY - (centerY * (newScale - scale)));
     setScale(newScale);
  };

  const resetView = () => {
    setScale(1);
    setTranslateX(250); 
    setTranslateY(150);
  };


  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      <TooltipProvider>
      <div className="bg-card border-b border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-7 h-7 text-purple-500" />
            <div>
              <h1 className="text-lg font-bold text-foreground">AI Conceptual Diagrams</h1>
              <p className="text-xs text-muted-foreground">Generate educational diagrams with AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowLabels(!showLabels)} 
                          className={cn("w-9 h-9 rounded-lg", showLabels ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                    {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{showLabels ? 'Hide' : 'Show'} Labels</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-green-600">
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download Diagram (SVG)</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-purple-600">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share Diagram</p></TooltipContent>
              </Tooltip>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { handleGenerateDiagram(); } }}
              placeholder="E.g., 'Diagram photosynthesis with legible labels'"
              className="w-full pl-10 pr-4 py-2 text-sm h-10 rounded-lg border-input focus-visible:ring-purple-500 bg-background" 
            />
          </div>
          <Button
            onClick={handleGenerateDiagram}
            disabled={isGenerating || !query.trim()}
            style={{ backgroundColor: 'hsl(var(--chart-3))' }} 
            className="w-full sm:w-auto text-primary-foreground rounded-lg h-10 px-6 text-sm hover:opacity-90" 
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Generate
          </Button>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {exampleQueries.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => {setQuery(example); handleGenerateDiagram();}}
              className="text-xs px-3 py-1 h-auto rounded-full border-border hover:border-primary/70 hover:bg-primary/5 hover:text-primary text-muted-foreground"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
      </TooltipProvider>

      {/* Main Canvas */}
      <div className="flex-grow overflow-auto p-2 sm:p-4 relative">
        <svg 
            ref={canvasRef} 
            width="100%" 
            height="100%" 
            className="bg-muted/30 dark:bg-slate-800/30 rounded-lg border border-border shadow-inner min-h-[400px] sm:min-h-[500px]"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp} 
            onMouseDown={handleCanvasMouseDown} 
            onWheel={handleWheel}
        >
         <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {currentDiagram && (
            <>
              {currentDiagram.connections?.map(renderConnection)}
              {currentDiagram.elements.map(renderElement)}
              <text x={currentDiagram.elements[0]?.x || 400} y={(currentDiagram.elements[0]?.y || 30) - 50} textAnchor="middle" className="fill-foreground text-lg font-semibold select-none pointer-events-none">
                {currentDiagram.title}
              </text>
              {currentDiagram.aiConfidence && (
                <g transform={`translate(${(currentDiagram.elements[0]?.x || 400) + 200}, ${(currentDiagram.elements[0]?.y || 10) - 60})`}>
                  <rect x="0" y="0" width="135" height="35" rx="17.5" className="fill-background/80 stroke-border pointer-events-none" />
                  <text x="67.5" y="14" textAnchor="middle" className="fill-muted-foreground text-xs font-medium select-none pointer-events-none">
                    AI Confidence
                  </text>
                  <text x="67.5" y="29" textAnchor="middle" style={{fill: 'hsl(var(--chart-3))'}} className="text-sm font-bold select-none pointer-events-none">
                    {Math.round(currentDiagram.aiConfidence * 100)}%
                  </text>
                </g>
              )}
            </>
          )}
          {!currentDiagram && !isGenerating && (
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="fill-muted-foreground text-base select-none pointer-events-none">
              Enter a query above to generate a diagram. Try: "Photosynthesis"
            </text>
          )}
          {isGenerating && (
             <text x="50%" y="50%" textAnchor="middle" dy=".3em" style={{fill: 'hsl(var(--chart-3))'}} className="text-base select-none animate-pulse pointer-events-none">
                🤖 AI is thinking... Please wait.
            </text>
          )}
          </g>
        </svg>
         {/* Zoom Controls & Download */}
       <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
         <TooltipProvider>
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
         </TooltipProvider>
      </div>
      </div>
      
      {diagramHistory.length > 0 && (
        <div className="absolute bottom-6 right-6 bg-card rounded-xl shadow-lg p-3 max-w-[220px] border border-border z-10">
          <h3 className="font-semibold text-sm text-foreground mb-1.5 flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Recent Diagrams</span>
          </h3>
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
            {diagramHistory.map((diagram, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDiagram(diagram)}
                className="w-full text-left justify-start p-1.5 h-auto bg-muted/50 hover:bg-muted"
              >
                <div className="text-xs text-foreground truncate flex-grow">{diagram.title}</div>
                {diagram.query && <div className="text-xs text-muted-foreground truncate ml-1 opacity-70">({diagram.query.substring(0,10)}...)</div>}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConceptualDiagrams;

// Styles for scrollbar (can be in globals.css or a <style jsx global> tag if preferred)
// .scrollbar-thin {
//   scrollbar-width: thin;
//   scrollbar-color: hsl(var(--border)) hsl(var(--background));
// }
// .scrollbar-thin::-webkit-scrollbar {
//   width: 6px;
// }
// .scrollbar-thin::-webkit-scrollbar-track {
//   background: hsl(var(--background));
// }
// .scrollbar-thin::-webkit-scrollbar-thumb {
//   background-color: hsl(var(--border));
//   border-radius: 3px;
// }

    