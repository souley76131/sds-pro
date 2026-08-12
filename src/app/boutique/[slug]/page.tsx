import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BoutiqueLegacyRedirect({ params }: Props) {
  const resolved = await params;
  const q = decodeURIComponent(resolved.slug || "").trim();
  redirect(`/?q=${encodeURIComponent(q)}`);
}
