<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useTasksStore, generateUniqueId  } from '@/stores/task/TasksStore'
import { type ITask } from '@/types/ITask'

const tasksStore = useTasksStore()
const dialog = ref(false)
const dialogDelete = ref(false)
const expanded = ref([])
const searchQuery = ref('')

const filteredTasks = computed(() => {
  if (!searchQuery.value) {
    return tasksStore.tasks
  }

  const query = searchQuery.value.toLowerCase()

  return tasksStore.tasks.filter(task => {
    return Object.values(task).some(value =>
      String(value).toLowerCase().includes(query)
    )
  })
})

const editedIndex = ref(-1)
const editedItem = reactive<ITask>({
  name: '',
  task_title: '',
  task_description: '',
  task_status: '',
})
const defaultItem: ITask = {
  name: '',
  task_title: '',
  task_description: '',
  task_status: '',
}

const headers = computed(() => [
  { title: 'Name', align: 'start', key: 'name' },
  { title: 'Title', key: 'task_title' },
  { title: 'Status', key: 'task_status' },
  { title: 'Actions', key: 'actions', sortable: false },
])

const formTitle = computed(() => (editedIndex.value === -1 ? 'New Item' : 'Edit Item'))

watch(dialog, (val) => {
  if (!val) close()
})

watch(dialogDelete, (val) => {
  if (!val) closeDelete()
})

const editItem = (item: ITask) => {
  editedIndex.value = tasksStore.tasks.indexOf(item);
  Object.assign(editedItem, {
    ...item,
    id: item.id || undefined // устанавливаем текущий id или undefined, если его нет
  });
  dialog.value = true;
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

const save = () => {
  const id = editedItem.id ? editedItem.id : undefined; // используем текущий id или undefined
  const newId = generateUniqueId(id, editedIndex.value); // генерируем уникальный id

  const newItem: ITask = {
    ...editedItem,
    id: newId
  };

  tasksStore.save(newItem, editedIndex.value);
  close();
}
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="filteredTasks"
    item-value="id"
    show-expand
    v-model:expanded="expanded"
  >
    <template v-slot:top>
      <v-toolbar flat>
        <v-toolbar-title>My tasks</v-toolbar-title>
        <v-divider class="mx-4" inset vertical></v-divider>
        <v-spacer></v-spacer>
        <v-dialog v-model="dialog" max-width="500px">
          <template v-slot:activator="{ props }">
            <v-btn class="mb-2" color="primary" dark v-bind="props">
              New Item
            </v-btn>
            <v-spacer></v-spacer>
            <v-text-field label="Search" class="mt-5" v-model="searchQuery"></v-text-field>
          </template>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ formTitle }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" md="4" sm="6">
                    <v-text-field v-model="editedItem.name" label="Task name"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4" sm="6">
                    <v-text-field v-model="editedItem.task_title" label="Task title"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4" sm="6">
                    <v-text-field v-model="editedItem.task_description" label="Task description"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4" sm="6">
                    <v-select
                        v-model="editedItem.task_status"
                        label="Task status"
                        :items="['To do', 'In progress', 'Done']"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue-darken-1" variant="text" @click="close">
                Cancel
              </v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="save">
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <v-dialog v-model="dialogDelete" max-width="500px">
          <v-card>
            <v-card-title class="text-h5">Are you sure you want to delete this item?</v-card-title>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue-darken-1" variant="text" @click="closeDelete">Cancel</v-btn>
              <v-btn color="blue-darken-1" variant="text" @click="deleteItemConfirm">OK</v-btn>
              <v-spacer></v-spacer>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon class="me-2" size="small" @click="editItem(item)">
        mdi-pencil
      </v-icon>
      <v-icon size="small" @click="deleteItem(item)">
        mdi-delete
      </v-icon>
    </template>
    <template v-slot:expanded-row="{ columns, item }">
      <tr>
        <td :colspan="columns.length">
          {{ item.task_description }}
        </td>
      </tr>
    </template>
  </v-data-table>
</template>