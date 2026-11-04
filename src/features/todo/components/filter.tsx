import { useEffect, useState } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";
import { SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TodoFilter = (): React.ReactNode => {
  const searchParams = useSearch({ from: "/_authenicated/todos/" });
  const navigate = useNavigate({ from: "/todos/" });

  const [searchTerm, setSearchTerm] = useState<string>(
    searchParams.search ?? "",
  );

  // Sync internal search input with URL search state if changed externally
  useEffect(() => {
    setSearchTerm(searchParams.search ?? "");
  }, [searchParams.search]);

  // Debounce 500ms: Delay updating the URL until user stops typing
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchTerm.trim();
      const currentParam = searchParams.search ?? "";

      if (trimmed !== currentParam) {
        navigate({
          search: {
            ...searchParams,
            search: trimmed || undefined,
            page: 1,
          },
        });
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, searchParams, navigate]);

  const handleStatusChange = (val: string | null): void => {
    navigate({
      search: {
        ...searchParams,
        status:
          val && val !== "all"
            ? (val as typeof searchParams.status)
            : undefined,
        page: 1,
      },
    });
  };

  const handleClear = (): void => {
    setSearchTerm("");
    navigate({
      search: {
        ...searchParams,
        search: undefined,
        status: undefined,
        page: 1,
      },
    });
  };

  const hasActiveFilters = Boolean(searchTerm || searchParams.status);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search todos by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select
          value={searchParams.status ?? "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="canncelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
