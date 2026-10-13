"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * Komponen Dialog Responsif: Dialog di Desktop, Drawer (Bottom Sheet) di Mobile
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   title: string,
 *   description?: string,
 *   children: React.ReactNode,
 *   className?: string
 * }} props
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "sm:max-w-lg bg-white rounded-2xl p-6 border-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto",
            className
          )}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className="text-sm text-slate-500 mt-1">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={cn("bg-white p-5 rounded-t-3xl max-h-[85vh]", className)}>
        <DrawerHeader className="text-left px-0 pb-3">
          <DrawerTitle className="text-lg font-bold text-slate-900">
            {title}
          </DrawerTitle>
          {description && (
            <DrawerDescription className="text-xs text-slate-500">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[calc(85vh-90px)] pb-6 px-1">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
