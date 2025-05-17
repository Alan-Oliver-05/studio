
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bold, Italic, ListOrdered, Save, Trash2, Edit2, FilePlus2, CalendarDays } from 'lucide-react';
import type { Note } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";


const LOCAL_STORAGE_NOTES_KEY = 'eduai-notes';

const NotePadPage: React.FC = () => {
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [currentContent, setCurrentContent] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const storedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Failed to load notes from localStorage:", error);
      toast({ title: "Error", description: "Could not load saved notes.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(notes));
    }
  }, [notes, isClient]);

  const updateEditorContent = useCallback((htmlContent: string) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = htmlContent;
    }
    setCurrentContent(htmlContent);
  }, []);

  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    setCurrentContent(event.currentTarget.innerHTML);
  };

  const execCommand = (command: string, value?: string) => {
    if (isClient && document) {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        editorRef.current.focus();
        setCurrentContent(editorRef.current.innerHTML);
      }
    }
  };

  const handleNewNote = () => {
    setCurrentTitle('');
    updateEditorContent('');
    setEditingNoteId(null);
    if (editorRef.current) editorRef.current.focus();
     toast({ title: "New Note", description: "Editor cleared for a new note."});
  };

  const handleSaveNote = () => {
    if (!currentTitle.trim() && !currentContent.trim()) {
      toast({ title: "Cannot Save", description: "Note title and content cannot both be empty.", variant: "destructive" });
      return;
    }

    const now = Date.now();
    if (editingNoteId) {
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === editingNoteId
            ? { ...note, title: currentTitle.trim() || "Untitled", content: currentContent, updatedAt: now }
            : note
        )
      );
      toast({ title: "Note Updated", description: `"${currentTitle.trim() || "Untitled"}" has been updated.`});
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: currentTitle.trim() || "Untitled Note",
        content: currentContent,
        createdAt: now,
        updatedAt: now,
      };
      setNotes(prevNotes => [newNote, ...prevNotes]);
      toast({ title: "Note Saved", description: `"${newNote.title}" has been saved.`});
    }
  };

  const handleLoadNote = (noteId: string) => {
    const noteToLoad = notes.find(note => note.id === noteId);
    if (noteToLoad) {
      setCurrentTitle(noteToLoad.title);
      updateEditorContent(noteToLoad.content);
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
        toast({ title: "Note Deleted", description: `"${noteToDelete.title}" has been deleted.`, variant: "destructive"});
    }
  };
  
  const getPreviewContent = (htmlContent: string) => {
    if (!isClient) return "Loading preview...";
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const text = tempDiv.textContent || tempDiv.innerText || "";
    return text.length > 100 ? text.substring(0, 100) + "..." : text;
  };


  return (
    <div className="pb-8 pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 mt-0">
        <h1 className="text-3xl font-bold text-primary mt-0">Note Pad</h1>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleNewNote} variant="outline">
                <FilePlus2 className="mr-2 h-4 w-4" /> New Note
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new blank note</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleSaveNote}>
                <Save className="mr-2 h-4 w-4" /> {editingNoteId ? "Update Note" : "Save Note"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{editingNoteId ? "Save changes to current note" : "Save the new note"}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {isClient && (
        <Card className="mb-8 shadow-lg">
          <CardHeader className="pb-2">
            <Input
              placeholder="Note Title (e.g., My Great Idea)"
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              className="text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-1"
            />
          </CardHeader>
          <CardContent>
            <div className="border border-input rounded-md shadow-sm">
              <div className="flex items-center p-2 border-b border-input bg-muted/50 rounded-t-md space-x-1">
                <EditorToolbarButton label="Bold" onClick={() => execCommand('bold')}>
                  <Bold className="h-4 w-4" />
                </EditorToolbarButton>
                <EditorToolbarButton label="Italic" onClick={() => execCommand('italic')}>
                  <Italic className="h-4 w-4" />
                </EditorToolbarButton>
                <EditorToolbarButton label="Numbered List" onClick={() => execCommand('insertOrderedList')}>
                  <ListOrdered className="h-4 w-4" />
                </EditorToolbarButton>
              </div>
              <div
                ref={editorRef}
                contentEditable={true}
                onInput={handleInput}
                className="w-full min-h-[16rem] p-4 focus:outline-none prose dark:prose-invert max-w-none bg-background"
                dangerouslySetInnerHTML={{ __html: currentContent }}
                role="textbox"
                aria-multiline="true"
              />
            </div>
          </CardContent>
        </Card>
      )}
      {!isClient && (
         <div className="w-full min-h-[20rem] p-4 border border-input rounded-md bg-muted/50 animate-pulse mb-8">
            Loading editor...
         </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-primary">Saved Notes ({notes.length})</h2>
        {notes.length === 0 && isClient ? (
          <p className="text-muted-foreground">You have no saved notes yet. Create one above!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map(note => (
              <Card key={note.id} className="flex flex-col shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">{note.title || "Untitled Note"}</CardTitle>
                  <CardDescription className="text-xs flex items-center">
                    <CalendarDays className="h-3 w-3 mr-1.5" />
                    Last updated: {isClient ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : 'Calculating...'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow min-h-[4rem]">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {getPreviewContent(note.content)}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end gap-1 pt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleLoadNote(note.id)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit Note</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteNote(note.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete Note</p>
                    </TooltipContent>
                  </Tooltip>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface EditorToolbarButtonProps extends React.ComponentProps<typeof Button> {
  label: string;
}

const EditorToolbarButton: React.FC<EditorToolbarButtonProps> = ({ label, children, ...props }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default NotePadPage;

