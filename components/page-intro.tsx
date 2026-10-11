type PageIntroProps = {
  title: string;
  children: React.ReactNode;
  align?: "top" | "bottom";
};

export function PageIntro({ title, children, align = "bottom" }: PageIntroProps) {
  return (
    <section className={`page-intro page-intro-${align} shell`}>
      <h1>{title}</h1>
      <div className="page-intro-copy">{children}</div>
    </section>
  );
}
