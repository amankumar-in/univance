import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask, deleteTask, reviewTask, submitTask, toggleTaskVisibility, updateTask } from "./task.api";

// Create a task
export const useCreateTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTask,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}

// Toggle the visibility of a task
export const useToggleTaskVisibility = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: toggleTaskVisibility,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}

// Submit a task
export const useSubmitTask = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitTask,
        onSuccess: async (_data, variables) => {
            return Promise.all([
                queryClient.invalidateQueries({ queryKey: ["tasks"] }),
                queryClient.invalidateQueries({ queryKey: ["task", "student", variables.id] }),
                queryClient.invalidateQueries({ queryKey: ['points'] })
            ])
        },
    });
}

// Review a task
export const useReviewTask = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: reviewTask,
        onSuccess: () => {
            return queryClient.invalidateQueries({ queryKey: ["tasks", "approval"] });
        }
    })
}

// Update a task
export const useUpdateTask = (role) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateTask(id, data, role),
        onSuccess: (_, variables) => {
            Promise.all([
                queryClient.invalidateQueries({ queryKey: ["tasks"] }),
                queryClient.invalidateQueries({ queryKey: ["task", variables.id] })
            ]);
        },
    });
}

// Delete a task
export const useDeleteTask = (role) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => deleteTask(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
    });
}

