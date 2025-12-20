import type React from "react";
import { AuthIllustration } from "./auth-illustration";
import { Button } from "./button";
import { Container } from "./container";
import { Heading } from "./heading";
import { LogoSVG } from "./logo";
import { SubHeading } from "./subheading";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

export const Contact = () => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("submitted");
  };
  return (
    <Container className="min-h-[calc(100vh-8rem)] py-10 md:py-20">
      <div className="grid grid-cols-1 gap-10 px-4 md:grid-cols-2 md:px-8 lg:gap-40">
        <div>
          <LogoSVG />
          <Heading className="mt-4 text-left lg:text-4xl">Contact us</Heading>
          <SubHeading as="p" className="mt-4 max-w-xl text-left">
            We empower developers and technical teams to create, simulate, and
            manage AI-driven workflows visually
          </SubHeading>
          <form className="mt-6 flex flex-col gap-8">
            <div className="h-full w-full rounded-2xl">
              <Label>Name</Label>
              <Input
                className="mt-4 border-none focus:ring-gray-300"
                placeholder="Manu Arora"
                type="text"
              />
            </div>
            <div className="h-full w-full rounded-2xl">
              <Label>Email</Label>
              <Input
                className="mt-4 border-none focus:ring-gray-300"
                placeholder="youremail@yourdomain.com"
                type="email"
              />
            </div>
            <div className="h-full w-full rounded-2xl">
              <Label>Message</Label>
              <Textarea
                className="mt-4 border-none focus:ring-gray-300"
                placeholder="Your message"
                rows={15}
              />
            </div>
            <Button>Send Message</Button>
          </form>
        </div>
        <AuthIllustration />
      </div>
    </Container>
  );
};
