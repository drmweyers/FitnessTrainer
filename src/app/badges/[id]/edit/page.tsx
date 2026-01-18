// src/app/badges/[id]/edit/page.tsx
"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import BadgeForm from "@/components/features/Badges/BadgeForm";
import {useToast} from "@/components/shared";
import Layout from "@/components/layout/Layout";

interface PageProps {
	params: {
		id: string;
	};
}

export default function EditBadgePage({params}: PageProps) {
	const router = useRouter();
	const {toast} = useToast();
	const [badge, setBadge] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const fetchBadge = async () => {
			try {
				const response = await fetch(`/api/badges/${params.id}`);
				if (!response.ok) throw new Error("Failed to fetch badge");

				const data = await response.json();
				setBadge(data.data);
			} catch (error) {
				toast({
					title: "Error",
					description: error instanceof Error ? error.message : "Failed to fetch badge",
					variant: "destructive",
				});
				router.push("/badges");
			} finally {
				setIsLoading(false);
			}
		};

		fetchBadge();
	}, [params.id, router, toast]);

	const handleSubmit = async (data: any) => {
		setIsSubmitting(true);
		try {
			const response = await fetch(`/api/badges/${params.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			if (!response.ok) throw new Error("Failed to update badge");

			toast({
				title: "Success",
				description: "Badge updated successfully",
			});

			router.push("/badges");
		} catch (error) {
			toast({
				title: "Error",
				description: error instanceof Error ? error.message : "Failed to update badge",
				variant: "destructive",
			});
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<Layout>
				<main className="p-6">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
						<div className="space-y-4">
							<div className="h-32 bg-gray-200 rounded"></div>
							<div className="h-32 bg-gray-200 rounded"></div>
						</div>
					</div>
				</main>
			</Layout>
		);
	}

	return (
		<Layout>
			<main className="p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-800">Edit Badge</h1>
					<p className="text-gray-600">Update badge information</p>
				</div>
				<BadgeForm
					initialData={badge}
					onSubmit={handleSubmit}
					isSubmitting={isSubmitting}
				/>
			</main>
		</Layout>
	);
}
