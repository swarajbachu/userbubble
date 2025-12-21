import Link from "next/link";
import { AuthButton } from "./auth-button";
import { Container } from "./container";
import { Logo } from "./logo";
import { SubHeading } from "./subheading";

export const Footer = () => {
  const product: { title: string; href: string }[] = [
    // Commented out - not yet configured
    // {
    //   title: "Agent Builder",
    //   href: "#",
    // },
    // {
    //   title: "Simulation",
    //   href: "#",
    // },
    // {
    //   title: "Integrations",
    //   href: "#",
    // },
    // {
    //   title: "Multi Agent",
    //   href: "#",
    // },
    // {
    //   title: "Workflow API",
    //   href: "#",
    // },
  ];

  const company = [
    // Commented out - not yet configured
    // {
    //   title: "Sign In",
    //   href: "/sign-in",
    // },
    // {
    //   title: "About",
    //   href: "/about",
    // },
    {
      title: "Contact",
      href: "/contact",
    },
    {
      title: "Pricing",
      href: "/pricing",
    },
    // {
    //   title: "Careers",
    //   href: "/careers",
    // },
    // {
    //   title: "Docs",
    //   href: "#",
    // },
    // {
    //   title: "Changelog",
    //   href: "#",
    // },
    // {
    //   title: "Glossary",
    //   href: "#",
    // },
  ];

  const legal: { title: string; href: string }[] = [
    // Commented out - legal pages not yet configured
    // {
    //   title: "Privacy Policy",
    //   href: "/privacy-policy",
    // },
    // {
    //   title: "Terms of Service",
    //   href: "/terms-of-service",
    // },
    // {
    //   title: "Cookie Policy",
    //   href: "/cookie-policy",
    // },
  ];
  return (
    <Container>
      <div className="grid grid-cols-1 px-4 py-20 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <div className="mb-6 sm:col-span-2 md:col-span-4 lg:col-span-3">
          <Logo />
          <SubHeading as="p" className="mt-4 max-w-lg text-left">
            Manage and simulate agentic workflows
          </SubHeading>
          <AuthButton className="mt-4 mb-8 lg:mb-0" />
        </div>
        {product.length > 0 && (
          <div className="col-span-1 mb-4 flex flex-col gap-2 md:col-span-1 md:mb-0">
            <p className="font-medium text-gray-600 text-sm">Product</p>
            {product.map((item) => (
              <Link
                className="my-2 font-medium text-footer-link text-sm"
                href={item.href}
                key={item.title}
              >
                {item.title}
              </Link>
            ))}
          </div>
        )}
        <div className="col-span-1 mb-4 flex flex-col gap-2 md:col-span-1 md:mb-0">
          <p className="font-medium text-gray-600 text-sm">Company</p>
          {company.map((item) => (
            <Link
              className="my-2 font-medium text-footer-link text-sm"
              href={item.href}
              key={item.title}
            >
              {item.title}
            </Link>
          ))}
        </div>
        {legal.length > 0 && (
          <div className="col-span-1 mb-4 flex flex-col gap-2 md:col-span-1 md:mb-0">
            <p className="font-medium text-gray-600 text-sm">Legal</p>
            {legal.map((item) => (
              <Link
                className="my-2 font-medium text-footer-link text-sm"
                href={item.href}
                key={item.title}
              >
                {item.title}
              </Link>
            ))}
          </div>
        )}
        {/* Newsletter section - commented out until configured
        <div className="col-span-1 mb-4 flex flex-col items-start md:col-span-1 md:mb-0 lg:col-span-2">
          <p className="font-medium text-footer-link text-sm">Newsletter</p>
          <div className="mt-2 flex w-full items-center rounded-xl border border-gray-300 bg-gray-200 p-1 placeholder-gray-600 dark:border-neutral-700 dark:bg-neutral-800">
            <input
              className="flex-1 bg-transparent px-2 text-sm outline-none focus:outline-none"
              placeholder="Your email"
              type="email"
            />
            <button className="my-0 flex size-8 shrink-0 items-center justify-center rounded-lg px-0 py-0 text-center">
              <SendIcon />
            </button>
          </div>
          <SubHeading
            as="p"
            className="mt-4 text-left text-sm md:text-sm lg:text-sm"
          >
            Get the latest product news and behind the scenes updates.
          </SubHeading>
        </div>
        */}
      </div>
      <div className="my-4 flex flex-col items-center justify-between px-4 pt-8 md:flex-row">
        <p className="text-footer-link text-sm">
          © 2024 UserBubble. All rights reserved.
        </p>
        <div className="mt-4 flex items-center gap-4 md:mt-0">
          <Link
            className="text-footer-link transition-colors hover:text-gray-900"
            href="https://twitter.com"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
          </Link>
          <Link
            className="text-footer-link transition-colors hover:text-gray-900"
            href="https://linkedin.com"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect height="12" width="4" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </Link>
          <Link
            className="text-footer-link transition-colors hover:text-gray-900"
            href="https://instagram.com"
          >
            <svg
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <rect height="20" rx="5" ry="5" width="20" x="2" y="2" />
              <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </Link>
        </div>
      </div>
    </Container>
  );
};
