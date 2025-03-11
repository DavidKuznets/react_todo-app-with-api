import React, { useEffect, useState, useRef } from 'react';
import { getTodos, addTodo, deleteTodo, patchTodo } from './api/todos';
import { TodoList } from './components/TodoList';
import { TodoHeader } from './components/TodoHeader';
import { Todo } from './types/Todo';
import { FilterType } from './types/enum';
import { TodoFooter } from './components/TodoFooter';
import './styles/index.scss';
import './styles/todoapp.scss';
import './styles/filter.scss';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [error, setError] = useState<string>('');
  const [newTodo, setNewTodo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTodos, setLoadingTodos] = useState<number[]>([]);
  const [filter, setFilter] = useState<FilterType>(FilterType.All);

  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') {
      return !todo.completed;
    }

    if (filter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedTitle = newTodo.trim();

    if (!trimmedTitle) {
      setError('Title should not be empty');

      return;
    }

    setTempTodo({ id: 0, userId: 1, title: trimmedTitle, completed: false });
    setIsLoading(true);

    try {
      const savedTodo = await addTodo({
        title: trimmedTitle,
        completed: false,
      });

      setTodos([...todos, savedTodo]);
      setNewTodo('');
      setTempTodo(null);
    } catch {
      setError('Unable to add a todo');
      setTempTodo(null);
    } finally {
      setTimeout(() => inputRef.current?.focus(), 0);
      setIsLoading(false);
    }
  };

  const handlePatch = async (id: number, newTitle: string) => {
    try {
      setLoadingTodos(prev => [...prev, id]);
      const updatedTodo = await patchTodo(id, { title: newTitle });

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, title: updatedTodo.title } : todo,
        ),
      );
    } catch {
      if (!isLoading) {
        setError('Unable to update a todo');
      }
    } finally {
      setLoadingTodos(prev => prev.filter(todoId => todoId !== id));
    }
  };

  const handleDelete = async (id: number) => {
    setLoadingTodos(prev => [...prev, id]);
    try {
      await deleteTodo(id);
      setTodos(todos.filter(todo => todo.id !== id));
    } catch {
      setError('Unable to delete a todo');
    } finally {
      setLoadingTodos(prev => prev.filter(todoId => todoId !== id));
      inputRef.current?.focus();
    }
  };

  const handleToggle = async (id: number) => {
    const todoToUpdate = todos.find(todo => todo.id === id);

    setIsLoading(true);

    if (!todoToUpdate) {
      return;
    }

    const newStatus = !todoToUpdate.completed;

    try {
      setLoadingTodos(prev => [...prev, id]);

      await patchTodo(id, { completed: newStatus });

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, completed: newStatus } : todo,
        ),
      );
    } catch {
      setError('Unable to update a todo');
    } finally {
      setLoadingTodos(prev => prev.filter(todoId => todoId !== id));
      setIsLoading(false);
    }
  };

  const handleToggleAll = async () => {
    const allCompleted = todos.every(todo => todo.completed);
    const newStatus = !allCompleted;

    try {
      const todosToUpdate = todos.filter(todo => todo.completed !== newStatus);

      await Promise.all(
        todosToUpdate.map(todo => patchTodo(todo.id, { completed: newStatus })),
      );

      setTodos(
        todos.map(todo =>
          todosToUpdate.includes(todo)
            ? { ...todo, completed: newStatus }
            : todo,
        ),
      );
    } catch {
      setError('Unable to toggle all todos');
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    if (completedTodos.length === 0) {
      return;
    }

    setLoadingTodos(prev => [...prev, ...completedTodos.map(todo => todo.id)]);

    const results = await Promise.allSettled(
      completedTodos.map(todo => deleteTodo(todo.id)),
    );
    const successfulDeletes = completedTodos.filter(
      (_, i) => results[i].status === 'fulfilled',
    );

    setTodos(prev => prev.filter(todo => !successfulDeletes.includes(todo)));

    if (results.some(result => result.status === 'rejected')) {
      setError('Unable to delete a todo');
    }

    setLoadingTodos(prev =>
      prev.filter(id => !completedTodos.some(todo => todo.id === id)),
    );
  };

  useEffect(() => {
    const loadTodos = async () => {
      setError('');
      setIsLoading(true);
      try {
        const loadedTodos = await getTodos();

        setTodos(loadedTodos);
      } catch {
        inputRef.current?.focus();
        setError('Unable to load todos');
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    loadTodos();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [error]);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <TodoHeader
          newTodo={newTodo}
          setNewTodo={setNewTodo}
          handleAdd={handleAdd}
          isLoading={isLoading}
          inputRef={inputRef}
          todos={todos}
          handleToggle={handleToggleAll}
        />

        <TodoList
          filteredTodos={filteredTodos}
          isLoading={isLoading}
          handleToggle={handleToggle}
          handleDelete={handleDelete}
          loadingTodos={loadingTodos}
          tempTodo={tempTodo}
          handlePatch={handlePatch}
        />

        <TodoFooter
          setFilter={setFilter}
          filter={filter}
          handleClearCompleted={handleClearCompleted}
          todos={todos}
        />
      </div>

      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${error ? '' : 'hidden'}`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setError('')}
        />
        {error}
      </div>
    </div>
  );
};
