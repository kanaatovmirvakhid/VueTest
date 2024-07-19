<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import draggable from 'vuedraggable'
import { useTasksStore, generateUniqueId } from '@/stores/task/TasksStore'
import { type ITask, type TASK_STATUS } from '@/types/ITask'
import { statuses } from '@/constants/task'

// Используем хранилище задач
const tasksStore = useTasksStore()
const dialog = ref(false)
const dialogDelete = ref(false)
const searchQuery = ref('')

// Параметры пагинации
const itemsPerPageOptions = [10, 20, 50, 100]
const itemsPerPage = ref(50)
const currentPage = reactive({
  'In progress': 1,
  Done: 1,
  'To do': 1
})

const filteredTasksTodo = ref<ITask[]>([])
const filteredTasksInProgress = ref<ITask[]>([])
const filteredTasksDone = ref<ITask[]>([])

const getFilteredTasks = () => {
  getFilteredTasksTodo()
  getFilteredTasksInProgress()
  getFilteredTasksDone()
}

const getFilteredTasksTodo = () => {
  const startIndex = (currentPage['To do'] - 1) * itemsPerPage.value
  const endIndex = currentPage['To do'] * itemsPerPage.value
  filteredTasksTodo.value = filteredTasks.value
    .filter((task) => task.task_status === 'To do')
    .slice(startIndex, endIndex)
}

const getFilteredTasksInProgress = () => {
  const startIndex = (currentPage['In progress'] - 1) * itemsPerPage.value
  const endIndex = currentPage['In progress'] * itemsPerPage.value
  filteredTasksInProgress.value = filteredTasks.value
    .filter((task) => task.task_status === 'In progress')
    .slice(startIndex, endIndex)
}

const getFilteredTasksDone = () => {
  const startIndex = (currentPage['Done'] - 1) * itemsPerPage.value
  const endIndex = currentPage['Done'] * itemsPerPage.value
  filteredTasksDone.value = filteredTasks.value
    .filter((task) => task.task_status === 'Done')
    .slice(startIndex, endIndex)
}
const totalPagesTodo = computed(() => {
  const totalTasks = filteredTasks.value.filter((task) => task.task_status === 'To do').length
  return Math.ceil(totalTasks / itemsPerPage.value)
})

const totalPagesDone = computed(() => {
  const totalTasks = filteredTasks.value.filter((task) => task.task_status === 'Done').length
  return Math.ceil(totalTasks / itemsPerPage.value)
})

const totalPagesInProgress = computed(() => {
  const totalTasks = filteredTasks.value.filter((task) => task.task_status === 'In progress').length
  return Math.ceil(totalTasks / itemsPerPage.value)
})

const editedIndex = ref(-1)
const editedItem = reactive<ITask>({
  name: '',
  task_title: '',
  task_description: '',
  task_status: ''
})
const defaultItem: ITask = {
  name: '',
  task_title: '',
  task_description: '',
  task_status: ''
}

const filteredTasks = computed(() => {
  let filtered = tasksStore.tasks

  // Фильтрация по поисковому запросу и статусу задачи
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((task) =>
      Object.values(task).some((value) => String(value).toLowerCase().includes(query))
    )
  }

  return filtered
})

const editItem = (item: ITask) => {
  editedIndex.value = tasksStore.tasks.indexOf(item)
  Object.assign(editedItem, item)
  dialog.value = true
}

const deleteItem = (item: ITask) => {
  editedIndex.value = tasksStore.tasks.indexOf(item)
  Object.assign(editedItem, item)
  dialogDelete.value = true
}

const deleteItemConfirm = () => {
  if (editedItem.id) {
    tasksStore.deleteItem(editedItem.id)
    closeDelete()
  }
}

const close = () => {
  dialog.value = false
  nextTick(() => {
    Object.assign(editedItem, defaultItem)
    editedIndex.value = -1
  })
}

const closeDelete = () => {
  dialogDelete.value = false
  nextTick(() => {
    Object.assign(editedItem, defaultItem)
    editedIndex.value = -1
  })
}

const closeAdd = () => {
  showAddDialog.value = false
  nextTick(() => {
    Object.assign(editedItem, defaultItem)
    editedIndex.value = -1
  })
}

const save = () => {
  tasksStore.save(editedItem, editedIndex.value)
  close()
}

const expandedItems = ref<{ [key: number]: boolean }>({})
const toggleExpand = (id: number) => {
  expandedItems.value[id] = !expandedItems.value[id]
}

const showAddDialog = ref(false)
const newTask = reactive<ITask>({
  id: 0,
  name: '',
  task_title: '',
  task_description: '',
  task_status: '' // Это будет установлено по колонке
})

