// src/app/levels/add/page.tsx
"use client";

import {useRouter} from "next/navigation";
import LevelForm from "@/components/features/Levels/LevelForm";
import {useToast} from "@/components/shared/use-toast";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

export default function AddLevelPage() {
	const router = useRouter();
	const {toast} = useToast();

	const handleSubmit = async (formData: any) => {
		try {
			const response = await fetch("/api/levels", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) throw new Error("Failed to create level");

			toast({
				title: "Success",
				description: "Level created successfully",
			});

			router.push("/levels");
		} catch (error) {
			if (error instanceof Error) {
				toast({
					title: "Error",
					description: error.message,
					variant: "destructive",
				});
			} else {
				toast({
					title: "Error",
					description: "An unknown error occurred",
					variant: "destructive",
				});
			}
		}
	};

	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />

			<div className="flex-1 ml-60">
				<Header />

				<main className="p-6">
					<div className="mb-6">
						<h1 className="text-2xl font-bold text-gray-800">Add New Level</h1>
					</div>
					<LevelForm onSubmit={handleSubmit} />
				</main>
			</div>
		</div>
	);
}
