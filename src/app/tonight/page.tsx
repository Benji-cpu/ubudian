import { permanentRedirect } from "next/navigation";

// /tonight was the first deals page. /deals now shows today's deals first, so
// this path forwards there. /tonight/add and /tonight/confirm/<token> stay:
// venues hold confirm links that point at them.
export default function TonightPage() {
  permanentRedirect("/deals");
}
