const testimonialPlaceholders = [
  {
    quote:
      "Approved homeowner feedback about a completed brick color-matching project will appear here.",
    attribution: "Homeowner testimonial",
    context: "Awaiting approved copy",
  },
  {
    quote:
      "A verified builder or project partner quote will be added once the client confirms the wording.",
    attribution: "Project partner testimonial",
    context: "Awaiting approved copy",
  },
  {
    quote:
      "This space is reserved for an approved review describing the finished result and service experience.",
    attribution: "Customer testimonial",
    context: "Awaiting approved copy",
  },
] as const;

function TestimonialGroup({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="testimonial-group" aria-hidden={hidden || undefined} role={hidden ? undefined : "list"}>
      {testimonialPlaceholders.map((testimonial) => (
        <blockquote className="testimonial-card" key={`${testimonial.attribution}-${testimonial.quote}`} role={hidden ? undefined : "listitem"}>
          <span className="testimonial-mark" aria-hidden="true">
            “
          </span>
          <p>{testimonial.quote}</p>
          <footer>
            <strong>{testimonial.attribution}</strong>
            <span>{testimonial.context}</span>
          </footer>
        </blockquote>
      ))}
    </div>
  );
}

export function TestimonialMarquee() {
  return (
    <section className="testimonial-section home-shell" aria-labelledby="testimonial-title">
      <div className="testimonial-heading">
        <p className="testimonial-eyebrow">Preview only · temporary example copy</p>
        <h2 id="testimonial-title">A careful match makes a visible difference.</h2>
        <p>
          These sample quotes show the planned presentation. They will be replaced with approved,
          verified client testimonials before the final launch.
        </p>
      </div>
      <div className="testimonial-viewport">
        <div className="testimonial-track">
          <TestimonialGroup />
          <TestimonialGroup hidden />
        </div>
      </div>
    </section>
  );
}
