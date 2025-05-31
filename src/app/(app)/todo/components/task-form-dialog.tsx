
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from "date-fns";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";
import type { Task, TaskPriority } from "@/types";
import { useEffect } from "react";

const TaskFormSchema = z.object({
  title: z.string().min(3, { message: "Task title must be at least 3 characters." }).max(150, { message: "Title cannot exceed 150 characters."}),
  category: z.string().min(1, { message: "Please select a category." }),
  priority: z.enum(["Low", "Medium", "High"], { required_error: "Please select a priority."}),
  dueDate: z.date().optional().nullable(),
});

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitForm: (data: TaskFormValues) => void;
  taskData?: Task | null; // For editing existing task
}

export function TaskFormDialog({ open, onOpenChange, onSubmitForm, taskData }: TaskFormDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: "",
      category: TASK_CATEGORIES[0]?.value || "",
      priority: "Medium",
      dueDate: undefined, // Initialize as undefined
    },
  });

  const isEditMode = !!taskData;

  useEffect(() => {
    if (open) { // Only reset form when dialog becomes visible or taskData changes while open
      if (taskData) {
        form.reset({
          title: taskData.title,
          category: taskData.category,
          priority: taskData.priority,
          dueDate: taskData.dueDate && isValid(parseISO(taskData.dueDate)) ? parseISO(taskData.dueDate) : undefined,
        });
      } else { // Reset to default for add mode
        form.reset({ 
          title: "",
          category: TASK_CATEGORIES[0]?.value || "",
          priority: "Medium",
          dueDate: undefined,
        });
      }
    }
  }, [taskData, open, form]);

  const handleSubmit = (data: TaskFormValues) => {
    onSubmitForm(data);
    onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) { // Reset form when dialog is explicitly closed
             form.reset({ title: "", category: TASK_CATEGORIES[0]?.value || "", priority: "Medium", dueDate: undefined });
        }
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditMode ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the details for your task." : "Fill in the details for your new task. Stay organized!"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Read Chapter 5 of Physics" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal justify-start", // Ensure text alignment
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            (format(field.value, "PPP")) // Format date for display
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined} // Ensure value is Date or undefined
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } // Disable past dates
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => {
                    onOpenChange(false);
                    form.reset({ title: "", category: TASK_CATEGORIES[0]?.value || "", priority: "Medium", dueDate: undefined });
                }}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">{isEditMode ? "Save Changes" : "Add Task"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
