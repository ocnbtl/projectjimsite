type PageIntroProps = {
  title: string;
  children: React.ReactNode;
  align?: "top" | "bottom";
  route: string;
  compact?: boolean;
};

export function PageIntro({ title, children, align = "bottom", route, compact = false }: PageIntroProps) {
  return (
    <section className={`page-intro page-intro-${align}${compact ? " page-intro-compact" : ""} shell`} data-page-panel data-page-route={route}>
      <h1>{title}</h1>
      <div className="page-intro-copy">{children}</div>
    </section>
  );
}
