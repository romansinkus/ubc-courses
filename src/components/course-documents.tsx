import { Download, ExternalLink, FileText, Paperclip } from "lucide-react";
import { downloadUrl } from "@/lib/storage-url";
import { cn } from "@/lib/utils";
import { glassDividerClass, glassFileRowClass, glassFormSectionTitleClass } from "@/lib/glass-styles";

export type CourseDocument = {
  url: string;
  /** Display name for the row. */
  name: string;
  /** External links open in a new tab; stored files download. */
  kind: "link" | "syllabus" | "file";
};

const ROW_CLASS = cn(
  glassFileRowClass,
  "gap-2.5 transition-colors hover:border-ubc-blue-400/70 hover:bg-background",
);

function DocumentRow({ doc }: { doc: CourseDocument }) {
  const Icon = doc.kind === "file" ? Paperclip : FileText;
  const isLink = doc.kind === "link";
  return (
    <li>
      <a
        href={isLink ? doc.url : downloadUrl(doc.url, doc.name)}
        {...(isLink
          ? { target: "_blank", rel: "noopener noreferrer" }
          : { download: doc.name })}
        className={ROW_CLASS}
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate font-medium">{doc.name}</span>
        {isLink ? (
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </a>
    </li>
  );
}

function DocumentGroup({ title, docs }: { title: string; docs: CourseDocument[] }) {
  if (docs.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h4>
      <ul className="space-y-1.5">
        {docs.map((doc) => (
          <DocumentRow key={`${doc.kind}:${doc.url}`} doc={doc} />
        ))}
      </ul>
    </div>
  );
}

export function CourseDocuments({
  syllabusLinks,
  syllabusPdfs,
  otherDocs,
}: {
  syllabusLinks: CourseDocument[];
  syllabusPdfs: CourseDocument[];
  otherDocs: CourseDocument[];
}) {
  if (syllabusLinks.length === 0 && syllabusPdfs.length === 0 && otherDocs.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4 border-t pt-6", glassDividerClass)}>
      <h3 className={glassFormSectionTitleClass}>Course resources</h3>
      <div className="space-y-5">
        <DocumentGroup title="Syllabus links" docs={syllabusLinks} />
        <DocumentGroup title="Syllabus attachments" docs={syllabusPdfs} />
        <DocumentGroup title="Other documents" docs={otherDocs} />
        <p className="text-xs text-muted-foreground">
          Documents are contributed by reviewers. Open the matching review for full context.
        </p>
      </div>
    </div>
  );
}
