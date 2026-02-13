"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type Row
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search
} from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  globalFilterFn?: (row: Row<TData>, filterValue: string) => boolean;
  pageSizeOptions?: number[];
  rowsPerPageLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  pageOfLabel?: (page: number, total: number) => string;
  className?: string;
  tableClassName?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  emptyMessage = "No results.",
  globalFilterFn,
  pageSizeOptions = [10, 20, 30, 50],
  rowsPerPageLabel = "Rows per page",
  previousLabel = "Previous",
  nextLabel = "Next",
  pageOfLabel = (p, t) => `Page ${p} of ${t}`,
  className,
  tableClassName
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSizeOptions[0] ?? 10
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: globalFilterFn ? getFilteredRowModel() : undefined,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) =>
      setPagination((prev) => (typeof updater === "function" ? updater(prev) : prev)),
    state: {
      globalFilter: searchValue,
      pagination
    },
    onGlobalFilterChange: onSearchChange
      ? (updater) => {
          const v = typeof updater === "function" ? updater(searchValue) : "";
          onSearchChange(v);
        }
      : undefined,
    globalFilterFn: globalFilterFn
      ? (row, columnId, filterValue) =>
          globalFilterFn(row as Row<TData>, filterValue as string)
      : undefined,
    manualPagination: false
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  const rowModel = table.getRowModel();
  const rows = rowModel.rows;
  const hasRows = rows.length > 0;

  return (
    <div className={cn("flex flex-col gap-4 min-h-0", className)}>
      {onSearchChange && (
        <div className="flex flex-shrink-0 justify-end">
          <InputGroup className="max-w-xs" size="sm">
            <InputGroupInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
      )}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border",
          tableClassName
        )}
      >
        <div
          className={cn(
            "scrollbar-custom",
            hasRows
              ? "min-h-0 flex-1 overflow-auto"
              : "flex min-h-0 flex-1 flex-col overflow-auto"
          )}
        >
          <Table
            noScrollWrapper
            className={cn(!hasRows && "shrink-0", "table-fixed")}
          >
            <TableHeader className="sticky top-0 z-20 bg-muted shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      <div className="flex">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            {hasRows ? (
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="min-h-[38px] whitespace-nowrap"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            ) : null}
          </Table>
          {!hasRows ? (
            <div className="flex flex-1 flex-col items-center justify-center min-h-0 py-8">
              <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {table.getFilteredRowModel().rows.length} row(s)
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              {rowsPerPageLabel}
            </Label>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) =>
                setPagination((p) => ({ ...p, pageSize: Number(v), pageIndex: 0 }))
              }
            >
              <SelectTrigger className="h-8 w-20" id="rows-per-page">
                <SelectValue placeholder={String(pagination.pageSize)} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pageCount > 0 ? (
            <>
              <div className="flex w-fit items-center justify-center text-sm font-medium">
                {pageOfLabel(currentPage, pageCount)}
              </div>
              <div className="ml-auto flex items-center gap-2 lg:ml-0">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label={previousLabel}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label={nextLabel}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  size="icon"
                  onClick={() => table.setPageIndex(pageCount - 1)}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
