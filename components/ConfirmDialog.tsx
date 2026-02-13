"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

type ConfirmDialogProps = {
  trigger: React.ReactNode;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
};

export function ConfirmDialog({
  trigger,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onConfirm,
  variant = "default"
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            className={variant === "destructive" ? buttonVariants({ variant: "destructive" }) : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
