"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Brain, 
  Search, 
  Download, 
  Zap, 
  Eye, 
  EyeOff, 
  RotateCcw as ResetIcon,
  Lightbulb,
  BookOpen,
  Leaf,
  Heart,
  Atom,
  Sun,
  Droplets,
  Loader2,
  ZoomIn,
  ZoomOut,
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserProfile, Message as MessageType } from '@/types'; // Added MessageType
import { addMessageToConversation } from '@/lib/chat-storage'; // Added import


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

const MIN_SCALE = 0.2;
const MAX_SCALE = 3.0;
const ZOOM_SENSITIVITY = 0.001;

interface AIConceptualDiagramsProps {
  userProfile: UserProfile | null;
  conversationId: string | null;
}

const AIConceptualDiagrams: React.FC<AIConceptualDiagramsProps> = ({ userProfile, conversationId }) => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [diagramHistory, setDiagramHistory] = useState<Diagram[]>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);
  
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0); 
  const [translateY, setTranslateY] = useState(0);
  const [dragInfo, setDragInfo] = useState<{ type: 'node' | 'canvas', id?: string, offset: { x: number, y: number }, startCoords: { x: number, y: number }} | null>(null);


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

  useEffect(() => { 
    if (canvasRef.current && currentDiagram) {
      const svg = canvasRef.current;
      const { width, height } = svg.getBoundingClientRect();
      const initialViewBox = svg.getAttribute('viewBox') || "0 0 800 600";
      const vbParts = initialViewBox.split(" ").map(Number);
      setTranslateX((width - vbParts[2] * scale) / 2);
      setTranslateY((height - vbParts[3] * scale) / 2);
    } else if (canvasRef.current) {
      const svg = canvasRef.current;
      const { width, height } = svg.getBoundingClientRect();
      setTranslateX(width / 2 - 400 * scale); 
      setTranslateY(height / 2 - 300 * scale);
    }
  }, [currentDiagram, scale]); 

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
      title: `AI Diagram: ${userQuery.substring(0,20)}${userQuery.length > 20 ? '...' : ''}`,
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
    
    if (userProfile && conversationId) {
      const userMessage: MessageType = {
        id: crypto.randomUUID(),
        sender: "user",
        text: `Generate diagram for: ${query}`,
        timestamp: Date.now(),
      };
      addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", userMessage, userProfile);
    }

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

    if (userProfile && conversationId) {
      const aiMessageText = `Generated diagram: "${newDiagram.title}". Type: ${newDiagram.type}. AI Confidence: ${Math.round((newDiagram.aiConfidence || 0) * 100)}%.`;
      const aiMessage: MessageType = {
        id: crypto.randomUUID(),
        sender: "ai",
        text: aiMessageText,
        timestamp: Date.now(),
      };
      addMessageToConversation(conversationId, "Visual Learning - Conceptual Diagrams", aiMessage, userProfile);
    }
  };

  const renderElement = (element: DiagramElement) => {
    const getIcon = (iconName?: string) => {
      const iconMap: Record<string, React.ElementType> = {
        sun: Sun, leaf: Leaf, heart: Heart, droplets: Droplets, atom: Atom
      };
      const IconComponent = iconName ? iconMap[iconName] : Lightbulb;
      return <IconComponent className="w-4 h-4" />; // Slightly smaller icon
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
            onMouseDown={(e) => handleNodeMouseDown(e, element)}
          >
            <circle
              cx={element.x}
              cy={element.y}
              r={element.type === 'organ' ? 30 : element.type === 'formula' ? 45 : 25} // Reduced radius
              fill={`${element.color.replace(')', ', 0.2)').replace('hsl(','hsla(')}`} 
              stroke={element.color}
              strokeWidth={isHovered ? 2 : 1.5}
              className="transition-all duration-150"
            />
            {element.icon && (
              <foreignObject x={element.x - 8} y={element.y - 8} width="16" height="16" style={{ color: element.color, pointerEvents: 'none' }}> {/* Adjusted for smaller icon */}
                  {getIcon(element.icon)}
              </foreignObject>
            )}
            {showLabels && (
              <text
                x={element.x}
                y={element.y + (element.type === 'formula' ? 50 : 35)} // Adjusted label position
                textAnchor="middle"
                fill="hsl(var(--foreground))"
                fontSize={element.type === 'formula' ? '9' : '8'} // Reduced font size
                fontWeight="500"
                className="pointer-events-none select-none"
              >
                {element.label.length > 15 ? element.label.substring(0, 12) + '...' : element.label} {/* Shorter truncate */}
              </text>
            )}
          </g>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-popover text-popover-foreground p-1.5 rounded-md shadow-lg text-xs"> {/* Smaller tooltip */}
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
    const fromRadius = fromEl.type === 'organ' ? 30 : fromEl.type === 'formula' ? 45 : 25; // Use reduced radius
    const toRadius = toEl.type === 'organ' ? 30 : toEl.type === 'formula' ? 45 : 25;   // Use reduced radius

    const startX = fromEl.x + Math.cos(angle) * (fromRadius + 2);
    const startY = fromEl.y + Math.sin(angle) * (fromRadius + 2);
    const endX = toEl.x - Math.cos(angle) * (toRadius + 4); // Adjusted end marker offset
    const endY = toEl.y - Math.sin(angle) * (toRadius + 4); 
    
    const arrowColor = 'hsl(var(--muted-foreground))';

    return (
      <g key={`${connection.from}-${connection.to}`}>
        <defs>
          <marker id={`arrow-${connection.from}-${connection.to}`} viewBox="0 0 10 10" refX="7" refY="3" markerWidth="4" markerHeight="4" orient="auto-start-reverse"> {/* Smaller marker */}
            <path d="M 0 0 L 10 3 L 0 6 z" fill={arrowColor} />
          </marker>
        </defs>
        <line
          x1={startX} y1={startY} x2={endX} y2={endY}
          stroke={arrowColor} strokeWidth="1" // Thinner line
          markerEnd={`url(#arrow-${connection.from}-${connection.to})`}
        />
        {showLabels && connection.label && (
          <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 5} textAnchor="middle" fill={arrowColor} fontSize="7" fontWeight="500" className="pointer-events-none"> {/* Smaller font */}
            {connection.label}
          </text>
        )}
      </g>
    );
  };

  const exampleQueries = [
    "Diagram photosynthesis", // Shorter for compact buttons
    "Heart circulation",
    "Atomic structure",
    "Water cycle",
    "Digestive system"
  ];
  
  const handleCanvasMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target !== canvasRef.current) return; 
    const svg = canvasRef.current;
    if (!svg) return;
    
    setDragInfo({
      type: 'canvas',
      offset: { x: 0, y: 0 }, 
      startCoords: { x: e.clientX, y: e.clientY } 
    });
  };
  
  const handleNodeMouseDown = (e: React.MouseEvent<SVGGElement>, node: DiagramElement) => {
    e.stopPropagation(); 
    const svg = canvasRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(CTM.inverse());
    
    setDragInfo({
      type: 'node',
      id: node.id,
      offset: { x: svgP.x - node.x, y: svgP.y - node.y }, 
      startCoords: { x: e.clientX, y: e.clientY } 
    });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragInfo) return;
    e.preventDefault();
    
    const svg = canvasRef.current;
    if (!svg) return;
    const CTM = svg.getScreenCTM();
    if (!CTM) return;

    if (dragInfo.type === 'node' && dragInfo.id && currentDiagram) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const svgP = pt.matrixTransform(CTM.inverse());

      const newX = svgP.x - dragInfo.offset.x;
      const newY = svgP.y - dragInfo.offset.y;
      
      setCurrentDiagram(prevDiagram => prevDiagram ? ({
        ...prevDiagram,
        elements: prevDiagram.elements.map(el => el.id === dragInfo.id ? { ...el, x: newX, y: newY } : el)
      }) : null);

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
    if (!canvasRef.current) return;

    const svg = canvasRef.current;
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
     if (!canvasRef.current) return;
     const svg = canvasRef.current;
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
    if (canvasRef.current) {
        const svg = canvasRef.current;
        const { width, height } = svg.getBoundingClientRect();
        const vbParts = (svg.getAttribute('viewBox') || "0 0 800 600").split(" ").map(Number);
        setTranslateX((width - vbParts[2]) / 2);
        setTranslateY((height - vbParts[3]) / 2);
    } else {
        setTranslateX(0); 
        setTranslateY(0);
    }
  };

  const handleDownloadSVG = () => {
    if (!canvasRef.current || !currentDiagram) return;

    const svgElement = canvasRef.current.cloneNode(true) as SVGSVGElement;
    
    const gWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gWrapper.setAttribute("transform", `translate(${translateX}, ${translateY}) scale(${scale})`);

    const originalG = svgElement.querySelector('g');
    if (originalG) {
        while (originalG.firstChild) {
            gWrapper.appendChild(originalG.firstChild);
        }
        svgElement.replaceChild(gWrapper, originalG);
    } else {
        while (svgElement.firstChild) {
          if (svgElement.firstChild.nodeName === 'g') { 
             const mainGroup = svgElement.firstChild as SVGGElement;
             while(mainGroup.firstChild) {
                gWrapper.appendChild(mainGroup.firstChild);
             }
             mainGroup.appendChild(gWrapper);
             break;
          }
          svgElement.removeChild(svgElement.firstChild); 
        }
        if (!svgElement.querySelector('g')) { 
            svgElement.appendChild(gWrapper);
        }
    }

    const viewBox = svgElement.getAttribute("viewBox")?.split(" ").map(Number) || [0, 0, 800, 600];
    svgElement.setAttribute("width", viewBox[2].toString());
    svgElement.setAttribute("height", viewBox[3].toString());
    
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        text { font-family: var(--font-geist-sans), Arial, sans-serif; }
    `;
    svgElement.insertBefore(styleEl, svgElement.firstChild);

    let source = new XMLSerializer().serializeToString(svgElement);

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    const filename = (currentDiagram.title || "conceptual_diagram").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadLink.download = `${filename}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      <TooltipProvider>
      <div className="bg-card border-b border-border shadow-sm p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5">
            <Brain className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-base font-bold text-foreground">AI Conceptual Diagrams</h1>
              <p className="text-xs text-muted-foreground">Generate educational diagrams with AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 mt-2 sm:mt-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowLabels(!showLabels)} 
                          className={cn("w-8 h-8 rounded-md", showLabels ? "bg-blue-100 text-blue-600 dark:bg-primary/20 dark:text-primary" : "text-muted-foreground hover:bg-muted")}>
                    {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{showLabels ? 'Hide' : 'Show'} Labels</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleDownloadSVG} disabled={!currentDiagram}
                          className="w-8 h-8 rounded-md bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-500 dark:hover:bg-green-500/30 disabled:opacity-50">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download Diagram (SVG)</p></TooltipContent>
              </Tooltip>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-1.5">
          <div className="relative flex-grow w-full sm:w-auto">
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && query.trim()) { handleGenerateDiagram(); } }}
              placeholder="E.g., 'Diagram photosynthesis'"
              className="w-full pl-3 pr-9 py-2 text-sm h-9 rounded-md border-input focus-visible:ring-purple-500 bg-background" 
            />
             <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Button
            onClick={handleGenerateDiagram}
            disabled={isGenerating || !query.trim()}
            className="w-full sm:w-auto text-white rounded-md h-9 px-4 text-xs hover:bg-purple-700 bg-purple-600" 
            style={{backgroundColor: 'hsl(var(--chart-3))'}}
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate
          </Button>
        </div>
        
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {exampleQueries.map((example, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => {setQuery(example); handleGenerateDiagram();}}
              className="text-xs px-2.5 py-0.5 h-auto rounded-full border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>
      </TooltipProvider>

      <div className="flex-grow overflow-hidden p-2 relative"> {/* Reduced padding */}
        <svg 
            ref={canvasRef} 
            width="100%" 
            height="100%" 
            className="bg-muted/30 dark:bg-slate-800/30 rounded-lg border border-border shadow-inner min-h-[360px] sm:min-h-[460px] cursor-grab active:cursor-grabbing" // Reduced min-height
            viewBox="0 0 800 600" 
            preserveAspectRatio="xMidYMid meet" 
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
              <text x={currentDiagram.elements[0]?.x || 400} y={(currentDiagram.elements[0]?.y || 30) - 40} textAnchor="middle" className="fill-foreground text-base font-semibold select-none pointer-events-none"> {/* Reduced font size and y-offset */}
                {currentDiagram.title}
              </text>
              {currentDiagram.aiConfidence && (
                <g transform={`translate(${(currentDiagram.elements[0]?.x || 400) + 180}, ${(currentDiagram.elements[0]?.y || 10) - 50})`}> {/* Adjusted position */}
                  <rect x="0" y="0" width="120" height="30" rx="15" className="fill-background/80 stroke-border pointer-events-none" /> {/* Smaller rect */}
                  <text x="60" y="12" textAnchor="middle" className="fill-muted-foreground text-[10px] font-medium select-none pointer-events-none"> {/* Smaller font */}
                    AI Confidence
                  </text>
                  <text x="60" y="24" textAnchor="middle" style={{fill: 'hsl(var(--chart-3))'}} className="text-xs font-bold select-none pointer-events-none"> {/* Smaller font */}
                    {Math.round(currentDiagram.aiConfidence * 100)}%
                  </text>
                </g>
              )}
            </>
          )}
          {!currentDiagram && !isGenerating && (
            <text x="400" y="300" textAnchor="middle" dy=".3em" className="fill-muted-foreground text-sm select-none pointer-events-none"> {/* Smaller font */}
              Enter a query to generate a diagram. Try: "Photosynthesis"
            </text>
          )}
          {isGenerating && (
             <text x="400" y="300" textAnchor="middle" dy=".3em" style={{fill: 'hsl(var(--chart-3))'}} className="text-sm select-none animate-pulse pointer-events-none"> {/* Smaller font */}
                🤖 AI is thinking... Please wait.
            </text>
          )}
          </g>
        </svg>
       <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1.5"> {/* Reduced gap */}
         <TooltipProvider>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoom(1.25)} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 border-border"><ZoomIn className="h-3.5 w-3.5 text-foreground" /></Button> {/* Smaller button & icon */}
            </TooltipTrigger>
            <TooltipContent side="right"><p>Zoom In</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => zoom(0.8)} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 border-border"><ZoomOut className="h-3.5 w-3.5 text-foreground" /></Button> {/* Smaller button & icon */}
            </TooltipTrigger>
            <TooltipContent side="right"><p>Zoom Out</p></TooltipContent>
        </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={resetView} className="bg-background/80 dark:bg-slate-700/80 backdrop-blur-sm shadow-md h-8 w-8 border-border"><ResetIcon className="h-3.5 w-3.5 text-foreground" /></Button> {/* Smaller button & icon */}
            </TooltipTrigger>
            <TooltipContent side="right"><p>Reset View</p></TooltipContent>
        </Tooltip>
         </TooltipProvider>
      </div>
      </div>
      
      {diagramHistory.length > 0 && (
        <div className="absolute bottom-4 right-4 bg-card rounded-lg shadow-lg p-2 max-w-[200px] border border-border z-10"> {/* Reduced padding and max-width */}
          <h3 className="font-semibold text-xs text-foreground mb-1 flex items-center space-x-1.5"> {/* Smaller font */}
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Recent Diagrams</span>
          </h3>
          <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin"> {/* Reduced max-height */}
            {diagramHistory.map((diagram, index) => (
              <Button
                key={index}
                variant="ghost"
                size="xs" // Use "xs" if available, otherwise adjust padding & height
                onClick={() => setCurrentDiagram(diagram)}
                className="w-full text-left justify-start p-1 h-auto bg-muted/50 hover:bg-muted text-xs"
              >
                <div className="text-xs text-foreground truncate flex-grow">{diagram.title}</div>
                {diagram.query && <div className="text-[10px] text-muted-foreground truncate ml-1 opacity-70">({diagram.query.substring(0,8)}...)</div>} {/* Smaller font */}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConceptualDiagrams;

        
    