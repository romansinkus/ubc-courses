import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/auth";
import { createCourse } from "./actions";

type SearchParams = Promise<{ code?: string; error?: string }>;

export default async function NewCoursePage({ searchParams }: { searchParams: SearchParams }) {
  const { code, error } = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(
      `/login?next=${encodeURIComponent(`/courses/new${code ? `?code=${code}` : ""}`)}`,
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add a course</CardTitle>
          <CardDescription>
            This course isn&apos;t in our catalog yet. Add it so you and others can review it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createCourse} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Course code</Label>
              <Input
                id="code"
                name="code"
                defaultValue={code?.toUpperCase() ?? ""}
                placeholder="e.g. CPSC 110"
                required
              />
              <p className="text-xs text-muted-foreground">
                Format: 2-5 letters, a space, then 3 digits (e.g. <code>CPSC 110</code>,{" "}
                <code>MATH 200</code>).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Computation, Programs, and Programming"
                required
                minLength={2}
                maxLength={200}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="credits">
                Credits <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input id="credits" name="credits" placeholder="e.g. 3" maxLength={20} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                maxLength={2000}
                placeholder="A short description of what the course covers."
              />
            </div>

            {error ? <p className="text-sm text-red-600">{decodeURIComponent(error)}</p> : null}

            <Button type="submit" className="w-full">
              Add course
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
