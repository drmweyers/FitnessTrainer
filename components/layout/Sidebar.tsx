"use client";

import {useState, useEffect} from "react";
import Link from "next/link";
import {
	Dumbbell,
	ClipboardList,
	Calendar,
	Users,
	ChevronDown,
	ChevronRight,
	BarChart3,
	Activity,
	Home,
	Menu,
	X,
	UserCircle,
	Settings
} from "lucide-react";

interface NavItemProps {
	icon: React.ReactNode;
	label: string;
	href: string;
	active?: boolean;
	hasChildren?: boolean;
	expanded?: boolean;
	onClick?: () => void;
	onMobileClick?: () => void;
}

const NavItem = ({
	icon,
	label,
	href,
	active = false,
	hasChildren = false,
	expanded = false,
	onClick,
	onMobileClick,
}: NavItemProps) => {
	return (
		<Link
			href={href}
			className={`flex items-center px-4 py-2 text-sm rounded-md mb-1 ${
				active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
			}`}
			onClick={(e) => {
				if (onClick) onClick();
				if (onMobileClick) {
					e.preventDefault();
					onMobileClick();
				}
			}}>
			<span className="mr-3">{icon}</span>
			<span className="flex-1">{label}</span>
			{hasChildren && (
				<span className="ml-auto">
					{expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
				</span>
			)}
		</Link>
	);
};

interface SidebarProps {
	isOpen: boolean;
	onClose: () => void;
	isCollapsed: boolean;
	setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ isOpen, onClose, isCollapsed, setIsCollapsed }: SidebarProps) {
	const [activeItem, setActiveItem] = useState("exercises");
	const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
		exercises: true,
		clientManagement: true,
	});
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const toggleExpand = (item: string) => {
		setExpandedItems((prev) => ({
			...prev,
			[item]: !prev[item],
		}));
	};

	// Mobile menu toggle button
	const MobileMenuButton = () => (
		<button
			onClick={() => onClose()}
			className="lg:hidden fixed top-3 left-4 z-50 p-2 rounded-md hover:bg-gray-100"
		>
			{isOpen ? <X size={24} /> : <Menu size={24} />}
		</button>
	);

	return (
		<>
			<MobileMenuButton />

			<div className={`
				${isOpen ? 'translate-x-0' : '-translate-x-full'}
				lg:translate-x-0
				fixed inset-0 lg:inset-auto lg:relative
				w-[280px] lg:w-60 h-screen
				bg-white border-r border-gray-200
				flex flex-col
				transition-transform duration-300 ease-in-out
				z-40
			`}>
				<div className="flex-1 overflow-y-auto p-3">
					<NavItem
						icon={<Home size={18} />}
						label="Dashboard"
						href="/dashboard"
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					<NavItem
						icon={<Dumbbell size={18} />}
						label="Exercises"
						href="#"
						active={activeItem === "exercises"}
						hasChildren={true}
						expanded={expandedItems.exercises}
						onClick={() => toggleExpand("exercises")}
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					{expandedItems.exercises && (
						<div className="ml-7 border-l border-gray-200 pl-3 mb-2">
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="All Exercises"
								href="/exercises"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Strength"
								href="/exercises/strength"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Cardio"
								href="/exercises/cardio"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Flexibility"
								href="/exercises/flexibility"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
						</div>
					)}

					<NavItem
						icon={<ClipboardList size={18} />}
						label="Workouts"
						href="/workouts"
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					<NavItem
						icon={<Activity size={18} />}
						label="Workout Tracker"
						href="/workout-tracker"
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					<NavItem
						icon={<Calendar size={18} />}
						label="Programs"
						href="/programs"
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					<NavItem
						icon={<BarChart3 size={18} />}
						label="Analytics"
						href="/analytics"
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					<NavItem
						icon={<Calendar size={18} />}
						label="Schedule"
						href="/schedule"
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					<NavItem
						icon={<Users size={18} />}
						label="Client Management"
						href="#"
						active={activeItem === "client-management"}
						hasChildren={true}
						expanded={expandedItems.clientManagement}
						onClick={() => toggleExpand("clientManagement")}
						onMobileClick={isMobile ? () => onClose() : undefined}
					/>

					{expandedItems.clientManagement && (
						<div className="ml-7 border-l border-gray-200 pl-3 mb-2">
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="All Clients"
								href="/clients"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Active Clients"
								href="/clients?status=active"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Inactive Clients"
								href="/clients?status=inactive"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Pending Clients"
								href="/clients?status=pending"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
							<NavItem
								icon={<div className="w-2 h-2 rounded-full bg-gray-400" />}
								label="Archived Clients"
								href="/clients?status=archived"
								onMobileClick={isMobile ? () => onClose() : undefined}
							/>
						</div>
					)}

					<div className="border-t border-gray-200 mt-3 pt-3">
						<NavItem
							icon={<UserCircle size={18} />}
							label="My Profile"
							href="/profile"
							onMobileClick={isMobile ? () => onClose() : undefined}
						/>
						<NavItem
							icon={<Settings size={18} />}
							label="Settings"
							href="/profile/edit"
							onMobileClick={isMobile ? () => onClose() : undefined}
						/>
					</div>
				</div>
			</div>

			{/* Overlay for mobile */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
					onClick={() => onClose()}
				/>
			)}
		</>
	);
}
