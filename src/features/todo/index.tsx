import { TodoFilter } from "./components/filter";
import { TodoHeader } from "./components/header";
import { TodoTable } from "./components/table";
import { TodoContextProvider } from "./context";
import { DeleteConfirmModal } from "./modals/delete-confirm";
import { UpsertTodo } from "./modals/upsert";

export const TodosPage = (): React.ReactNode => {
  return (
    <TodoContextProvider>
      <div className="container mx-auto space-y-6 p-4 sm:p-6 max-w-6xl">
        <TodoHeader />
        <TodoFilter />
        <TodoTable />
        <UpsertTodo />
        <DeleteConfirmModal />
      </div>
    </TodoContextProvider>
  );
};
