import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTodoContext } from "../context";

export const TodoHeader = (): React.ReactNode => {
  const { setAction, setSelectedTodo } = useTodoContext();

  const handleCreate = (): void => {
    setSelectedTodo(null);
    setAction("create");
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Todo List</h1>
        <p className="text-muted-foreground text-sm">
          Manage and track your tasks efficiently.
        </p>
      </div>
      <Button onClick={handleCreate} className="w-fit">
        <PlusIcon className="size-4 mr-1.5" />
        Create Todo
      </Button>
    </div>
  );
};
