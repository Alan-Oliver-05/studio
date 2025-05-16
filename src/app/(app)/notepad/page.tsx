
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, ListOrdered } from 'lucide-react';

const NotePadPage: React.FC = () => {
  const [content, setContent] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load saved content if any - for future enhancement
    // const savedContent = localStorage.getItem('notepadContent');
    // if (savedContent) {
    //   setContent(savedContent);
    //   if (editorRef.current) {
    //     editorRef.current.innerHTML = savedContent;
    //   }
    // }
  }, []);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    setContent(event.currentTarget.innerHTML);
    // Save content - for future enhancement
    // localStorage.setItem('notepadContent', event.currentTarget.innerHTML);
  };

  const execCommand = (command: string, value?: string) => {
    if (isClient && document) {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus(); // Re-focus the editor
        setContent(editorRef.current.innerHTML); // Update state after command
      }
    }
  };

  return (
    <div className="container mx-auto py-8 pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
      <h1 className="text-3xl font-bold mb-6 mt-0">Note Pad</h1>

      {isClient && (
        <div className="border border-input rounded-md shadow-sm">
          <div className="flex items-center p-2 border-b border-input bg-muted/50 rounded-t-md space-x-1">
            <TooltipButton label="Bold" onClick={() => execCommand('bold')}>
              <Bold className="h-4 w-4" />
            </TooltipButton>
            <TooltipButton label="Italic" onClick={() => execCommand('italic')}>
              <Italic className="h-4 w-4" />
            </TooltipButton>
            <TooltipButton label="Numbered List" onClick={() => execCommand('insertOrderedList')}>
              <ListOrdered className="h-4 w-4" />
            </TooltipButton>
            {/* Font size and other options can be added here in the future */}
          </div>
          <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleInput}
            className="w-full min-h-[24rem] p-4 focus:outline-none prose dark:prose-invert max-w-none"
            // The placeholder functionality for contentEditable is more complex,
            // so it's omitted for this version.
            // A simple CSS ::before pseudo-element can be used if text is empty.
            // data-placeholder="Start writing your notes here..."
            dangerouslySetInnerHTML={{ __html: content }} // Initialize content
          />
        </div>
      )}
      {!isClient && (
         <div className="w-full min-h-[24rem] p-4 border border-input rounded-md bg-muted/50 animate-pulse">
            Loading editor...
         </div>
      )}
    </div>
  );
};

interface TooltipButtonProps extends React.ComponentProps<typeof Button> {
  label: string;
}

// A simple wrapper for tooltip functionality if needed, or just use Button directly
const TooltipButton: React.FC<TooltipButtonProps> = ({ label, children, ...props }) => {
  // For a real tooltip, you'd integrate <Tooltip> from shadcn/ui
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
};

export default NotePadPage;
