export interface Project {
  title: string;
  sector: string;
  location: string;
  scope: string;
}

export function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="tech-card overflow-hidden">
      <div className="grid-bg flex aspect-[16/10] items-end bg-charcoal/95 p-5">
        <span className="label-mono text-accent">{project.sector}</span>
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
