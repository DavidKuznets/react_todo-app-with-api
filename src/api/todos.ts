import { Todo } from '../types/Todo';
import { client } from '../utils/fetchClient';

export const USER_ID = 2375;

// Функція для отримання всіх задач
export const getTodos = () => {
  return client.get<Todo[]>(`/todos?userId=${USER_ID}`);
};

// Функція для додавання нової задачі
export const addTodo = (newTodo: { title: string; completed: boolean }) => {
  return client.post<Todo>('/todos', {
    userId: USER_ID,
    title: newTodo.title,
    completed: newTodo.completed,
  });
};

export const patchTodo = (id: number, updatedFields: Partial<Todo>) => {
  // console.log('Patch request for Todo ID:', id, updatedFields);

  return client.patch<Todo>(`/todos/${id}`, updatedFields);
};

// Функція для видалення задачі
export const deleteTodo = (id: number) => {
  return client.delete(`/todos/${id}`);
};
