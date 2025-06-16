
"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, FileAudio, Presentation, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
}

const MAX_FILE_SIZE_MB = 10; // Example: 10MB limit
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const FileUploadZone: React.FC<FileUploadZoneProps> = ({ onFileSelect }) => {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);
    if (rejectedFiles && rejectedFiles.length > 0) {
      const firstRejection = rejectedFiles[0];
      let message = "File upload failed.";
      if (firstRejection.errors) {
        message = firstRejection.errors.map((err: any) => err.message).join(', ');
      }
      setError(message);
      toast({ title: "File Upload Error", description: message, variant: "destructive" });
      return;
    }

    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onFileSelect(file);
      toast({ title: "File Accepted", description: `"${file.name}" is ready for processing.` });
    }
  }, [onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    },
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: false,
  });

  const getFileTypeIcon = (fileName?: string) => {
    if (!fileName) return <FileQuestion className="w-6 h-6 text-muted-foreground" />;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-6 h-6 text-red-500" />;
    if (ext === 'doc' || ext === 'docx') return <FileText className="w-6 h-6 text-blue-500" />;
    if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext || '')) return <FileAudio className="w-6 h-6 text-purple-500" />;
    if (['ppt', 'pptx'].includes(ext || '')) return <Presentation className="w-6 h-6 text-orange-500" />;
    return <FileQuestion className="w-6 h-6 text-muted-foreground" />;
  };


  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl border-primary/20 hover:shadow-2xl transition-shadow">
      <CardHeader className="text-center pb-4">
        <UploadCloud className="w-16 h-16 mx-auto text-primary opacity-80 mb-3" />
        <CardTitle className="text-2xl">Upload Your Study Material</CardTitle>
        <CardDescription>
          PDF, DOCX, Audio, or Slides - AI will generate study aids based on the file's topic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
            isDragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/70",
            isDragAccept && "border-green-500 bg-green-500/10",
            isDragReject && "border-destructive bg-destructive/10"
          )}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            isDragAccept ? <p className="text-green-600">Drop the file here!</p> :
            isDragReject ? <p className="text-destructive">Unsupported file type or size too large.</p> :
            <p>Release to drop your file</p>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">Drag 'n' drop a file here, or click to select</p>
              <p className="text-xs text-muted-foreground mt-1">
                (PDF, DOCX, MP3, PPTX, etc. Max {MAX_FILE_SIZE_MB}MB)
              </p>
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-destructive text-center">{error}</p>}
         <Button variant="outline" className="w-full mt-4" onClick={() => document.getElementById('file-upload-input-hidden')?.click()}>
            <input id="file-upload-input-hidden" {...getInputProps()} className="hidden" />
            Browse Files
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileUploadZone;
