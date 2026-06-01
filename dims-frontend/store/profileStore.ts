import { create } from "zustand";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";


interface AuthState {
    uploadProfilePicture: (file: File) => Promise<{avatarUrl: string, publicId: string}>;
    isLoading: boolean;

}


export const useProfileStore = create<AuthState>()(

    (set) => ({
        isLoading: false,

        uploadProfilePicture: async (file: File) => {
            set({ isLoading: true });
            try {
                const formData = new FormData();
                formData.append("file", file);
                const response = await api.post("/users/upload-profile-picture", formData);

                set({ isLoading: false });
                toast.success("Profile picture updated successfully!");
                // Optionally, you can update the user's profile in the auth store here
                const { user } = useAuthStore.getState();
                if (user) {
                    useAuthStore.setState({ user: { ...user, avatarUrl: response.data.imageUrl } });
                }

                return response.data;

            } catch (error) {
                set({ isLoading: false });
                toast.error("Failed to upload profile picture. Please try again.");
                console.error("Error uploading profile picture:", error);
            } finally {
                set({ isLoading: false });
            }
        }
    }),
);