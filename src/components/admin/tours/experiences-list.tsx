"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Compass } from "lucide-react";
import { MobileCardField } from "@/components/admin/mobile-card-field";
import { DeleteExperienceButton } from "@/app/admin/experiences/delete-button";
import type { Experience } from "@/types";

interface ExperiencesListProps {
  experiences: Experience[];
}

export function ExperiencesList({ experiences }: ExperiencesListProps) {
  if (experiences.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center py-12">
          <Compass className="h-12 w-12 text-muted-foreground/40" />
          <CardTitle className="mt-4 text-lg">No experiences yet</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first curated experience.
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/experiences/new">
              <Plus className="mr-2 h-4 w-4" />
              New Experience
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-4">
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Archetypes</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experiences.map((exp) => (
              <TableRow key={exp.id}>
                <TableCell>
                  <Link
                    href={`/admin/experiences/${exp.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {exp.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {exp.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {exp.archetype_tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {exp.sort_order}
                </TableCell>
                <TableCell>
                  <Badge variant={exp.is_active ? "default" : "secondary"}>
                    {exp.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/experiences/${exp.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <DeleteExperienceButton
                      experienceId={exp.id}
                      experienceTitle={exp.title}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {experiences.map((exp) => (
          <Card key={exp.id} className="py-3">
            <CardContent className="px-4 py-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/experiences/${exp.id}/edit`}
                  className="font-medium hover:underline"
                >
                  {exp.title}
                </Link>
                <Badge variant={exp.is_active ? "default" : "secondary"}>
                  {exp.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-xs">
                  {exp.category}
                </Badge>
                {exp.archetype_tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <dl className="grid grid-cols-2 gap-2">
                <MobileCardField label="Sort Order">
                  {exp.sort_order}
                </MobileCardField>
              </dl>
              <div className="flex items-center gap-2 border-t pt-2 mt-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/experiences/${exp.id}/edit`}>Edit</Link>
                </Button>
                <DeleteExperienceButton
                  experienceId={exp.id}
                  experienceTitle={exp.title}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
