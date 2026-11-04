import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { XIcon } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTodoContext } from "../context";

const todoStatusEnum = z.enum([
  "draft",
  "not_started",
  "in_progress",
  "pending",
  "done",
  "canncelled",
]);

const upsertTodoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  status: todoStatusEnum,
});

export type UpsertTodoFormValues = z.infer<typeof upsertTodoSchema>;

export const UpsertTodo = (): React.ReactNode => {
  const {
    action,
    setAction,
    selectedTodo,
    setSelectedTodo,
    createMutation,
    updateMutation,
  } = useTodoContext();

  const isEditing = action === "update" && Boolean(selectedTodo);
  const isOpen = action === "create" || action === "update";

  const form = useForm<UpsertTodoFormValues>({
    resolver: zodResolver(upsertTodoSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
    },
  });

  // Sync form values when opening for edit or create
  useEffect(() => {
    if (action === "update" && selectedTodo) {
      form.reset({
        name: selectedTodo.name,
        description: selectedTodo.description ?? "",
        status: selectedTodo.status,
      });
    } else if (action === "create") {
      form.reset({
        name: "",
        description: "",
        status: "draft",
      });
    }
  }, [action, selectedTodo, form]);

  if (!isOpen) {
    return null;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = (): void => {
    setAction(null);
    setSelectedTodo(null);
    form.reset();
  };

  const onSubmit = async (values: UpsertTodoFormValues): Promise<void> => {
    if (isEditing && selectedTodo) {
      updateMutation.mutate({
        id: selectedTodo.id,
        body: values,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md relative">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={handleClose}
          disabled={isPending}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </Button>

        <CardHeader>
          <CardTitle>{isEditing ? "Edit Todo" : "Create Todo"}</CardTitle>
          <CardDescription>
            {isEditing
              ? "Update the details of your task."
              : "Add a new task to your todo list."}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Prepare project presentation"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Optional task details or notes..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="not_started">
                            Not Started
                          </SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="canncelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? "Saving..."
                    : "Creating..."
                  : isEditing
                    ? "Save Changes"
                    : "Create Todo"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};
