import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxPhotoCount = 5;
const maxPhotoBytes = 2_500_000;
const maxTotalPhotoBytes = 3_600_000;

function textValue(form: FormData, key: string, maxLength: number) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character];
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
      const headerHost = request.headers.get("host")?.split(",")[0]?.trim();
      const allowedHosts = new Set(
        [new URL(request.url).host, forwardedHost, headerHost]
          .filter((host): host is string => Boolean(host))
          .map((host) => host.toLowerCase()),
      );

      if (!allowedHosts.has(originHost)) {
        return NextResponse.json(
          { message: "This request could not be verified." },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { message: "This request could not be verified." },
        { status: 403 },
      );
    }
  }

  try {
    const form = await request.formData();
    if (textValue(form, "website", 200)) {
      return NextResponse.json({ message: "Your project request has been sent. We’ll be in touch." });
    }

    const name = textValue(form, "name", 120);
    const phone = textValue(form, "phone", 60);
    const email = textValue(form, "email", 180);
    const location = textValue(form, "location", 120);
    const propertyType = textValue(form, "propertyType", 40);
    const description = textValue(form, "description", 4000);
    const submissionId = textValue(form, "submissionId", 80);

    if (!name || !phone || !email || !location || !propertyType || !description) {
      return NextResponse.json({ message: "Please complete every required field." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    const photos = form
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const totalPhotoBytes = photos.reduce((sum, photo) => sum + photo.size, 0);

    if (photos.length > maxPhotoCount) {
      return NextResponse.json({ message: "Please attach no more than five photos." }, { status: 400 });
    }

    if (
      totalPhotoBytes > maxTotalPhotoBytes ||
      photos.some((photo) => photo.size > maxPhotoBytes)
    ) {
      return NextResponse.json(
        { message: "Those photos are too large to send together. Please choose fewer images." },
        { status: 413 },
      );
    }

    if (photos.some((photo) => !allowedPhotoTypes.has(photo.type))) {
      return NextResponse.json(
        { message: "Please attach JPG, PNG, or WebP project photos." },
        { status: 415 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL;
    const fromEmail = process.env.CONTACT_FROM_EMAIL;

    if (!apiKey || !toEmail || !fromEmail) {
      return NextResponse.json(
        {
          message:
            "Online delivery is being connected. Please call (513) 612-8421 to discuss your project.",
        },
        { status: 503 },
      );
    }

    const attachments = await Promise.all(
      photos.map(async (photo) => ({
        filename: photo.name.replace(/[^a-zA-Z0-9._-]/g, "-"),
        content: Buffer.from(await photo.arrayBuffer()).toString("base64"),
      })),
    );

    const safe = {
      name: escapeHtml(name),
      phone: escapeHtml(phone),
      email: escapeHtml(email),
      location: escapeHtml(location),
      propertyType: escapeHtml(propertyType),
      description: escapeHtml(description).replace(/\n/g, "<br />"),
    };

    const html = `
      <h1>New masonry project consultation</h1>
      <p><strong>Name:</strong> ${safe.name}</p>
      <p><strong>Phone:</strong> ${safe.phone}</p>
      <p><strong>Email:</strong> ${safe.email}</p>
      <p><strong>City or ZIP:</strong> ${safe.location}</p>
      <p><strong>Property type:</strong> ${safe.propertyType}</p>
      <h2>Project description</h2>
      <p>${safe.description}</p>
      <p><strong>Attached photos:</strong> ${attachments.length}</p>
    `;
    const idempotencySource = submissionId || `${email}:${phone}:${description}`;
    const idempotencyKey = createHash("sha256").update(idempotencySource).digest("hex");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `consultation-${idempotencyKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: email,
        subject: `Project consultation from ${name}`,
        html,
        attachments,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!resendResponse.ok) {
      console.error("Consultation email delivery failed", {
        status: resendResponse.status,
        response: await resendResponse.text(),
      });
      return NextResponse.json(
        { message: "We could not send the request. Please call (513) 612-8421 instead." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      message: "Your project request has been sent. We’ll be in touch.",
    });
  } catch (error) {
    console.error("Consultation request failed", error);
    return NextResponse.json(
      { message: "We could not send the request. Please call (513) 612-8421 instead." },
      { status: 500 },
    );
  }
}
