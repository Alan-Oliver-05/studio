
"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ListChecks, PlusCircle, Edit3, Trash2, CalendarDays, Tag, Filter, ArrowUpDown, ShieldAlert, Star } from "lucide-react";
import type { Task, TaskPriority } from "@/types";
import { TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";
import { TaskFormDialog, TaskFormValues } from "./components/task-form-dialog"; 
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock data for initial display
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review Quantum Physics notes",
    category: "Concept Review",
    dueDate: "May 9, 2025",
    priority: "High",
    status: "pending",
  },
  {
    id: "2",
    title: "Math Homework Chapter 3",
    category: "Assignment",
    dueDate: "May 11, 2025",
    priority: "Medium",
    status: "pending",
  },
  {
    id: "3",
    title: "Practice coding challenge",
    category: "Practice Question",
    priority: "Medium",
    status: "pending",
    dueDate: "May 15, 2025",
  },
  {
    id: "4",
    title: "Prepare presentation slides",
    category: "Project",
    dueDate: "May 7, 2025",
    priority: "Low",
    status: "completed",
  },
];

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");
  
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const categories = Array.from(new Set(tasks.map(task => task.category).filter(Boolean).concat(TASK_CATEGORIES.map(tc => tc.value))));

  useEffect(() => {
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
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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

  const handleToggleStatus = (taskId: string) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === "pending" ? "completed" : "pending" }
          : task
      )
    );
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
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  const handleTaskFormSubmit = (data: TaskFormValues) => {
    if (editingTask) { // Editing existing task
      setTasks(
        tasks.map(task =>
          task.id === editingTask.id
            ? { 
                ...editingTask, // Keep original id and status
                title: data.title,
                category: data.category,
                priority: data.priority as TaskPriority,
                dueDate: data.dueDate ? format(data.dueDate, "PPP") : undefined,
              }
            : task
        )
      );
    } else { // Adding new task
      const newTask: Task = {
        id: String(Date.now()),
        title: data.title,
        category: data.category,
        priority: data.priority as TaskPriority,
        dueDate: data.dueDate ? format(data.dueDate, "PPP") : undefined,
        status: "pending",
      };
      setTasks(prevTasks => [newTask, ...prevTasks]);
    }
    setIsTaskFormOpen(false);
    setEditingTask(null);
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "High": return <ShieldAlert className="h-3 w-3 text-destructive" />;
      case "Medium": return <Star className="h-3 w-3 text-yellow-500 fill-current" />;
      case "Low": return <Star className="h-3 w-3 text-green-500 fill-current" />;
      default: return null;
    }
  };

  return (
    <div className="pr-4 md:pr-6 pb-4 md:pb-6 pt-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pt-0 mt-0">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center mt-0 pt-0">
            <ListChecks className="mr-3 h-8 w-8" /> My To-Do List
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your tasks and stay organized.
          </p>
        </div>
        <Button onClick={handleOpenAddTaskForm} className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add Task
        </Button>
      </div>

      <TaskFormDialog
        open={isTaskFormOpen}
        onOpenChange={setIsTaskFormOpen}
        onSubmitForm={handleTaskFormSubmit}
        taskData={editingTask}
      />

      <Card className="shadow-lg">
        <CardHeader className="border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Filter className="h-4 w-4 mr-1.5"/> Filter by Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
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
              <label htmlFor="category-filter" className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Tag className="h-4 w-4 mr-1.5"/> Filter by Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(categories)).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="priority-filter" className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <ShieldAlert className="h-4 w-4 mr-1.5"/> Filter by Priority
              </label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger id="priority-filter">
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
              <label htmlFor="sort-by" className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <ArrowUpDown className="h-4 w-4 mr-1.5"/> Sort By
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTasks.length > 0 ? (
            <ul className="divide-y divide-border">
              {filteredTasks.map(task => (
                <li key={task.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={task.status === "completed"}
                      onCheckedChange={() => handleToggleStatus(task.id)}
                      aria-label={`Mark task ${task.title} as ${task.status === 'pending' ? 'completed' : 'pending'}`}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`task-${task.id}`}
                        className={`font-medium text-sm ${
                          task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </label>
                      <div className="flex items-center space-x-2 mt-1">
                        {task.category && <Badge variant={task.status === 'completed' ? 'secondary' : 'outline'} className="text-xs">{task.category}</Badge>}
                        {task.priority && (
                            <span className="flex items-center text-xs text-muted-foreground">
                                {getPriorityIcon(task.priority)}
                                <span className="ml-1">{task.priority}</span>
                            </span>
                        )}
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Due: {task.dueDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditTaskForm(task)} aria-label="Edit task">
                          <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit Task</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} aria-label="Delete task">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete Task</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-center text-muted-foreground">No tasks found. Try adjusting your filters or add a new task!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

