
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks, PlusCircle, Edit3, Trash2, CalendarDays, Tag, Filter, ArrowUpDown } from "lucide-react";
import type { Task } from "@/types";
import { Input } from "@/components/ui/input"; // Added for potential future inline edit

// Mock data for initial display
const initialTasks: Task[] = [
  {
    id: "1",
    title: "Review Quantum Physics notes",
    category: "Concept Review",
    dueDate: "May 9, 2025",
    status: "pending",
  },
  {
    id: "2",
    title: "Math Homework Chapter 3",
    category: "Assignment",
    dueDate: "May 11, 2025",
    status: "pending",
  },
  {
    id: "3",
    title: "Practice coding challenge",
    category: "Practice Question",
    status: "pending",
    dueDate: "May 15, 2025",
  },
  {
    id: "4",
    title: "Prepare presentation slides",
    category: "Project",
    dueDate: "May 7, 2025",
    status: "completed",
  },
];

export default function TodoPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("dueDate");

  const categories = Array.from(new Set(tasks.map(task => task.category).filter(Boolean)));

  useEffect(() => {
    let tempTasks = [...tasks];

    // Filter by status
    if (statusFilter !== "all") {
      tempTasks = tempTasks.filter(task => task.status === statusFilter);
    }

    // Filter by category
    if (categoryFilter !== "all") {
      tempTasks = tempTasks.filter(task => task.category === categoryFilter);
    }

    // Sort tasks
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
    }
    
    setFilteredTasks(tempTasks);

  }, [tasks, statusFilter, categoryFilter, sortBy]);

  const handleToggleStatus = (taskId: string) => {
    setTasks(
      tasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === "pending" ? "completed" : "pending" }
          : task
      )
    );
  };

  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (!taskToEdit) return;

    const newTitle = prompt("Enter new task name:", taskToEdit.title);
    if (newTitle !== null && newTitle.trim() !== "") {
      setTasks(
        tasks.map(task =>
          task.id === taskId ? { ...task, title: newTitle.trim() } : task
        )
      );
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  const handleAddTask = () => {
     const newTask: Task = {
      id: String(Date.now()),
      title: "New Task - Click edit to change",
      category: "General",
      status: "pending",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
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
        <Button onClick={handleAddTask} className="bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-5 w-5" /> Add Task
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
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
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            Due: {task.dueDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditTask(task.id)} aria-label="Edit task">
                      <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTask(task.id)} aria-label="Delete task">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
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

