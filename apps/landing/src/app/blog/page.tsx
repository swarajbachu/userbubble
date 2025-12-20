import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { Container } from "@/components/container";
import { DivideX } from "@/components/divide";
import { Heading } from "@/components/heading";
import { SubHeading } from "@/components/subheading";
import { getBlogs } from "@/lib/blogs";

type Blog = {
  slug: string;
  title: string;
  description?: string;
  date?: string;
  image: string;
  authorName?: string;
  authorSrc?: string;
};

export const metadata: Metadata = {
  title: "All blogs | Minimal Portfolio Website Template - Aceternity UI Pro",
  description:
    "A perfect portfolio website template that showcases your skills, minimal and smooth microinteractions, perfect for developers and designers.",
};
const truncate = (str: string, length: number) =>
  str.length > length ? `${str.substring(0, length)}...` : str;

export default async function BlogsPage() {
  const allBlogs = await getBlogs();
  const validBlogs = allBlogs.filter(
    (blog): blog is Blog => blog.title !== undefined && blog.image !== undefined
  );

  return (
    <div>
      <DivideX />
      <Container className="flex flex-col items-center border-divide border-x pt-10 md:pt-20 md:pb-10">
        <Badge text=" All blogs" />
        <Heading>Writing for the World</Heading>
        <SubHeading className="mx-auto mt-2 max-w-sm px-4">
          At Notus, we educate and empower developers to build better software
          solutions for the world.
        </SubHeading>
        <div className="mt-10 flex w-full flex-col divide-y divide-divide border-divide border-y">
          <GridLayout blogs={validBlogs.slice(0, 3)} />
          {validBlogs.slice(3).map((blog, _idx) => (
            <RowLayout blog={blog} key={blog.title} />
          ))}
        </div>
      </Container>

      <DivideX />
    </div>
  );
}

const GridLayout = ({ blogs }: { blogs: Blog[] }) => (
  <div className="grid grid-cols-1 divide-y divide-divide lg:grid-cols-3 lg:divide-x lg:divide-y-0">
    {blogs.map((blog, _index) => (
      <Link
        className="p-4 hover:bg-gray-50 md:p-8 dark:hover:bg-neutral-800"
        href={`/blog/${blog.slug}`}
        key={blog.title}
      >
        <Image
          alt={blog.title}
          className="h-60 w-full rounded-lg object-cover shadow-aceternity md:h-80 lg:h-60"
          height={500}
          src={blog.image}
          width={500}
        />
        <div>
          <h2 className="mt-2 font-medium text-lg text-primary tracking-tight">
            {blog.title}
          </h2>
          <p className="max-w-lg pt-2 text-base text-gray-600 md:text-sm dark:text-neutral-400">
            {truncate(blog.description ?? "", 100)}
          </p>
        </div>
      </Link>
    ))}
  </div>
);

const RowLayout = ({ blog }: { blog: Blog }) => (
  <Link
    className="flex flex-col justify-between px-4 py-4 hover:bg-gray-50 md:flex-row md:items-center md:px-8 dark:hover:bg-neutral-800"
    href={`/blog/${blog.slug}`}
    key={blog.title}
  >
    <div>
      <h2 className="font-medium text-lg text-primary tracking-tight">
        {blog.title}
      </h2>
      <p className="max-w-lg pt-2 text-base text-gray-600 md:text-sm dark:text-neutral-400">
        {truncate(blog.description || "", 150)}
      </p>
    </div>
    <div className="mt-4 flex flex-col text-charcoal-700 text-sm md:mt-0 md:text-sm dark:text-neutral-100">
      {new Date(blog.date || "").toLocaleDateString("en-us", {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
      })}
      <div className="mt-2 flex items-center gap-1 md:justify-end">
        <Image
          alt={blog.authorName as string}
          className="size-6 rounded-full"
          height={50}
          src={blog.authorSrc as string}
          width={50}
        />
        <span className="text-gray-500 dark:text-neutral-400">
          {blog.authorName}
        </span>
      </div>
    </div>
  </Link>
);
