type PostContentProps = {
  description: string;
};

export function PostContent({ description }: PostContentProps) {
  return (
    <div className="mt-8 rounded-lg border bg-card p-6">
      <h2 className="mb-4 font-semibold text-lg">Description</h2>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="whitespace-pre-wrap text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
