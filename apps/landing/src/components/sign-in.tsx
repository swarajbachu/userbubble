import Link from "next/link";
import type React from "react";
import { AppleIcon, FacebookIcon, GoogleIcon } from "@/icons/general";
import { AuthIllustration } from "./auth-illustration";
import { Button } from "./button";
import { Container } from "./container";
import { Heading } from "./heading";
import { LogoSVG } from "./logo";
import { SubHeading } from "./subheading";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export const SignIn = () => {
  const _handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };
  return (
    <Container className="min-h-[calc(100vh-8rem)] py-10 md:py-20">
      <div className="grid grid-cols-1 gap-10 px-4 md:grid-cols-2 md:px-8 lg:gap-40">
        <div>
          <LogoSVG />
          <Heading className="mt-4 text-left lg:text-4xl">
            Welcome back!
          </Heading>
          <SubHeading as="p" className="mt-4 max-w-xl text-left">
            We empower developers and technical teams to create, simulate, and
            manage AI-driven workflows visually
          </SubHeading>
          <form className="mt-6 flex flex-col gap-8">
            <div className="h-full w-full rounded-2xl">
              <Label>Email</Label>
              <Input
                className="mt-4 border-none focus:ring-gray-300"
                placeholder="youremail@yourdomain.com"
                type="email"
              />
            </div>
            <div className="h-full w-full rounded-2xl">
              <Label>Password</Label>
              <Input
                className="mt-4 border-none focus:ring-gray-300"
                placeholder="Create a password"
                type="password"
              />
            </div>
            <Button>Sign in</Button>
            <div className="mt-2 flex items-center">
              <div className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
              <span className="px-4 text-gray-500 text-sm dark:text-neutral-400">
                or
              </span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-neutral-700" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Button
                className="flex w-full justify-center py-4"
                variant="secondary"
              >
                <GoogleIcon />
              </Button>
              <Button
                className="flex w-full justify-center py-4"
                variant="secondary"
              >
                <FacebookIcon />
              </Button>
              <Button
                className="flex w-full justify-center py-4"
                variant="secondary"
              >
                <AppleIcon />
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              Already have an account?{" "}
            </span>
            <Link
              className="font-medium text-brand text-sm hover:underline"
              href="/sign-up"
            >
              Sign up
            </Link>
          </div>
        </div>
        <AuthIllustration />
      </div>
    </Container>
  );
};
