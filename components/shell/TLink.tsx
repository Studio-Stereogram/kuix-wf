"use client";
import Link from "next/link";
import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { usePageTransition } from "./TransitionProvider";

type Props = ComponentPropsWithoutRef<typeof Link> & { href: string };

// Link that routes through the page transition. Modified clicks fall back to
// the browser so "open in new tab" keeps working.
export function TLink({ href, onClick, ...rest }: Props) {
  const { navigate } = usePageTransition();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return <Link href={href} onClick={handle} {...rest} />;
}
