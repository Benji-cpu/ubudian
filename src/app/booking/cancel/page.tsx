import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";

interface BookingCancelPageProps {
  searchParams: Promise<{ ref?: string }>;
}

export default async function BookingCancelPage({ searchParams }: BookingCancelPageProps) {
  const { ref } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardContent className="flex flex-col items-center p-8 text-center">
          <XCircle className="h-16 w-16 text-muted-foreground" />
          <h1 className="mt-4 font-serif text-2xl font-bold text-brand-deep-green">
            Payment Cancelled
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your booking was not completed. No charges were made.
          </p>
          {ref && (
            <p className="mt-2 text-sm text-muted-foreground">
              Reference: {ref}
            </p>
          )}
          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link href="/tours">Try Again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
