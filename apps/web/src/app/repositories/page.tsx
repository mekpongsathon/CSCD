import { Nav } from "@/components/Nav";
import { RepositoriesView } from "@/components/RepositoriesView";

export default function RepositoriesPage() {
  return (
    <div className="min-h-screen bg-canvas-white">
      <Nav />
      <RepositoriesView />
    </div>
  );
}
