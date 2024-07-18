import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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

const generateUniqueId = (baseId: number | string | undefined, index: number): string => {
  return `${String(baseId || 'undefined')}_${index}`
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
type ComponentType = typeof TasksKanban | typeof TasksTable

export const useTasksStore = defineStore('tasks', () => {
    const taskSwitch = ref(true)
//   const tasksFormat = shallowRef<ComponentType>(TasksTable)
const tasksFormat = computed<ComponentType>(() => {
    return taskSwitch.value ? TasksTable : TasksKanban;
  });
  const loader = ref(false)
  const tasks = ref<ITask[]>([])

  const getTasks = async () => {
    loader.value = true
    const res = await fetch(url)
      .then((res) => res.json())
      .catch((error) => {
        console.log(error)
        return []
      })

    tasks.value = multiplyArray(addRandomStatusToObjects(res), 100)
    loader.value = false
  }

  const editItem = (item: ITask) => {
    const index = tasks.value.indexOf(item)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...item }
    }
  }

  const deleteItem = (id: number) => {
    tasks.value.splice(id, 1)
  }

  const save = (editedItem: ITask, editedIndex: number) => {
    if (editedIndex > -1) {
      tasks.value[editedIndex] = { ...tasks.value[editedIndex], ...editedItem }
    } else {
      tasks.value.push({ ...editedItem })
    }
  }

  return { loader, tasks, getTasks, tasksFormat, editItem, deleteItem, save, taskSwitch }
})
