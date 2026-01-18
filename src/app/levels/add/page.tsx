// src/app/levels/add/page.tsx
"use client";

import {useRouter} from "next/navigation";
import LevelForm from "@/components/features/Levels/LevelForm";
import {useToast} from "@/components/shared";
import Layout from "@/components/layout/Layout";

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
		<Layout>
			<main className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-800">Add New Level</h1>
				</div>
				<LevelForm onSubmit={handleSubmit} />
			</main>
		</Layout>
	);
}