const addNewTask = (status: TASK_STATUS) => {
  newTask.task_status = status
  showAddDialog.value = true
}

const saveNewTask = () => {
  newTask.id = generateUniqueId(newTask.id, tasksStore.tasks.length + 1)
  tasksStore.save(newTask, -1) // -1 означает новый элемент
  showAddDialog.value = false
  nextTick(() => {
    Object.assign(newTask, defaultItem)
  })
}

watch(dialog, (val) => {
  if (!val) close()
})

watch(dialogDelete, (val) => {
  if (!val) closeDelete()
})

watch(showAddDialog, (val) => {
  if (!val) closeAdd()
})

watch(
  [tasksStore.tasks, itemsPerPage, searchQuery],
  () => {
    getFilteredTasks()
  },
  { immediate: true }
)

const onDragEnd = (status: TASK_STATUS, event) => {
  const draggedItem = filteredTasks.value.find((task) => task.task_status === status)
  if (draggedItem) {
    const draggedItemId = draggedItem.id
    const newStatus = event.to.parentNode.querySelector('h3').innerHTML
    if (draggedItemId) {
      tasksStore.updateTaskStatus(draggedItemId, newStatus)
    }
  }
}
</script>

<template>
  <v-select v-model="itemsPerPage" :items="itemsPerPageOptions" label="Items per page"></v-select>

  <v-text-field v-model="searchQuery" label="Search" class="mt-3"></v-text-field>

  <div class="row">
    <div class="col-4" v-for="(status, index) in statuses" :key="index">
      <h3>{{ status }}</h3>

      <template v-if="status === 'In progress'">
        <draggable
          :list="filteredTasksInProgress"
          class="list-group"
          group="a"
          item-key="id"
          @end="onDragEnd('In progress', $event)"
        >
          <template #item="{ element }">
            <div class="list-group-item item" :key="element.id">
              <div class="header" @click="toggleExpand(element.id)">
                {{ element.task_title }}
              </div>
              <transition name="fade">
                <div v-if="expandedItems[element.id]" class="description">
                  <div class="description-content">
                    {{ element.task_description }}
                  </div>
                  <div class="description-footer">
                    {{ element.name }}
                  </div>
                </div>
              </transition>
              <div class="actions">
                <v-icon @click="editItem(element)">mdi-pencil</v-icon>
                <v-icon @click="deleteItem(element)">mdi-delete</v-icon>
              </div>
            </div>
          </template>

          <template #header>
            <div class="btn-group list-group-item" role="group" aria-label="Basic example">
              <button class="btn btn-secondary" @click="addNewTask('In progress')">Add</button>
            </div>
          </template>
        </draggable>

        <div class="pagination-controls" v-if="totalPagesInProgress > 1">
          <v-btn :disabled="currentPage[status] === 1" @click="currentPage[status] -= 1">
            Previous
          </v-btn>
          <span>Page {{ currentPage[status] }} of {{ totalPagesInProgress }}</span>
          <v-btn
            :disabled="currentPage[status] === totalPagesInProgress"
            @click="currentPage[status] += 1"
          >
            Next
          </v-btn>
        </div>
      </template>

      <template v-else-if="status === 'Done'">
        <draggable
          :list="filteredTasksDone"
          class="list-group"
          group="a"
          item-key="id"
          @end="onDragEnd('Done', $event)"
        >
          <template #item="{ element }">
            <div class="list-group-item item" :key="element.id">
              <div class="header" @click="toggleExpand(element.id)">
                {{ element.task_title }}
              </div>
              <transition name="fade">
                <div v-if="expandedItems[element.id]" class="description">
                  <div class="description-content">
                    {{ element.task_description }}
                  </div>
                  <div class="description-footer">
                    {{ element.name }}
                  </div>
                </div>
              </transition>
              <div class="actions">
                <v-icon @click="editItem(element)">mdi-pencil</v-icon>
                <v-icon @click="deleteItem(element)">mdi-delete</v-icon>
              </div>
            </div>
          </template>

          <template #header>
            <div class="btn-group list-group-item" role="group" aria-label="Basic example">
              <button class="btn btn-secondary" @click="addNewTask('Done')">Add</button>
            </div>
          </template>
        </draggable>
        <div class="pagination-controls" v-if="totalPagesDone > 1">
          <v-btn :disabled="currentPage[status] === 1" @click="currentPage[status] -= 1">
            Previous
          </v-btn>
          <span>Page {{ currentPage[status] }} of {{ totalPagesDone }}</span>
          <v-btn
            :disabled="currentPage[status] === totalPagesDone"
            @click="currentPage[status] += 1"
          >
            Next
          </v-btn>
        </div>
      </template>

      <template v-else-if="status === 'To do'">
        <draggable
          :list="filteredTasksTodo"
          class="list-group"
          group="a"
          item-key="id"
          @end="onDragEnd('To do', $event)"
        >
          <template #item="{ element }">
            <div class="list-group-item item" :key="element.id">
              <div class="header" @click="toggleExpand(element.id)">
                {{ element.task_title }}
              </div>
              <transition name="fade">
                <div v-if="expandedItems[element.id]" class="description">
                  <div class="description-content">
                    {{ element.task_description }}
                  </div>
                  <div class="description-footer">
                    {{ element.name }}
                  </div>
                </div>
              </transition>
              <div class="actions">
                <v-icon @click="editItem(element)">mdi-pencil</v-icon>
                <v-icon @click="deleteItem(element)">mdi-delete</v-icon>
              </div>
            </div>
          </template>

          <template #header>
            <div class="btn-group list-group-item" role="group" aria-label="Basic example">
              <button class="btn btn-secondary" @click="addNewTask('To do')">Add</button>
            </div>
          </template>
        </draggable>

        <div class="pagination-controls" v-if="totalPagesTodo > 1">
          <v-btn :disabled="currentPage[status] === 1" @click="currentPage[status] -= 1">
            Previous
          </v-btn>
          <span>Page {{ currentPage[status] }} of {{ totalPagesTodo }}</span>
          <v-btn
            :disabled="currentPage[status] === totalPagesTodo"
            @click="currentPage[status] += 1"
          >
            Next
          </v-btn>
        </div>
      </template>
    </div>
  </div>
  <!-- Add Task Dialog -->
  <v-dialog v-model="showAddDialog" persistent max-width="500px">
    <v-card>
      <v-card-title>
        <span class="headline">Add New Task</span>
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="newTask.name" label="Name" required></v-text-field>
        <v-text-field v-model="newTask.task_title" label="Title" required></v-text-field>
        <v-textarea v-model="newTask.task_description" label="Description"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeAdd">Cancel</v-btn>
        <v-btn color="primary" @click="saveNewTask">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Edit Task Dialog -->
  <v-dialog v-model="dialog" persistent max-width="500px">
    <v-card>
      <v-card-title>
        <span class="headline">Edit Task</span>
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="editedItem.name" label="Name" required></v-text-field>
        <v-text-field v-model="editedItem.task_title" label="Title" required></v-text-field>
        <v-textarea v-model="editedItem.task_description" label="Description"></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="close">Cancel</v-btn>
        <v-btn color="primary" @click="save">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Task Dialog -->
  <v-dialog v-model="dialogDelete" persistent max-width="500px">
    <v-card>
      <v-card-title>
        <span class="headline">Confirm Deletion</span>
      </v-card-title>
      <v-card-text> Are you sure you want to delete this task? </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeDelete">Cancel</v-btn>
        <v-btn color="red" @click="deleteItemConfirm">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.row {
  display: flex;
  flex-wrap: no-wrap;
  gap: 1rem;
}

