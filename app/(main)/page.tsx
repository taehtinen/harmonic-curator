import Artists from "@/components/artists";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    artist?: string;
    q?: string;
  }>;
}) {
  return <Artists searchParams={searchParams} />;
}
