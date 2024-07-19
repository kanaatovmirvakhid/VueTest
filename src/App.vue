<script setup lang="ts">
import { onMounted } from 'vue'
import { useTasksStore } from './stores/task/TasksStore'

const tasksStore = useTasksStore()

const init = () => {
  tasksStore.getTasks()
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="container">
    <v-switch
      v-model="tasksStore.taskSwitch"
      :label="`Switch: ${tasksStore.taskSwitch ? 'Data' : 'Kanban'}`"
      hide-details
      inset
    ></v-switch>

    <keep-alive>
      <component :is="tasksStore.tasksFormat"></component>
    </keep-alive>

    <div class="text-center" v-if="tasksStore.loader">
      <v-progress-circular
        :size="60"
        :width="9"
        color="primary"
        indeterminate
      ></v-progress-circular>
    </div>
  </div>
</template>

<style scoped lang="scss">
.container {
  width: 100%;
  height: 100%;
  padding: 20px 30px;
}
</style>