.col-4 {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

@media (max-width: 840px) {
  .row {
    flex-wrap: wrap;
  }
}

.list-group {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.list-group-item {
  padding: 0.75rem 1.25rem;
  margin-bottom: 0.5rem;
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: move; /* Added cursor for draggable items */
  position: relative; /* Ensure the description is positioned correctly */
}

.header {
  cursor: pointer;
  padding: 0.5rem 0;
  border-bottom: 1px solid #ddd;
}

.description {
  padding: 0.5rem;
  background-color: #f1f1f1;
  border-top: 1px solid #ddd;
  margin-top: 0.5rem;
  color: #666;
  position: relative;
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}

.description-content {
  padding-bottom: 0.5rem;
}

.description-footer {
  font-size: 0.875rem;
  color: #666;
  text-align: right; /* Align text to the right */
  position: absolute;
  bottom: -7px;
  right: 0;
  padding: 0.5rem;
  width: calc(100% - 1rem); /* To account for padding and border */
  box-sizing: border-box; /* Ensure padding is included in the width calculation */
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
  opacity: 0;
}

.btn-group {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-secondary {
  width: 100%;
  background-color: #6c757d;
  color: #fff;
  border: 1px solid #6c757d;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.btn-secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

h3 {
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #333;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.pagination-controls button {
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition:
    background-color 0.3s,
    box-shadow 0.3s;
}

.pagination-controls button:disabled {
  background-color: #c0c0c0;
  cursor: not-allowed;
  opacity: 0.7;
}

.pagination-controls button:not(:disabled):hover {
  background-color: #0056b3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.pagination-controls span {
  font-size: 0.875rem;
  color: #333;
}

.pagination-controls span.page-info {
  font-weight: bold;
}

.item {
  cursor: move;
  user-select: none; /* Prevent text selection during drag */
}
.actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
