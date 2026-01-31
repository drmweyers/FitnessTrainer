// src/app/levels/add/page.tsx
"use client";

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BadgeForm from '@/components/features/Badges/BadgeForm'
import { useToast } from '@/components/shared'
import Layout from '@/components/layout/Layout';

export default function AddBadgePage() {
	const router = useRouter()
	const { toast } = useToast()
	const [isSubmitting, setIsSubmitting] = useState(false)
	
	const handleSubmit = async (data: any) => {
		setIsSubmitting(true)
		try {
			const response = await fetch('/api/badges', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(data),
			})
			
			if (!response.ok) throw new Error('Failed to create badge')
			
			toast({
				title: 'Success',
				description: 'Badge created successfully',
			})
			
			router.push('/badges')
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to create badge',
				variant: 'destructive',
			})
			setIsSubmitting(false)
		}
	}
	
	return (
<Layout>
				
				<main className="p-6">
					<div className="mb-6">
						<h1 className="text-2xl font-bold text-gray-800">Create New Badge</h1>
						<p className="text-gray-600">Add a new achievement badge to the system</p>
					</div>
					
					<BadgeForm
						onSubmit={handleSubmit}
						isSubmitting={isSubmitting}
					/>
				</main>
			</Layout>
	)
}
