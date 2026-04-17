import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Compass } from "lucide-react";
import { ToursTabs } from "@/components/admin/tours/tours-tabs";
import type { Tour, Experience } from "@/types";

export default async function AdminToursPage() {
  const supabase = await createClient();

  const [toursRes, expRes] = await Promise.all([
    supabase.from("tours").select("*").order("created_at", { ascending: false }),
    supabase
      .from("experiences")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  const tours = (toursRes.data ?? []) as Tour[];
  const experiences = (expRes.data ?? []) as Experience[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tours &amp; Experiences</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/admin/tours/new">
                <MapPin className="mr-2 h-4 w-4" />
                Tour
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/experiences/new">
                <Compass className="mr-2 h-4 w-4" />
                Experience
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6">
        <ToursTabs tours={tours} experiences={experiences} />
      </div>
    </div>
  );
}
