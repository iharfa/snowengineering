import Image from "next/image";

export interface Project {
  title: string;
  sector: string;
  location: string;
  scope: string;
  image: string;
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="tech-card overflow-hidden">
      <div className="relative flex aspect-[16/10] items-end overflow-hidden p-5">
        <Image
          src={project.image}
          alt={`${project.title} — ${project.location}`}
          fill
          sizes="(max-width:768px) 100vw, 33vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent" />
        <span className="label-mono relative text-accent">{project.sector}</span>
      </div>
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold text-charcoal">
          {project.title}
        </h3>
        <div className="label-mono mt-1">{project.location}</div>
        <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
          {project.scope}
        </p>
      </div>
    </div>
  );
}
