"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitFeedback, type FeedbackState } from "@/app/feedback/actions";
import { cn } from "@/lib/utils";
import { glassFieldClass, glassSubmitButtonClass } from "@/lib/glass-styles";

const initialState: FeedbackState = { status: "idle", message: "" };

export function FeedbackForm({
  isSignedIn,
  loginHref,
}: {
  isSignedIn: boolean;
  loginHref: string;
}) {
  const [state, action, pending] = useActionState(submitFeedback, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [signInOpen, setSignInOpen] = useState(false);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="relative">
        <Textarea
          name="body"
          required={isSignedIn}
          readOnly={!isSignedIn}
          tabIndex={isSignedIn ? undefined : -1}
          rows={8}
          maxLength={5000}
          placeholder="Share your thoughts, report a bug, or suggest a feature…"
          aria-label="Your feedback"
          className={cn(
            glassFieldClass,
            "min-h-40 [field-sizing:fixed]",
            !isSignedIn && "pointer-events-none",
          )}
        />
        {/* When signed out, a completed click on this overlay opens the sign-in
            modal — triggering on click (not mousedown) avoids the dialog
            treating the mouse-up as an outside dismissal. */}
        {!isSignedIn ? (
          <button
            type="button"
            aria-label="Sign in to submit feedback"
            onClick={() => setSignInOpen(true)}
            className="absolute inset-0 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ubc-blue-400/30"
          />
        ) : null}
      </div>
      {state.status !== "idle" ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "text-sm font-medium",
            state.status === "success"
              ? "text-green-600 dark:text-green-500"
              : "text-destructive",
          )}
        >
          {state.message}
        </p>
      ) : null}
      <Button
        type={isSignedIn ? "submit" : "button"}
        disabled={pending}
        onClick={isSignedIn ? undefined : () => setSignInOpen(true)}
        className={glassSubmitButtonClass}
      >
        {pending ? "Submitting…" : "Submit feedback"}
      </Button>

      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>You must sign in to submit feedback.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSignInOpen(false)}>
              Cancel
            </Button>
            <Link href={loginHref} className={buttonVariants()}>
              Sign in
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
