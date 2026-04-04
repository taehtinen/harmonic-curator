import Playlists from "@/components/playlists";

export default function PlaylistsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    q?: string;
    playlist?: string;
    publish?: string;
    publish_err?: string;
  }>;
}) {
  return <Playlists searchParams={searchParams} />;
}
