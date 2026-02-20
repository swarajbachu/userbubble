import { notFound } from "next/navigation";
import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) {
    notFound();
  }

  const text = await getLLMText(page);

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
