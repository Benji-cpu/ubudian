import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MapPin, Sparkles, Users, Building } from "lucide-react";
import { ToursTabs } from "@/components/admin/tours/tours-tabs";
import type { Tour } from "@/types";

export default async function AdminToursPage() {
  const supabase = await createClient();

  const toursRes = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  const tours = (toursRes.data ?? []) as Tour[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tours</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/admin/journeys">
                <Sparkles className="mr-2 h-4 w-4" />
                Ubud Retreats
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/practitioners">
                <Users className="mr-2 h-4 w-4" />
                Practitioners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/partners">
                <Building className="mr-2 h-4 w-4" />
                Partners
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/tours/new">
                <MapPin className="mr-2 h-4 w-4" />
                Tour
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-6">
        <ToursTabs tours={tours} />
      </div>
    </div>
  );
}
