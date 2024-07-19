import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { type TASK_STATUS, type ITask } from '@/types/ITask'
import TasksKanban from '@/components/TasksKanban.vue'
import TasksTable from '@/components/TasksTable.vue'
import { statuses } from '@/constants/task'

const url = 'https://6697e6dd02f3150fb66f685f.mockapi.io/api/v1/todo'

const getRandomStatus = (): TASK_STATUS => {
  const randomIndex = Math.floor(Math.random() * statuses.length)
  return statuses[randomIndex]
}

const addRandomStatusToObjects = (arr: ITask[]): ITask[] => {
  return arr.map((obj: ITask) => ({
    ...obj,
    task_status: getRandomStatus()
  }))
}

export const generateUniqueId = (baseId: number | string | undefined, index: number): string => {
  const timestamp = new Date().getTime(); 
  const randomSuffix = Math.floor(Math.random() * 10000); 
  return `${String(baseId || 'undefined')}_${timestamp}_${randomSuffix}_${index}`;
}

const multiplyArray = (arr: ITask[], times: number): ITask[] => {
  const result: ITask[] = []

  for (let i = 0; i < times; i++) {
    result.push(
      ...arr.map((obj, index) => ({
        ...obj,
        id: generateUniqueId(obj.id, i * arr.length + index)
      }))
    )
  }

  return result
}

export const useTasksStore = defineStore('tasks', () => {
  const taskSwitch = ref(true)
  const tasksFormat = computed(() => taskSwitch.value ? TasksTable : TasksKanban)
  const loader = ref(false)
  const tasks = ref<ITask[]>([])

  const getTasks = async () => {
    loader.value = true
    try {
      const res = await fetch(url)
      const data = await res.json()
      tasks.value = multiplyArray(addRandomStatusToObjects(data), 100)
    } catch (error) {
      console.error(error)
    } finally {
      loader.value = false
    }
  }

  const editItem = (item: ITask) => {
    const index = tasks.value.findIndex(task => task.id === item.id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...item }
    }
  }

  const deleteItem = (id: number) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  const save = (editedItem: ITask, editedIndex: number) => {
    if (editedIndex > -1) {
      tasks.value[editedIndex] = { ...tasks.value[editedIndex], ...editedItem }
    } else {
      tasks.value.push({ ...editedItem })
    }
  }

  const updateTaskStatus = (id: number, newStatus: TASK_STATUS) => {
    const index = tasks.value.findIndex(task => task.id === id)
    if (index !== -1) {
      tasks.value[index].task_status = newStatus
    } else {
      console.warn('Task not found')
    }
  }

  return { loader, tasks, getTasks, tasksFormat, editItem, deleteItem, save, taskSwitch, updateTaskStatus }
})