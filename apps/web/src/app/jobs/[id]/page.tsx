import { Nav } from "@/components/Nav";
import { JobDetailView } from "@/components/JobDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-canvas-white">
      <Nav />
      <JobDetailView jobId={id} />
    </div>
  );
}
