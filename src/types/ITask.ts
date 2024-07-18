export type TASK_STATUS = 'To do' | 'In progress' | 'Done'
export enum TASK_FORMAT {
    Table = 'TABLE',
    Kanban = 'KANBAN'
}

export interface ITask {
    id?: number | string;
    name: string;
    task_title: string;
    task_description: string;
    task_status?: TASK_STATUS | '';
  }
