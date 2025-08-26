"use client";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { LogOut } from "lucide-react";

export default function LogoutButton({ logout }) {
    return (
        <div className="flex items-center gap-2">
            <AlertDialog.Root>
                <AlertDialog.Trigger asChild>
                    <button className="text-red-500 hover:text-red-600 text-xs sm:text-sm flex items-center gap-1 sm:gap-2">
                        <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </AlertDialog.Trigger>

                <AlertDialog.Portal>
                    <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
                    <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg">
                        <AlertDialog.Title className="font-bold text-lg">
                            Confirm Logout
                        </AlertDialog.Title>
                        <AlertDialog.Description className="text-sm text-gray-600 mt-2">
                            Are you sure you want to log out?
                        </AlertDialog.Description>
                        <div className="flex justify-end gap-2 mt-4">
                            <AlertDialog.Cancel className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
                                Cancel
                            </AlertDialog.Cancel>
                            <AlertDialog.Action
                                onClick={logout}
                                className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                            >
                                Logout
                            </AlertDialog.Action>
                        </div>
                    </AlertDialog.Content>
                </AlertDialog.Portal>
            </AlertDialog.Root>
        </div>
    );
}
