import type { Metadata } from "next";
import { ProjectCard } from "@/components/ProjectCard";
import { PageHeader } from "@/app/services/page";
import { sampleProjects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Projects | Snow Engineering",
  description:
    "Selected refrigeration and cooling engineering projects across the Maldives — fisheries, hospitality, industrial, and public sector.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Projects"
        title="Engineering work across the Maldives"
        subtitle="A selection of refrigeration, ice plant, RSW, and cooling projects delivered for fisheries, resorts, industry, and institutions."
      />
      <section className="container-tech py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sampleProjects.map((p) => (
            <ProjectCard key={p.title} project={p} />
          ))}
        </div>
      </section>
    </>
  );
}
