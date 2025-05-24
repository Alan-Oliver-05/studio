
"use client";

import { useState, useEffect, useCallback, useMemo } from "react"; // Added useMemo here
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ListChecks, PlusCircle, Edit3, Trash2, CalendarDays, Tag, Filter, ArrowUpDown, ShieldAlert, Star, Info } from "lucide-react";
import type { Task, TaskPriority } from "@/types";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";
import { TaskFormDialog, TaskFormValues } from "./components/task-form-dialog"; 
import { format, parseISO, isValid } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";


const LOCAL_STORAGE_TASKS_KEY = 'eduai-tasks';

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    try {
      const storedTasks = localStorage.getItem(LOCAL_STORAGE_TASKS_KEY);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error("Failed to load tasks from localStorage:", error);
      toast({ title: "Error", description: "Could not load saved tasks.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(LOCAL_STORAGE_TASKS_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  const categories = useMemo(() => {
    return Array.from(new Set(tasks.map(task => task.category).filter(Boolean).concat(TASK_CATEGORIES.map(tc => tc.value))));
  }, [tasks]);

  const applyFiltersAndSort = useCallback(() => {
    let tempTasks = [...tasks];

    if (statusFilter !== "all") {
      tempTasks = tempTasks.filter(task => task.status === statusFilter);
    }
    if (categoryFilter !== "all") {
      tempTasks = tempTasks.filter(task => task.category === categoryFilter);
    }
    if (priorityFilter !== "all") {
      tempTasks = tempTasks.filter(task => task.priority === priorityFilter);
    }

    if (sortBy === "dueDate") {
      tempTasks.sort((a, b) => {
        if (!a.dueDate) return 1; 
        if (!b.dueDate) return -1;
        // Assuming dueDate is "MMM d, yyyy", needs parsing.
        // For simplicity if format is consistently "YYYY-MM-DD" or Date objects, direct comparison works.
        // If "MMM d, yyyy", more robust parsing is needed.
        try {
            const dateA = parseISO(a.dueDate); // Assuming stored as ISO
            const dateB = parseISO(b.dueDate);
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateA.getTime() - dateB.getTime();
        } catch (e) { return 0; } // Fallback for parsing error
      });
    } else if (sortBy === "title") {
      tempTasks.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "category") {
      tempTasks.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    } else if (sortBy === "priority") {
        const priorityOrder: Record<TaskPriority, number> = { High: 1, Medium: 2, Low: 3 };
        tempTasks.sort((a,b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    
    setFilteredTasks(tempTasks);
  }, [tasks, statusFilter, categoryFilter, priorityFilter, sortBy]);


  useEffect(() => {
    if (isClient) { // Ensure this runs only on client
        applyFiltersAndSort();
    }
  }, [tasks, statusFilter, categoryFilter, priorityFilter, sortBy, isClient, applyFiltersAndSort]);

  const handleToggleStatus = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === "pending" ? "completed" : "pending" }
          : task
      )
    );
    const task = tasks.find(t => t.id === taskId);
    if(task) {
        toast({ title: `Task "${task.title}" marked as ${task.status === 'pending' ? 'completed' : 'pending'}.`});
    }
  };
  
  const handleOpenAddTaskForm = () => {
    setEditingTask(null);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditTaskForm = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    if(taskToDelete){
        toast({ title: "Task Deleted", description: `"${taskToDelete.title}" has been removed.`, variant: "destructive"});
    }
  };
  
  const handleTaskFormSubmit = (data: TaskFormValues) => {
    const formattedDueDate = data.dueDate ? format(data.dueDate, "yyyy-MM-dd") : undefined; // Store as ISO for easier sorting

    if (editingTask) { 
      setTasks(currentTasks =>
        currentTasks.map(task =>
          task.id === editingTask.id
            ? { 
                ...editingTask, 
                title: data.title,
                category: data.category,
                priority: data.priority as TaskPriority,
                dueDate: formattedDueDate,
              }
            : task
        )
      );
      toast({ title: "Task Updated", description: `"${data.title}" has been updated.`});
    } else { 
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: data.title,
        category: data.category,
        priority: data.priority as TaskPriority,
        dueDate: formattedDueDate,
        status: "pending",
      };
      setTasks(prevTasks => [newTask, ...prevTasks]);
      toast({ title: "Task Added", description: `"${newTask.title}" has been added to your list.`});
    }
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const getPriorityBadgeVariant = (priority: TaskPriority): "destructive" | "secondary" | "default" => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "secondary"; 
      case "Low": return "default";
      default: return "default";
    }
  };
  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "High": return <ShieldAlert className="h-3.5 w-3.5 text-destructive" />;
      case "Medium": return <Star className="h-3.5 w-3.5 text-yellow-500 fill-current" />; // Using fill for medium
      case "Low": return <Star className="h-3.5 w-3.5 text-green-500 fill-current" />; // Using fill for low
      default: return null;
    }
  };

  const displayDueDate = (dueDate?: string) => {
    if (!dueDate) return "No due date";
    try {
      return format(parseISO(dueDate), "MMM d, yyyy"); // Format ISO date for display
    } catch (e) {
      return dueDate; // Fallback if not ISO
    }
  }


  return (
    <div className="pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pt-0 mt-0">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
            <ListChecks className="mr-3 h-7 w-7 sm:h-8 sm:w-8" /> My To-Do List
          </h1>
          <p className="text-muted-foreground mt-1">
            Organize your study schedule and track your progress.
          </p>
        </div>
        <Button onClick={handleOpenAddTaskForm} className="shadow-md">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Task
        </Button>
      </div>

      {isClient && (
        <TaskFormDialog
          open={isTaskFormOpen}
          onOpenChange={setIsTaskFormOpen}
          onSubmitForm={handleTaskFormSubmit}
          taskData={editingTask}
        />
      )}

      <Card className="shadow-xl">
        <CardHeader className="border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground flex items-center mb-1">
                <Filter className="h-3.5 w-3.5 mr-1.5"/> Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="h-9 text-sm">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="category-filter" className="text-xs font-medium text-muted-foreground flex items-center mb-1">
                <Tag className="h-3.5 w-3.5 mr-1.5"/> Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter" className="h-9 text-sm">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="priority-filter" className="text-xs font-medium text-muted-foreground flex items-center mb-1">
                <ShieldAlert className="h-3.5 w-3.5 mr-1.5"/> Priority
              </label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority-filter" className="h-9 text-sm">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {TASK_PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="sort-by" className="text-xs font-medium text-muted-foreground flex items-center mb-1">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5"/> Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by" className="h-9 text-sm">
                  <SelectValue placeholder="Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="category">Category (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTasks.length > 0 ? (
            <ul className="divide-y divide-border">
              {filteredTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.status === "completed"}
                      onCheckedChange={() => handleToggleStatus(task.id)}
                      aria-label={`Mark task ${task.title} as ${task.status === 'pending' ? 'completed' : 'pending'}`}
                      className="mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`font-medium text-sm cursor-pointer ${
                          task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </label>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {task.category && <Badge variant={task.status === 'completed' ? 'secondary' : 'outline'} className="text-xs py-0.5 px-1.5">{task.category}</Badge>}
                        {task.priority && (
                            <Badge variant={getPriorityBadgeVariant(task.priority)} className="text-xs py-0.5 px-1.5 flex items-center gap-1">
                                {getPriorityIcon(task.priority)}
                                {task.priority}
                            </Badge>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="h-3.5 w-3.5 mr-1" />
                            {displayDueDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditTaskForm(task)} aria-label="Edit task" className="h-8 w-8">
                          <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Edit Task</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} aria-label="Delete task" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Delete Task</p></TooltipContent>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Card className="text-center py-10 shadow-none border-0">
                <CardHeader className="p-2">
                    <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                        <Info className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4 text-xl">No Tasks Found</CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                <p className="text-muted-foreground text-sm">
                    You have no tasks matching the current filters. <br/>
                    Try adjusting your filters or add a new task!
                </p>
                </CardContent>
            </Card>
          )}
        </CardContent>
         {filteredTasks.length > 0 && (
            <CardFooter className="p-3 border-t text-xs text-muted-foreground">
                Showing {filteredTasks.length} of {tasks.length} total tasks.
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
