"use client";

import Link from "next/link";
import { Compass, Mail, Sparkles, Info, ChevronDown } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const EXPLORE_ITEMS = [
  {
    label: "Guides",
    href: "/experiences",
    icon: Compass,
    description: "Understand the practices",
  },
  {
    label: "Newsletter",
    href: "/newsletter",
    icon: Mail,
    description: "Weekly dispatch",
  },
  {
    label: "Membership",
    href: "/membership",
    icon: Sparkles,
    description: "Join the circle",
  },
  {
    label: "About",
    href: "/about",
    icon: Info,
    description: "Our story & mission",
  },
] as const;

export function ExploreMenu({ newsletterEnabled = true }: { newsletterEnabled?: boolean } = {}) {
  const items = EXPLORE_ITEMS.filter(
    (i) => newsletterEnabled || i.href !== "/newsletter"
  );
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className="h-auto bg-transparent p-0 text-xs font-semibold uppercase tracking-widest text-brand-off-white transition-colors duration-300 hover:bg-transparent hover:text-brand-gold focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-brand-gold [&>svg]:hidden"
          >
            <span className="flex items-center gap-1">
              More
              <ChevronDown className="h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </span>
          </NavigationMenuTrigger>
          <NavigationMenuContent className="border-none bg-transparent p-0 shadow-none">
            <div
              className="w-[420px] rounded-xl border border-brand-gold/30 bg-brand-deep-green/97 p-4 shadow-2xl backdrop-blur-[12px] dark:bg-background/97"
            >
              <div className="grid grid-cols-2 gap-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavigationMenuLink key={item.href} asChild>
                      <Link
                        href={item.href}
                        className="group flex items-start gap-3 rounded-lg p-3 transition-colors duration-200 hover:bg-brand-gold/10"
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-cream/60 transition-colors duration-200 group-hover:text-brand-gold" />
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-widest text-brand-off-white">
                            {item.label}
                          </div>
                          <div className="mt-0.5 text-[11px] normal-case tracking-normal text-brand-cream/60">
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  );
                })}
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
