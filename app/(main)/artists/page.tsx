import Artists from "@/components/artists";

export default function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    artist?: string;
    q?: string;
    noGenres?: string;
  }>;
}) {
  return <Artists searchParams={searchParams} />;
}
