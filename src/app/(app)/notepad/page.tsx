
"use client";

import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bold, Italic, ListOrdered, Save, Trash2, Edit2, FilePlus2, CalendarDays, Palette } from 'lucide-react';
import type { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface EditorToolbarButtonProps extends React.ComponentProps<typeof Button> {
  label: string;
}

const EditorToolbarButton: React.FC<EditorToolbarButtonProps> = ({ label, children, ...props }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} className="h-7 w-7" {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent><p>{label}</p></TooltipContent>
    </Tooltip>
  );
};

const LOCAL_STORAGE_NOTES_KEY = 'eduai-notes';

const NotePadPage: React.FC = () => {
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  const [editorInitialHtml, setEditorInitialHtml] = useState<string>("");

  useEffect(() => {
    setIsClient(true);
    try {
      const storedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes).sort((a: Note, b: Note) => b.updatedAt - a.updatedAt));
      }
    } catch (error) {
      console.error("Failed to load notes from localStorage:", error);
      toast({ title: "Error Loading Notes", description: "Could not load your saved notes. Local data might be corrupted.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
    }
  }, [notes, isClient]);

  useEffect(() => {
    if (editorRef.current) {
      // This effect is for when editorInitialHtml is programmatically changed
      // (e.g., new note, load note). We want to update the DOM and sync currentContent.
      if (editorRef.current.innerHTML !== editorInitialHtml) {
        editorRef.current.innerHTML = editorInitialHtml;
      }
      // Sync currentContent to the editorInitialHtml, as this is a programmatic update.
      if (currentContent !== editorInitialHtml) {
         setCurrentContent(editorInitialHtml);
      }
    }
  }, [editorInitialHtml]); // Only run when editorInitialHtml changes.

  const handleInput = (event: FormEvent<HTMLDivElement>) => {
    setCurrentContent(event.currentTarget.innerHTML);
  };

  const execCommand = (command: string, value?: string) => {
    if (isClient && document && editorRef.current) {
      editorRef.current.focus(); 
      document.execCommand(command, false, value);
      setCurrentContent(editorRef.current.innerHTML); 
    }
  };

  const handleNewNote = () => {
    setCurrentTitle('');
    setEditorInitialHtml(''); 
    setEditingNoteId(null);
    if (editorRef.current) editorRef.current.focus();
     toast({ title: "New Note Ready", description: "Editor cleared. Start typing your new note!"});
  };

  const handleSaveNote = () => {
    if (!currentTitle.trim() && !currentContent.trim()) {
      toast({ title: "Cannot Save Empty Note", description: "Please add a title or some content to your note.", variant: "destructive" });
      return;
    }

    const now = Date.now();
    const noteTitle = currentTitle.trim() || `Note ${formatDistanceToNow(new Date(now), { addSuffix: false })}`;

    if (editingNoteId) {
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === editingNoteId
            ? { ...note, title: noteTitle, content: currentContent, updatedAt: now }
            : note
        ).sort((a,b) => b.updatedAt - a.updatedAt)
      );
      toast({ title: "Note Updated", description: `"${noteTitle}" has been successfully updated.`});
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: noteTitle,
        content: currentContent,
        createdAt: now,
        updatedAt: now,
      };
      setNotes(prevNotes => [newNote, ...prevNotes].sort((a,b) => b.updatedAt - a.updatedAt));
      setEditingNoteId(newNote.id);
      toast({ title: "Note Saved", description: `"${newNote.title}" has been successfully saved.`});
    }
  };

  const handleLoadNote = (noteId: string) => {
    const noteToLoad = notes.find(note => note.id === noteId);
    if (noteToLoad) {
      setCurrentTitle(noteToLoad.title);
      setEditorInitialHtml(noteToLoad.content); 
      setEditingNoteId(noteToLoad.id);
      if (editorRef.current) editorRef.current.focus();
      toast({ title: "Note Loaded", description: `"${noteToLoad.title}" is ready for editing.`});
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const noteToDelete = notes.find(note => note.id === noteId);
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    if (editingNoteId === noteId) {
      handleNewNote();
    }
    if (noteToDelete) {
        toast({ title: "Note Deleted", description: `"${noteToDelete.title}" has been removed.`, variant: "destructive"});
    }
  };

  const getPreviewContent = (htmlContent: string) => {
    if (!isClient) return "Loading preview...";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > 120 ? text.substring(0, 120) + "..." : (text || "No content preview.");
  };


  return (
    <div className="pb-8 pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center">
            <Palette className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-accent" /> Note Pad
        </h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleNewNote} variant="outline" className="shadow-sm">
                <FilePlus2 className="mr-2 h-4 w-4" /> New Note
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Create a new blank note</p></TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleSaveNote} className="shadow-md">
                <Save className="mr-2 h-4 w-4" /> {editingNoteId ? "Update Note" : "Save Note"}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>{editingNoteId ? "Save changes to current note" : "Save the new note"}</p></TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        <Card className="lg:col-span-2 shadow-xl">
          <CardHeader className="pb-3 border-b">
            <Input
              placeholder="Note Title (e.g., My Brilliant Idea)"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              className="text-xl font-semibold border-0 shadow-none focus-visible:ring-0 px-1 h-auto py-1.5"
              aria-label="Note Title"
            />
          </CardHeader>
          <CardContent className="pt-0">
            {isClient ? (
              <div className="border border-input rounded-b-md shadow-sm overflow-hidden mt-2">
                <div className="flex items-center p-1.5 border-b border-input bg-muted/50 space-x-0.5">
                  <EditorToolbarButton label="Bold" onClick={() => execCommand('bold')}><Bold className="h-4 w-4" /></EditorToolbarButton>
                  <EditorToolbarButton label="Italic" onClick={() => execCommand('italic')}><Italic className="h-4 w-4" /></EditorToolbarButton>
                  <EditorToolbarButton label="Numbered List" onClick={() => execCommand('insertOrderedList')}><ListOrdered className="h-4 w-4" /></EditorToolbarButton>
                </div>
                <div
                  ref={editorRef}
                  contentEditable={true}
                  onInput={handleInput}
                  className="w-full min-h-[20rem] lg:min-h-[25rem] p-4 focus:outline-none prose dark:prose-invert max-w-none bg-background text-sm leading-relaxed editor-content"
                  placeholder="Start typing your note here..."
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Note Content"
                />
              </div>
            ) : (
              <div className="w-full min-h-[20rem] p-4 border border-input rounded-md bg-muted/50 animate-pulse">
                  Loading editor...
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-1">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-primary">Saved Notes ({notes.length})</h2>
          {notes.length === 0 && isClient ? (
            <Card className="text-center py-8 border-dashed">
                <CardContent>
                    <FilePlus2 className="h-10 w-10 text-muted-foreground mx-auto mb-3"/>
                    <p className="text-muted-foreground">You have no saved notes yet. Create one!</p>
                </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1 scrollbar-thin">
              {notes.map(note => (
                <Card key={note.id} className={cn("flex flex-col shadow-md hover:shadow-lg transition-shadow cursor-pointer", editingNoteId === note.id && "ring-2 ring-primary border-primary")}>
                  <CardHeader className="pb-2 pt-3 px-3 cursor-pointer" onClick={() => handleLoadNote(note.id)}>
                    <CardTitle className="text-md truncate font-semibold">{note.title || "Untitled Note"}</CardTitle>
                    <CardDescription className="text-xs flex items-center text-muted-foreground">
                      <CalendarDays className="h-3 w-3 mr-1.5" />
                      {isClient ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : 'Calculating...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow min-h-[2.5rem] px-3 pb-2 cursor-pointer" onClick={() => handleLoadNote(note.id)}>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {getPreviewContent(note.content)}
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 pt-1 pb-2 px-2 border-t mt-auto">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleLoadNote(note.id); }} className="h-7 w-7">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Edit Note</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }} className="h-7 w-7">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete Note</p></TooltipContent>
                    </Tooltip>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
       <style jsx global>{`
        .editor-content:empty:before {
          content: attr(placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          display: block; /* or inline-block depending on your layout */
        }
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) hsl(var(--background));
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: hsl(var(--background));
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 6px;
          border: 1px solid hsl(var(--background));
        }
      `}</style>
    </div>
  );
};

export default NotePadPage;
