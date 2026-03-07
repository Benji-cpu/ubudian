import { CATEGORY_EMOJI, CATEGORY_GRADIENTS } from "@/lib/constants";

interface EventCardPlaceholderProps {
  category: string;
  className?: string;
}

export function EventCardPlaceholder({ category, className = "" }: EventCardPlaceholderProps) {
  const gradient = CATEGORY_GRADIENTS[category] || CATEGORY_GRADIENTS["Other"];
  const emoji = CATEGORY_EMOJI[category] || CATEGORY_EMOJI["Other"];

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}
    >
      <span className="text-2xl">{emoji}</span>
    </div>
  );
}
