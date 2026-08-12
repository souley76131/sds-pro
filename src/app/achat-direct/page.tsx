import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ boutique_id?: string; boutique?: string }>;
};

export default async function AchatDirectLegacyRedirect({ searchParams }: Props) {
  const resolved = await searchParams;
  const boutique = resolved.boutique_id || resolved.boutique;
  redirect(boutique ? `/catalogue?boutique=${encodeURIComponent(boutique)}` : "/catalogue");
}