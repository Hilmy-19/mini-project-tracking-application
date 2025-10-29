'use client'
import React, { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/16/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Card,
    CardAction,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"

const App = () => {
    const [projects, setProjects] = useState([])
    const [tasks, setTasks] = useState([])
    const [crudProject, setCrudProject] = useState(false)
    const [openProject, setOpenProject] = useState(null)
    const [openTask, setOpenTask] = useState(false)
    const [crudTask, setCrudTask] = useState(null)

    const calculateProjectData = (projectId, tasksParam = null) => {
        const taskList = tasksParam || tasks
        const projectTasks = taskList.filter(t => t.projectId === projectId)
        if (projectTasks.length === 0) return { status: 'Draft', progress: 0 }

        const totalWeight = projectTasks.reduce((a, b) => a + (Number(b.weight) || 0), 0)
        const doneWeight = projectTasks
            .filter(t => (t.status || '').toLowerCase() === 'done')
            .reduce((a, b) => a + (Number(b.weight) || 0), 0)

        const progress = totalWeight ? (doneWeight / totalWeight) * 100 : 0

        const allDraft = projectTasks.every(t => (t.status || '').toLowerCase() === 'draft')
        const allDone = projectTasks.every(t => (t.status || '').toLowerCase() === 'done')
        const anyActive = projectTasks.some(t => {
            const s = (t.status || '').toLowerCase()
            return s === 'in progress' || s === 'inprogress' || s === 'done'
        })

        let status = 'Draft'
        if (allDone) status = 'Done'
        else if (anyActive) status = 'In Progress'
        else if (allDraft) status = 'Draft'

        return { status, progress }
    }

    const refreshProjects = (tasksSnapshot = null) => {
        const tlist = tasksSnapshot || tasks
        setProjects(prev =>
            prev.map(p => {
                const { status, progress } = calculateProjectData(p.id, tlist)
                return { ...p, status, progress }
            })
        )
    }

    // CREATE PROJECT
    const addProject = (e) => {
        e.preventDefault()
        const name = e.target['project-name'].value.trim()
        if (!name) return
        const newProject = { id: Date.now(), name, status: 'Draft', progress: 0 }
        const newProjects = [...projects, newProject]
        setProjects(newProjects)
        e.target.reset()
        setCrudProject(false)
    }

    // UPDATE PROJECT NAME (from detail drawer)
    const updateProject = (e, project) => {
        e.preventDefault()
        const newName = e.target['task-name'].value.trim()
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: newName } : p))
        setOpenProject(null)
    }

    // DELETE PROJECT
    const deleteProject = (id) => {
        setProjects(prev => prev.filter(p => p.id !== id))
        const newTasks = tasks.filter(t => t.projectId !== id)
        setTasks(newTasks)
        refreshProjects(newTasks)
        setOpenProject(null)
    }

    // CREATE TASK
    const addTask = (e) => {
        e.preventDefault()
        const projectName = e.target['project-list'].value
        const project = projects.find(p => p.name === projectName)
        if (!project) {
            alert('Pilih project yang valid!')
            return
        }
        const newTask = {
            id: Date.now(),
            projectId: project.id,
            name: e.target['task-name'].value.trim() || 'Untitled Task',
            status: e.target['task-status'].value,
            weight: Number(e.target['task-weight'].value) || 0
        }
        const newTasks = [...tasks, newTask]
        setTasks(newTasks)
        refreshProjects(newTasks)
        e.target.reset()
        setOpenTask(false)
    }

    // UPDATE TASK
    const updateTask = (e, task) => {
        e.preventDefault()
        const updatedTask = {
            ...task,
            name: e.target['task-name'].value.trim() || task.name,
            status: e.target['task-status'].value,
            weight: Number(e.target['task-weight'].value) || 0
        }
        const newTasks = tasks.map(t => t.id === task.id ? updatedTask : t)
        setTasks(newTasks)
        refreshProjects(newTasks)
        setCrudTask(null)
    }

    // DELETE TASK
    const deleteTask = (id) => {
        const newTasks = tasks.filter(t => t.id !== id)
        setTasks(newTasks)
        refreshProjects(newTasks)
        setCrudTask(null)
    }

    // Rendered project cards
    const renderedProjects = projects.map((project) => {
        // ensure project fields are up-to-date (calculate based on current tasks)
        const { status, progress } = calculateProjectData(project.id)
        // don't mutate original reference in state directly — create stable display values
        const displayStatus = status
        const displayProgress = progress

        const projectTasks = tasks.filter(t => t.projectId === project.id)

        return (
            <Card key={project.id} className="w-1/4 mb-5">
                <CardHeader>
                    <CardTitle>
                        <div className="flex justify-between">
                            <p>{project.name}</p>
                        </div>
                    </CardTitle>
                    <CardAction>
                        <Button variant="outline" size="icon" onClick={() => setOpenProject(project.id)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                            </svg>
                        </Button>

                        {/* Project Detail Drawer */}
                        {openProject === project.id && (
                            <Dialog open={true} onClose={() => setOpenProject(null)} className="relative z-10">
                                <DialogBackdrop transition className="fixed inset-0 bg-gray-300/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                                <div className="fixed inset-0 overflow-hidden">
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                            <DialogPanel transition className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                                <TransitionChild>
                                                    <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                                                        <button type="button" onClick={() => setOpenProject(null)} className="relative rounded-md text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                                            <span className="absolute -inset-2.5" />
                                                            <span className="sr-only">Close panel</span>
                                                            <XMarkIcon aria-hidden="true" className="size-6" />
                                                        </button>
                                                    </div>
                                                </TransitionChild>
                                                <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                                    <div className="px-4 sm:px-6">
                                                        <DialogTitle className="text-base font-semibold text-gray-900">Project</DialogTitle>
                                                    </div>
                                                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                                        <form onSubmit={(e) => updateProject(e, project)}>
                                                            <div className="col-span-full mb-5">
                                                                <div className="flex justify-between">
                                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Nama</label>
                                                                    <Badge
                                                                        className={
                                                                            displayStatus.toLowerCase() === 'done'
                                                                                ? 'bg-green-500 text-white'
                                                                                : displayStatus.toLowerCase() === 'in progress'
                                                                                    ? 'bg-yellow-500 text-white'
                                                                                    : 'bg-gray-500 text-white'
                                                                        }
                                                                    >
                                                                        {displayStatus}
                                                                    </Badge>
                                                                </div>
                                                                <div className="mt-2">
                                                                    <input
                                                                        id="task-name"
                                                                        name="task-name"
                                                                        type="text"
                                                                        defaultValue={project.name}
                                                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <Progress value={displayProgress} />
                                                                <p>{Math.round(displayProgress)}%</p>
                                                            </div>

                                                            <div className="mt-6 flex items-center justify-between gap-x-6">
                                                                <Button onClick={() => deleteProject(project.id)} className="bg-red-500 px-3 font-semibold text-white shadow-xs hover:bg-red-700 w-20">Delete</Button>
                                                                <Button type="submit" className="bg-blue-500 px-3 font-semibold text-white shadow-xs hover:bg-blue-700 w-20">Save</Button>
                                                            </div>
                                                        </form>
                                                    </div>
                                                </div>
                                            </DialogPanel>
                                        </div>
                                    </div>
                                </div>
                            </Dialog>
                        )}
                    </CardAction>
                </CardHeader>

                <CardContent className="flex flex-col space-y-2">
                    {projectTasks.map(task => (
                        <Item key={task.id} variant="outline" size="sm" asChild>
                            <a href="#" onClick={(ev) => { ev.preventDefault(); setCrudTask(task) }}>
                                <ItemContent>
                                    <ItemTitle>{task.name}</ItemTitle>
                                </ItemContent>
                                <ItemActions>
                                    <Badge
                                        className={
                                            task.status.toLowerCase() === 'done'
                                                ? 'bg-green-500 text-white'
                                                : task.status.toLowerCase() === 'in progress'
                                                    ? 'bg-yellow-500 text-white'
                                                    : 'bg-gray-500 text-white'
                                        }
                                    >
                                        {task.status}
                                    </Badge>
                                </ItemActions>
                            </a>
                        </Item>
                    ))}
                </CardContent>
            </Card>
        )
    })

    return (
        <>
            <div className="flex px-10 pt-10 pb-5 gap-2">
                <Button onClick={() => setCrudProject(true)} variant="outline">
                    Add Project
                </Button>
                <Dialog open={crudProject} onClose={setCrudProject} className="relative z-10">
                    <DialogBackdrop transition className="fixed inset-0 bg-gray-300/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                <DialogPanel transition className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                    <TransitionChild>
                                        <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                                            <button type="button" onClick={() => setCrudProject(false)} className="relative rounded-md text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                                <span className="absolute -inset-2.5" />
                                                <span className="sr-only">Close panel</span>
                                                <XMarkIcon aria-hidden="true" className="size-6" />
                                            </button>
                                        </div>
                                    </TransitionChild>
                                    <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                        <div className="px-4 sm:px-6">
                                            <DialogTitle className="text-base font-semibold text-gray-900">Add Project</DialogTitle>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                            {/*CONTENT DRAWER PROJECT*/}
                                            <form onSubmit={addProject}>
                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Nama</label>
                                                    <div className="mt-2">
                                                        <input
                                                            id="project-name"
                                                            name="project-name"
                                                            type="text"
                                                            autoComplete="project-name"
                                                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-end">
                                                    <Button type="submit" className="bg-blue-500 px-3 font-semibold text-white shadow-xs hover:bg-blue-700 w-20">
                                                        Add
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </div>
                        </div>
                    </div>
                </Dialog>

                <Button onClick={() => setOpenTask(true)} variant="outline">
                    Add Task
                </Button>
                <Dialog open={openTask} onClose={setOpenTask} className="relative z-10">
                    <DialogBackdrop transition className="fixed inset-0 bg-gray-300/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                <DialogPanel transition className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                    <TransitionChild>
                                        <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                                            <button type="button" onClick={() => setOpenTask(false)} className="relative rounded-md text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                                <span className="absolute -inset-2.5" />
                                                <span className="sr-only">Close panel</span>
                                                <XMarkIcon aria-hidden="true" className="size-6" />
                                            </button>
                                        </div>
                                    </TransitionChild>
                                    <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                        <div className="px-4 sm:px-6">
                                            <DialogTitle className="text-base font-semibold text-gray-900">Add Task</DialogTitle>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                            {/*CONTENT DRAWER TASK*/}
                                            <form onSubmit={addTask}>
                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">Project</label>
                                                    <div className="mt-2 grid grid-cols-1">
                                                        <select id="project-list" name="project-list" autoComplete="project-list"
                                                                className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                                            {projects.length === 0 ? <option>-- No Project --</option> : projects.map(p => (
                                                                <option key={p.id}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDownIcon aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4" />
                                                    </div>
                                                </div>

                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Nama</label>
                                                    <div className="mt-2">
                                                        <input id="task-name" name="task-name" type="text" autoComplete="task-name" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                                                    </div>
                                                </div>

                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">Status</label>
                                                    <div className="mt-2 grid grid-cols-1">
                                                        <select id="task-status" name="task-status" autoComplete="task-status" className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                                            <option>Draft</option>
                                                            <option>In Progress</option>
                                                            <option>Done</option>
                                                        </select>
                                                        <ChevronDownIcon aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4" />
                                                    </div>
                                                </div>

                                                <div className="col-span-full mb-10">
                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Bobot</label>
                                                    <div className="mt-2">
                                                        <input id="task-weight" name="task-weight" type="number" autoComplete="task-weight" className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-end">
                                                    <Button type="submit" className="bg-blue-500 px-3 font-semibold text-white shadow-xs hover:bg-blue-700 w-20">Add</Button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </div>
                        </div>
                    </div>
                </Dialog>
            </div>

            <div className="px-10 pt-5 pb-10">
                {renderedProjects}
            </div>

            {/* EDIT TASK DRAWER */}
            {crudTask && (
                <Dialog open={true} onClose={() => setCrudTask(null)} className="relative z-10">
                    <DialogBackdrop transition className="fixed inset-0 bg-gray-300/75 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                    <div className="fixed inset-0 overflow-hidden">
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                                <DialogPanel transition className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                    <TransitionChild>
                                        <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                                            <button type="button" onClick={() => setCrudTask(null)} className="relative rounded-md text-gray-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                                <span className="absolute -inset-2.5" />
                                                <span className="sr-only">Close panel</span>
                                                <XMarkIcon aria-hidden="true" className="size-6" />
                                            </button>
                                        </div>
                                    </TransitionChild>
                                    <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                        <div className="px-4 sm:px-6">
                                            <DialogTitle className="text-base font-semibold text-gray-900">Edit Task</DialogTitle>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                            <form onSubmit={(e) => updateTask(e, crudTask)}>
                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Project</label>
                                                    <div className="mt-2">
                                                        <input disabled id="project-choosen" name="project-choosen" type="text" autoComplete="project-choosen" defaultValue={projects.find(p => p.id === crudTask.projectId)?.name || ''} className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed" />
                                                    </div>
                                                </div>

                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Nama</label>
                                                    <div className="mt-2">
                                                        <input id="task-name" name="task-name" type="text" autoComplete="task-name" defaultValue={crudTask.name} className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                                                    </div>
                                                </div>

                                                <div className="col-span-full mb-5">
                                                    <label htmlFor="country" className="block text-sm/6 font-medium text-gray-900">Status</label>
                                                    <div className="mt-2 grid grid-cols-1">
                                                        <select id="task-status" name="task-status" autoComplete="task-status" defaultValue={crudTask.status} className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6">
                                                            <option>Draft</option>
                                                            <option>In Progress</option>
                                                            <option>Done</option>
                                                        </select>
                                                        <ChevronDownIcon aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4" />
                                                    </div>
                                                </div>

                                                <div className="col-span-full mb-10">
                                                    <label htmlFor="street-address" className="block text-sm/6 font-medium text-gray-900">Bobot</label>
                                                    <div className="mt-2">
                                                        <input id="task-weight" name="task-weight" type="number" autoComplete="task-weight" defaultValue={crudTask.weight} className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" />
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-center justify-between gap-x-6">
                                                    <Button onClick={() => deleteTask(crudTask.id)} className="bg-red-500 px-3 font-semibold text-white shadow-xs hover:bg-red-700 w-20">Delete</Button>
                                                    <Button type="submit" className="bg-blue-500 px-3 font-semibold text-white shadow-xs hover:bg-blue-700 w-20">Save</Button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </DialogPanel>
                            </div>
                        </div>
                    </div>
                </Dialog>
            )}
        </>
    )
}
export default App