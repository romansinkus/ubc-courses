import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithMagicLink } from "./actions";

type SearchParams = Promise<{ sent?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const { sent, error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Sign in to UBCourses</CardTitle>
          <CardDescription>
            We&apos;ll email you a magic link — no password needed. First time signing in? Pick a
            username below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm">
              Check your email for the sign-in link. You can close this tab.
            </p>
          ) : (
            <form action={signInWithMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@ubc.ca" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username <span className="text-muted-foreground">(first sign-in only)</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  minLength={3}
                  maxLength={24}
                  placeholder="e.g. roman_s"
                  pattern="[a-zA-Z0-9_]+"
                />
              </div>
              {error ? (
                <p className="text-sm text-red-600">{decodeURIComponent(error)}</p>
              ) : null}
              <Button type="submit" className="w-full">
                Send magic link
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/">Back to home</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
