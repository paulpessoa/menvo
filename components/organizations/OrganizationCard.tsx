"use client"

import Link from "next/link"
import Image from "next/image"
import { Building2, Users, GraduationCap, Briefcase, Heart, Users2, Zap, Globe } from "lucide-react"
import { Organization, OrganizationType } from "@/types/organizations"

interface OrganizationCardProps {
    organization: Organization & {
        member_counts?: {
            mentors: number
            mentees: number
        }
    }
    layout?: "grid" | "list"
}

const typeIcons: Record<OrganizationType, any> = {
    company: Briefcase,
    ngo: Heart,
    hackathon: Zap,
    sebrae: Building2,
    community: Users2,
    other: Globe
}

const typeLabels: Record<OrganizationType, string> = {
    company: "Empresa",
    ngo: "ONG",
    hackathon: "Hackathon",
    sebrae: "SEBRAE",
    community: "Comunidade",
    other: "Outro"
}

export function OrganizationCard({ organization, layout = "grid" }: OrganizationCardProps) {
    const TypeIcon = typeIcons[organization.type]

    if (layout === "list") {
        return (
            <Link
                href={`/organizations/${organization.slug}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
                <div className="flex items-start gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        {organization.logo_url ? (
                            <Image
                                src={organization.logo_url}
                                alt={organization.name}
                                width={64}
                                height={64}
                                className="rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-indigo-600" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                    {organization.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <TypeIcon className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {typeLabels[organization.type]}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {organization.description && (
                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                {organization.description}
                            </p>
                        )}

                        {organization.member_counts && (
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                    <GraduationCap className="w-4 h-4" />
                                    <span>{organization.member_counts.mentors} mentores</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    <span>{organization.member_counts.mentees} mentees</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        )
    }

    // Grid layout
    return (
        <Link
            href={`/organizations/${organization.slug}`}
            className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
        >
            {/* Logo/Header */}
            <div className="relative h-32 bg-gradient-to-br from-indigo-500 to-purple-600">
                {organization.logo_url ? (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Image
                            src={organization.logo_url}
                            alt={organization.name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover bg-white p-2"
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-white opacity-50" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start gap-2 mb-2">
                    <TypeIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {organization.name}
                        </h3>
                        <span className="text-sm text-gray-600">
                            {typeLabels[organization.type]}
                        </span>
                    </div>
                </div>

                {organization.description && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                        {organization.description}
                    </p>
                )}

                {organization.member_counts && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <GraduationCap className="w-4 h-4" />
                            <span>{organization.member_counts.mentors}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{organization.member_counts.mentees}</span>
                        </div>
                    </div>
                )}
            </div>
        </Link>
    )
}
