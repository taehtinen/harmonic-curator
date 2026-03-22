import Artists from "@/components/artists";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string; order?: string }>;
}) {
  return <Artists searchParams={searchParams} />;
}
