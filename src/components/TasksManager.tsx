import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../lib/types';
import { CheckCircle2, Circle, Plus, Trash2, Calendar, Folder, Clock, Filter, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useHaptic } from '../lib/haptic';
import { audioSystem } from '../lib/audio';

interface TasksManagerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const priorities = ['Low', 'Medium', 'High'];
const getPriorityColor = (priority: string) => {
  if (priority === 'High') return 'text-red-400 bg-red-400/10 border-red-400/20';
  if (priority === 'Medium') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
};

const getProjectColorClass = (project: string) => {
  let hash = 0;
  for (let i = 0; i < project.length; i++) hash = project.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['text-blue-400 bg-blue-400/10 border-blue-400/20', 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20', 'text-purple-400 bg-purple-400/10 border-purple-400/20', 'text-pink-400 bg-pink-400/10 border-pink-400/20', 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', 'text-orange-400 bg-orange-400/10 border-orange-400/20'];
  return colors[Math.abs(hash) % colors.length];
};

export function TasksManager({ tasks, onAddTask, onUpdateTask, onDeleteTask }: TasksManagerProps) {
  const haptic = useHaptic();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('General');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskRepeat, setNewTaskRepeat] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly'>('None');
  
  const [groupBy, setGroupBy] = useState<'project' | 'priority' | 'none'>('project');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'createdAt'>('priority');
  
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    haptic('light');
    setCollapsedGroups(prev => ({...prev, [group]: !prev[group]}));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    // In production, we generate a UUID. For now, random string
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    
    const newTask: Task = {
      id,
      title: newTaskTitle.trim(),
      project: newTaskProject.trim() || 'General',
      priority: newTaskPriority,
      dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completed: false,
      repeat: newTaskRepeat
    };
    
    haptic('medium');
    onAddTask(newTask);
    setNewTaskTitle('');
  };

  const handleToggleComplete = (task: Task) => {
    haptic('medium');
    const isNowCompleted = !task.completed;
    onUpdateTask({ ...task, completed: isNowCompleted });

    if (isNowCompleted) {
      audioSystem.play('success');
    } else {
      audioSystem.play('switch');
    }
    
    // Handle repeat logic
    if (isNowCompleted && task.repeat !== 'None') {
      const nextDueDate = new Date(task.dueDate);
      if (task.repeat === 'Daily') {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (task.repeat === 'Weekly') {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      } else if (task.repeat === 'Monthly') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
      
      const newId = Date.now().toString() + Math.random().toString(36).substring(2);
      onAddTask({
        ...task,
        id: newId,
        completed: false,
        dueDate: nextDueDate.toISOString(),
        createdAt: new Date().toISOString()
      });
    }
  };

  const processedTasks = useMemo(() => {
    let sorted = [...tasks].sort((a, b) => {
      // Sorting
      if (sortBy === 'priority') {
        const pMap = { High: 3, Medium: 2, Low: 1 };
        if (pMap[a.priority] !== pMap[b.priority]) return pMap[b.priority] - pMap[a.priority];
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'dueDate') {
        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (dateDiff === 0) {
           const pMap = { High: 3, Medium: 2, Low: 1 };
           return pMap[b.priority] - pMap[a.priority];
        }
        return dateDiff;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    if (groupBy === 'none') {
      return { 'All Tasks': sorted };
    } else if (groupBy === 'project') {
      return sorted.reduce((acc, task) => {
        if (!acc[task.project]) acc[task.project] = [];
        acc[task.project].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
    } else {
       return sorted.reduce((acc, task) => {
        if (!acc[task.priority]) acc[task.priority] = [];
        acc[task.priority].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
    }
  }, [tasks, groupBy, sortBy]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Task Manager</h1>
          <p className="text-gray-400 dark:text-gray-500 dark:text-gray-400 mt-1">Organize your trading process and stay disciplined.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 bg-gray-900/50 p-1.5 rounded-lg border border-gray-200 dark:border-white/10">
            <Filter size={14} className="text-gray-400 dark:text-gray-500 dark:text-gray-400 ml-1" />
            <select 
              value={groupBy} 
              onChange={e => setGroupBy(e.target.value as any)}
              className="bg-transparent text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:text-gray-900 dark:text-white"
            >
              <option value="none" className="bg-gray-900">Group: None</option>
              <option value="project" className="bg-gray-900">Group: Project</option>
              <option value="priority" className="bg-gray-900">Group: Priority</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 bg-gray-900/50 p-1.5 rounded-lg border border-gray-200 dark:border-white/10">
            <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 ml-1 text-sm">Sort:</span>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:text-gray-900 dark:text-white"
            >
              <option value="priority" className="bg-gray-900">Priority</option>
              <option value="dueDate" className="bg-gray-900">Due Date</option>
              <option value="createdAt" className="bg-gray-900">Created Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="premium-card p-4 md:p-6 mb-8 border-t-4 border-t-blue-500">
        <form onSubmit={handleAddTask} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="What needs to be done?" 
              className="flex-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              required
            />
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-gray-900 dark:text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Add Task</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
             <div className="flex items-center space-x-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2">
                 <Folder size={14} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Project (e.g. Backtesting)" 
                   className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white w-32 md:w-auto"
                   value={newTaskProject}
                   onChange={e => setNewTaskProject(e.target.value)}
                 />
             </div>
             <div className="flex items-center space-x-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2">
                 <AlertCircle size={14} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                 <select 
                   value={newTaskPriority}
                   onChange={e => setNewTaskPriority(e.target.value as any)}
                   className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white"
                 >
                   <option value="Low" className="bg-gray-900">Low Priority</option>
                   <option value="Medium" className="bg-gray-900">Medium Priority</option>
                   <option value="High" className="bg-gray-900">High Priority</option>
                 </select>
             </div>
             <div className="flex items-center space-x-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2">
                 <Calendar size={14} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                 <input 
                   type="date" 
                   value={newTaskDueDate}
                   onChange={e => setNewTaskDueDate(e.target.value)}
                   className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white custom-date-input"
                 />
             </div>
             <div className="flex items-center space-x-2 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2">
                 <RefreshCw size={14} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />
                 <select 
                   value={newTaskRepeat}
                   onChange={e => setNewTaskRepeat(e.target.value as any)}
                   className="bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white"
                 >
                   <option value="None" className="bg-gray-900">No Repeat</option>
                   <option value="Daily" className="bg-gray-900">Daily</option>
                   <option value="Weekly" className="bg-gray-900">Weekly</option>
                   <option value="Monthly" className="bg-gray-900">Monthly</option>
                 </select>
             </div>
          </div>
        </form>
      </div>

      <div className="space-y-8">
        {Object.entries(processedTasks).map(([groupName, groupTasks]) => {
          const isCollapsed = collapsedGroups[groupName];
          return (
            <div key={groupName} className="space-y-3">
              <div 
                 className="flex items-center space-x-2 cursor-pointer group"
                 onClick={() => toggleGroup(groupName)}
              >
                 <div className="p-1 rounded hover:bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none transition-colors">
                    {isCollapsed ? <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" /> : <ChevronDown size={18} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" />}
                 </div>
                 {groupBy === 'project' && groupName !== 'All Tasks' && (
                    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest border ${getProjectColorClass(groupName)}`}>
                      {groupName.substring(0, 2)}
                    </div>
                 )}
                 <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors flex-1">{groupName}</h2>
                 <span className="text-xs font-mono bg-gray-50 dark:bg-white/10 shadow-sm dark:shadow-none text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                    {groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}
                 </span>
              </div>

              {!isCollapsed && (
                <div className="space-y-2 pl-2 border-l border-gray-100 dark:border-white/5 ml-3">
                  <AnimatePresence>
                    {groupTasks.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-gray-400 dark:text-gray-500 text-sm italic p-4"
                      >
                         No tasks in this group.
                      </motion.div>
                    ) : (
                      groupTasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, scale: task.completed ? 0.98 : 1 }}
                          transition={{ layout: { duration: 0.3, type: "spring", bounce: 0.2 } }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            task.completed 
                              ? 'bg-emerald-950/20 border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]' 
                              : 'bg-white/[0.02] border-gray-100 dark:border-white/5 hover:bg-white/[0.04] hover:border-gray-200 dark:border-white/10'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <motion.button 
                              data-no-global-sound="true"
                              onClick={() => handleToggleComplete(task)}
                              className="focus:outline-none flex-shrink-0 relative w-6 h-6 flex items-center justify-center mt-1 md:mt-0 outline-none"
                              whileTap={{ scale: 0.8 }}
                            >
                              <AnimatePresence mode="popLayout">
                                {task.completed ? (
                                  <motion.div
                                    key="completed"
                                    initial={{ scale: 0, opacity: 0, rotate: -90 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    exit={{ scale: 0, opacity: 0, rotate: 90 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="absolute inset-0 text-emerald-500"
                                  >
                                    <motion.div 
                                      className="absolute inset-0 rounded-full bg-emerald-500/40"
                                      initial={{ scale: 0.8, opacity: 1 }}
                                      animate={{ scale: 2, opacity: 0 }}
                                      transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                    <CheckCircle2 size={24} className="relative z-10 bg-[#064e3b] rounded-full" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="incomplete"
                                    initial={{ scale: 0, opacity: 0, rotate: 45 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    exit={{ scale: 0, opacity: 0, rotate: -45 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="absolute inset-0 text-gray-400 dark:text-gray-500 group-hover:text-amber-400 group-hover:shadow-[0_0_10px_rgba(251,191,36,0.3)] rounded-full transition-colors"
                                  >
                                    <Circle size={24} />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.button>
                            
                            <div className={`flex flex-col transition-opacity duration-300 ${task.completed ? 'opacity-50' : ''}`}>
                              <span className={`font-medium text-gray-900 dark:text-white transition-all duration-300 ${task.completed ? 'line-through text-gray-400 dark:text-gray-500 dark:text-gray-400' : ''}`}>{task.title}</span>
                              <div className="flex flex-wrap items-center mt-1.5 gap-2 text-[10px] font-bold uppercase tracking-wider">
                                 {groupBy !== 'project' && (
                                   <span className={`px-2 py-0.5 rounded border ${getProjectColorClass(task.project)}`}>
                                     {task.project}
                                   </span>
                                 )}
                                 <span className="flex items-center text-gray-400 dark:text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 px-2 py-0.5 rounded">
                                   <Calendar size={10} className="mr-1" />
                                   {format(new Date(task.dueDate), 'MMM dd')}
                                 </span>
                                 {task.repeat !== 'None' && (
                                    <span className="flex items-center text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                                       <RefreshCw size={10} className="mr-1" />
                                       {task.repeat}
                                    </span>
                                 )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center mt-4 md:mt-0 space-x-3 md:ml-4 flex-shrink-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-x-0 sm:space-x-3 gap-2">
                               <select
                                 value={task.priority}
                                 onChange={(e) => onUpdateTask({ ...task, priority: e.target.value as any })}
                                 className={`text-xs px-2.5 py-1 rounded-md border font-semibold tracking-wider uppercase bg-transparent outline-none cursor-pointer ${getPriorityColor(task.priority)} ${task.completed ? 'opacity-50' : ''}`}
                               >
                                  <option value="Low" className="bg-gray-900 border-none text-gray-900 dark:text-white">Low</option>
                                  <option value="Medium" className="bg-gray-900 border-none text-gray-900 dark:text-white">Medium</option>
                                  <option value="High" className="bg-gray-900 border-none text-gray-900 dark:text-white">High</option>
                               </select>
                               
                               <button 
                                 onClick={() => onDeleteTask(task.id)}
                                 className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                               >
                                 <Trash2 size={16} />
                               </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
