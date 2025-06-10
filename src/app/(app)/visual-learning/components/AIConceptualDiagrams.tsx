
"use client";

import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


// Simplified types for this component's internal state
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


const AIConceptualDiagrams = () => {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState<Diagram | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  // const [selectedStyle, setSelectedStyle] = useState('scientific'); // Style selection can be added later
  // const [diagramHistory, setDiagramHistory] = useState<Diagram[]>([]); // History can be added later
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Predefined diagram templates
  const diagramTemplates: Record<string, Diagram> = {
    photosynthesis: {
      title: "Photosynthesis Process",
      type: "biological",
      elements: [
        { id: 'sun', type: 'source', x: 100, y: 50, label: 'Sunlight', icon: 'sun', color: 'hsl(var(--chart-4))' }, // yellow/orange
        { id: 'leaf', type: 'organ', x: 300, y: 150, label: 'Leaf (Chloroplast)', icon: 'leaf', color: 'hsl(var(--chart-2))' }, // green
        { id: 'co2', type: 'input', x: 150, y: 100, label: 'CO₂', color: 'hsl(var(--muted-foreground))' }, // gray
        { id: 'h2o', type: 'input', x: 200, y: 250, label: 'H₂O', icon: 'droplets', color: 'hsl(var(--chart-1))' }, // blue
        { id: 'glucose', type: 'output', x: 450, y: 150, label: 'C₆H₁₂O₆ (Glucose)', color: 'hsl(var(--chart-4))' }, // orange
        { id: 'oxygen', type: 'output', x: 400, y: 80, label: 'O₂ (Oxygen)', color: 'hsl(var(--destructive))' }, // red
        { id: 'equation', type: 'formula', x: 250, y: 350, label: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', color: 'hsl(var(--chart-3))' } // purple
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
      title: "Heart Circulation",
      type: "anatomical",
      elements: [
        { id: 'heart', type: 'organ', x: 300, y: 200, label: 'Heart', icon: 'heart', color: 'hsl(var(--destructive))' },
        { id: 'lungs', type: 'organ', x: 150, y: 150, label: 'Lungs', color: 'hsl(var(--primary))' }, // blue
        { id: 'body', type: 'system', x: 450, y: 200, label: 'Body Tissues', color: 'hsl(var(--chart-2))' }, // green
        { id: 'oxygenated', type: 'flow', x: 200, y: 100, label: 'Oxygenated Blood', color: 'hsl(var(--destructive))' },
        { id: 'deoxygenated', type: 'flow', x: 400, y: 300, label: 'Deoxygenated Blood', color: 'hsl(var(--primary))' } // darker blue might need custom class
      ],
      connections: [
        { from: 'heart', to: 'lungs', type: 'pulmonary', label: 'To Lungs' },
        { from: 'lungs', to: 'heart', type: 'pulmonary', label: 'To Heart' },
        { from: 'heart', to: 'body', type: 'systemic', label: 'To Body' },
        { from: 'body', to: 'heart', type: 'systemic', label: 'To Heart (Deoxygenated)' }
      ]
    },
    atomStructure: {
      title: "Atomic Structure",
      type: "physics",
      elements: [
        { id: 'nucleus', type: 'core', x: 300, y: 200, label: 'Nucleus', color: 'hsl(var(--destructive))' },
        { id: 'proton', type: 'particle', x: 280, y: 180, label: 'Proton (+)', color: 'hsl(var(--destructive))' },
        { id: 'neutron', type: 'particle', x: 320, y: 220, label: 'Neutron (0)', color: 'hsl(var(--muted-foreground))' },
        { id: 'electron1', type: 'particle', x: 200, y: 150, label: 'Electron (-)', icon: 'atom', color: 'hsl(var(--primary))' },
        { id: 'electron2', type: 'particle', x: 250, y: 300, label: 'Electron (-)', icon: 'atom', color: 'hsl(var(--primary))' },
        { id: 'orbit', type: 'path', x: 300, y: 200, label: 'Electron Shell', color: 'hsl(var(--chart-3))' } // purple
      ],
      connections: [
        { from: 'nucleus', to: 'electron1', type: 'attraction' },
        { from: 'nucleus', to: 'electron2', type: 'attraction' }
      ]
    }
  };

  const analyzeQuery = (inputQuery: string): string | null => {
    const q = inputQuery.toLowerCase();
    if (q.includes('photosynthesis') || q.includes('plant energy')) return 'photosynthesis';
    if (q.includes('heart') || q.includes('circulation') || q.includes('blood flow')) return 'heartCirculation';
    if (q.includes('atom') || q.includes('atomic structure') || q.includes('electron')) return 'atomStructure';
    return null; 
  };

  const generateCustomDiagram = (userQuery: string): Diagram => {
    return {
      title: `AI: ${userQuery.substring(0, 30)}${userQuery.length > 30 ? '...' : ''}`,
      type: "custom",
      elements: [
        { id: 'main', type: 'concept', x: 300, y: 200, label: 'Main Concept', color: 'hsl(var(--chart-3))' },
        { id: 'factor1', type: 'factor', x: 150, y: 150, label: 'Factor 1', color: 'hsl(var(--chart-2))' },
        { id: 'factor2', type: 'factor', x: 450, y: 150, label: 'Factor 2', color: 'hsl(var(--chart-4))' },
        { id: 'result1', type: 'result', x: 200, y: 300, label: 'Result 1', color: 'hsl(var(--destructive))' },
      ],
      connections: [
        { from: 'factor1', to: 'main', type: 'input' },
        { from: 'factor2', to: 'main', type: 'input' },
        { from: 'main', to: 'result1', type: 'output' },
      ]
    };
  };

  const handleGenerateDiagram = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate AI processing

    const diagramType = analyzeQuery(query);
    let newDiagram: Diagram;

    if (diagramType && diagramTemplates[diagramType]) {
      newDiagram = diagramTemplates[diagramType];
    } else {
      newDiagram = generateCustomDiagram(query);
    }
    
    newDiagram.generatedAt = new Date().toISOString();
    newDiagram.query = query;
    newDiagram.aiConfidence = Math.random() * 0.3 + 0.7; // 70-100%

    setCurrentDiagram(newDiagram);
    // setDiagramHistory(prev => [newDiagram, ...prev.slice(0, 4)]); // History can be added later
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
              fill={`${element.color}33`} // Semi-transparent fill (20% opacity)
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
                fill="currentColor" // Use theme foreground
                fontSize={element.type === 'formula' ? '10' : '9'}
                fontWeight="500"
                className="pointer-events-none select-none text-foreground"
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

    const startX = fromEl.x + Math.cos(angle) * (fromRadius + 2); // +2 for slight gap
    const startY = fromEl.y + Math.sin(angle) * (fromRadius + 2);
    const endX = toEl.x - Math.cos(angle) * (toRadius + 5); // +5 for arrow head space
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
    "Diagram photosynthesis", "Show heart circulation", "Atomic structure", "Water cycle", "Digestive system"
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background text-foreground">
      {/* Header Panel */}
      <div className="bg-card border-b border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-7 h-7 text-purple-500" />
            <div>
              <h1 className="text-lg font-bold text-foreground">AI Conceptual Diagrams</h1>
              <p className="text-xs text-muted-foreground">Generate educational diagrams with AI</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1.5 mt-2 sm:mt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setShowLabels(!showLabels)} className="w-8 h-8 bg-blue-100/80 hover:bg-blue-200/80 dark:bg-blue-700/50 dark:hover:bg-blue-600/60">
                    {showLabels ? <Eye className="w-4 h-4 text-blue-600 dark:text-blue-300" /> : <EyeOff className="w-4 h-4 text-blue-600 dark:text-blue-300" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{showLabels ? 'Hide' : 'Show'} Labels</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 bg-green-100/80 hover:bg-green-200/80 dark:bg-green-700/50 dark:hover:bg-green-600/60">
                    <Download className="w-4 h-4 text-green-600 dark:text-green-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Download Diagram</p></TooltipContent>
              </Tooltip>
               <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 bg-purple-100/80 hover:bg-purple-200/80 dark:bg-purple-700/50 dark:hover:bg-purple-600/60">
                    <Share2 className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Share Diagram</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              className="w-full pl-9 pr-4 py-2 text-sm h-10 border-border focus-visible:ring-purple-500"
            />
          </div>
          <Button
            onClick={handleGenerateDiagram}
            disabled={isGenerating || !query.trim()}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-md h-10 px-5 text-sm"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Zap className="w-4 h-4 mr-2" />
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
              className="text-xs px-2.5 py-1 h-auto border-dashed border-muted-foreground/50 hover:border-primary/70 hover:bg-primary/5 hover:text-primary text-muted-foreground"
            >
              {example}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-grow overflow-auto p-2 sm:p-4">
        <svg ref={canvasRef} width="100%" height="100%" viewBox="0 0 800 600" className="bg-muted/30 rounded-lg border border-border shadow-inner min-h-[400px] sm:min-h-[500px]">
          {currentDiagram && (
            <>
              {currentDiagram.connections?.map(renderConnection)}
              {currentDiagram.elements.map(renderElement)}
              <text x="50%" y="30" textAnchor="middle" className="fill-foreground text-lg font-semibold select-none">
                {currentDiagram.title}
              </text>
              {currentDiagram.aiConfidence && (
                <g>
                  <rect x="calc(100% - 145px)" y="10" width="135" height="35" rx="17.5" className="fill-background/80 stroke-border" />
                  <text x="calc(100% - 77.5px)" y="24" textAnchor="middle" className="fill-muted-foreground text-xs font-medium select-none">
                    AI Confidence
                  </text>
                  <text x="calc(100% - 77.5px)" y="37" textAnchor="middle" className="fill-purple-500 text-sm font-bold select-none">
                    {Math.round(currentDiagram.aiConfidence * 100)}%
                  </text>
                </g>
              )}
            </>
          )}
          {!currentDiagram && !isGenerating && (
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="fill-muted-foreground text-base select-none">
              Enter a query above to generate a diagram. Try: "Photosynthesis"
            </text>
          )}
          {isGenerating && (
             <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="fill-purple-500 text-base select-none animate-pulse">
                🤖 AI is thinking... Please wait.
            </text>
          )}
        </svg>
      </div>
      
      {/* History Panel can be added later if needed */}
      {/* {diagramHistory.length > 0 && ( ... )} */}
    </div>
  );
};

export default AIConceptualDiagrams;


    