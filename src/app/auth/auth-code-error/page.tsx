"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthCodeError() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="w-full max-w-md text-center">
          <h1 className="font-extrabold text-8xl text-primary tracking-tighter mb-8">QUIZZI</h1>
          
          <div className="mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-16 w-16 text-red-500 mx-auto mb-4"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
          
          <p className="mb-6 text-muted-foreground">
            The link you used is invalid or has expired. This can happen if the link was already used or if it has been more than 24 hours since the link was created.
          </p>

          <p className="mb-6 text-muted-foreground">Please return to the home page to sign up or reset your password again. We appreciate your understanding!</p>
          
          <Link href="/">
            <Button className="w-full">Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
