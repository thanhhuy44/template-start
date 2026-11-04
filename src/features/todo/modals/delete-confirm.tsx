import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useTodoContext } from "../context";

export const DeleteConfirmModal = (): React.ReactNode => {
  const { action, setAction, selectedTodo, setSelectedTodo, deleteMutation } =
    useTodoContext();

  if (action !== "delete" || !selectedTodo) {
    return null;
  }

  const handleClose = (): void => {
    setAction(null);
    setSelectedTodo(null);
  };

  const handleDelete = (): void => {
    deleteMutation.mutate({ id: selectedTodo.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Delete Todo</CardTitle>
          <CardDescription>
            Are you sure you want to delete &quot;{selectedTodo.name}&quot;?
            This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
