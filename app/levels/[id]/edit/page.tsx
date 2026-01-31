// src/app/levels/[id]/edit/page.tsx
"use client";

import {useState, useEffect} from "react";
import {useParams, useRouter} from "next/navigation";
import LevelForm from "@/components/features/Levels/LevelForm";
import {useToast} from "@/components/shared";
import Layout from "@/components/layout/Layout";

export default function EditLevelPage() {
	const params = useParams();
	const router = useRouter();
	const {toast} = useToast();
	const [level, setLevel] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchLevel = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/levels/${params.id}`);

				if (!response.ok) {
					throw new Error("Level not found");
				}

				const data = await response.json();
				setLevel(data);
			} catch (error) {
				toast({
					title: "Error",
					description:
						error instanceof Error ? error.message : "Failed to fetch level",
					variant: "destructive",
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchLevel();
	}, [params.id, toast]);

	const handleSubmit = async (formData: any) => {
		try {
			const response = await fetch(`/api/levels/${params.id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) throw new Error("Failed to update level");

			toast({
				title: "Success",
				description: "Level updated successfully",
			});

			router.push(`/levels/${params.id}`);
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "Failed to update level",
				variant: "destructive",
			});
		}
	};

	if (isLoading) return <div>Loading...</div>;
	if (!level) return <div>Level not found</div>;

	return (
		<Layout>
			<main className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-800">
						Level {params.id}
					</h1>
				</div>
				<LevelForm initialData={level} onSubmit={handleSubmit} />
			</main>
		</Layout>
	);
}
