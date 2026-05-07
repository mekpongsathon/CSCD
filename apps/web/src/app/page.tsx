import { Nav } from "@/components/Nav";
import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-canvas-white">
      <Nav />
      <Dashboard />
    </div>
  );
}
