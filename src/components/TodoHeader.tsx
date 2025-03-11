import React from 'react';
import { Todo } from '../types/Todo';

interface Props {
  todos: Todo[];
  newTodo: string;
  setNewTodo: React.Dispatch<React.SetStateAction<string>>;
  handleAdd: (event: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  handleToggle: () => Promise<void>;
}

export const TodoHeader: React.FC<Props> = ({
  todos,
  handleAdd,
  newTodo,
  setNewTodo,
  isLoading,
  inputRef,
  handleToggle,
}) => {
  return (
    <header className="todoapp__header">
      {!isLoading && todos.length > 0 && (
        <button
          type="button"
          className={`todoapp__toggle-all ${todos.every(todo => todo.completed) ? 'active' : ''}`}
          data-cy="ToggleAllButton"
          onClick={handleToggle}
        />
      )}
      <form onSubmit={handleAdd}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={event => setNewTodo(event.target.value)}
          disabled={isLoading}
          ref={inputRef}
          autoFocus
        />
      </form>
    </header>
  );
};
