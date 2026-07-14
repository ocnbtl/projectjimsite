type PageIntroProps = {
  title: string;
  children: React.ReactNode;
};

export function PageIntro({ title, children }: PageIntroProps) {
  return (
    <section className="page-intro shell">
      <h1>{title}</h1>
      <div className="page-intro-copy">{children}</div>
    </section>
  );
}
