import Image from "next/image"
import { Badge } from "@/types/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface BadgeCardProps {
  badge: Badge
}

export function BadgeCard({ badge }: BadgeCardProps) {
  return (
    <Card className="w-[300px] overflow-hidden">
      <CardHeader>
        <div className="relative h-40 w-full">
          <Image
            src={badge.imageUrl}
            alt={badge.name}
            fill
            className="object-contain"
          />
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle>{badge.name}</CardTitle>
        <CardDescription className="mt-2">{badge.description}</CardDescription>
      </CardContent>
    </Card>
  )
} 