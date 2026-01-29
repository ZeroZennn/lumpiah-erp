"use client";

import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import React from "react";

/**
 * Reusable Notification Utility
 * Standardizes toast messages across the application
 */
export const notify = {
    success: (message: string, description?: string) => {
        return toast.success(message, {
            description,
            icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        });
    },

    error: (message: string, description?: string) => {
        return toast.error(message, {
            description,
            icon: <AlertCircle className="h-4 w-4 text-destructive" />,
        });
    },

    info: (message: string, description?: string) => {
        return toast.info(message, {
            description,
            icon: <Info className="h-4 w-4 text-blue-500" />,
        });
    },

    loading: (message: string) => {
        return toast.loading(message, {
            icon: <Loader2 className="h-4 w-4 animate-spin" />,
        });
    },

    promise: <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: Error) => string);
        }
    ) => {
        return toast.promise(promise, {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
        });
    },

    dismiss: (id?: string | number) => {
        toast.dismiss(id);
    },
};

// Reusable component name as requested (though it's a utility object)
export const Notify = notify;
