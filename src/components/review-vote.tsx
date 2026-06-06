"use client";

import { useState, useTransition, type SyntheticEvent } from "react";
import Link from "next/link";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { voteReview } from "@/app/reviews/actions";
import { cn } from "@/lib/utils";

export function ReviewVote({
  reviewId,
  score,
  myVote,
  isSignedIn,
  loginHref,
}: {
  reviewId: string;
  score: number;
  myVote: number;
  isSignedIn: boolean;
  loginHref: string;
}) {
  const [state, setState] = useState({ score, myVote });
  const [pending, startTransition] = useTransition();
  const [signInOpen, setSignInOpen] = useState(false);

  function cast(direction: 1 | -1) {
    if (!isSignedIn) {
      setSignInOpen(true);
      return;
    }

    const prev = state;
    // Toggle off when re-pressing the active direction, otherwise switch to it.
    const nextVote = prev.myVote === direction ? 0 : direction;
    const nextScore = prev.score - prev.myVote + nextVote;
    setState({ score: nextScore, myVote: nextVote });

    startTransition(async () => {
      const res = await voteReview(reviewId, direction);
      if (res.ok) {
        setState({ score: res.score, myVote: res.myVote });
      } else {
        setState(prev);
        if (res.error === "auth") setSignInOpen(true);
      }
    });
  }

  // The whole review card is clickable; keep vote interactions self-contained.
  const stop = (e: SyntheticEvent) => e.stopPropagation();

  const buttonClass =
    "rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

  return (
    <div className="flex flex-col items-center gap-0.5" onClick={stop} onKeyDown={stop}>
      <button
        type="button"
        aria-label="Upvote review"
        aria-pressed={state.myVote === 1}
        disabled={pending}
        onClick={() => cast(1)}
        className={cn(buttonClass, state.myVote === 1 && "text-primary hover:text-primary")}
      >
        <ArrowBigUp className={cn("size-5", state.myVote === 1 && "fill-current")} />
      </button>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          state.myVote === 1 && "text-primary",
          state.myVote === -1 && "text-destructive",
        )}
      >
        {state.score}
      </span>
      <button
        type="button"
        aria-label="Downvote review"
        aria-pressed={state.myVote === -1}
        disabled={pending}
        onClick={() => cast(-1)}
        className={cn(
          buttonClass,
          state.myVote === -1 && "text-destructive hover:text-destructive",
        )}
      >
        <ArrowBigDown className={cn("size-5", state.myVote === -1 && "fill-current")} />
      </button>

      <Dialog open={signInOpen} onOpenChange={setSignInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              You must sign in to upvote or downvote reviews.
            </DialogDescription>
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
    </div>
  );
}
