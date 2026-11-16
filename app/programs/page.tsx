import ProgramCatalog from "@/components/ProgramCatalog";

export const metadata = { title: "Programs" };

export default function ProgramsPage() {
  return (
    <main className="shell" id="main-content" tabIndex={-1}>
      <header className="pagehead">
        <h1>Programs</h1>
        <p className="deck">Explore Bible study and ministry training at KingsWord Training Institute.</p>
      </header>
      <ProgramCatalog />
    </main>
  );
}
