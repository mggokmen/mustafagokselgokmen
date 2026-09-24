import { ContactForm } from "@/features/contact/ContactForm";
import { MessageList } from "@/features/contact/MessageList";
import { listContactMessages, pageIndex } from "@/features/contact/messages";
import { requireUser } from "@/lib/auth/current-user";

export const metadata = { title: "Contact" };

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  await requireUser("/contact");
  const { page } = await searchParams;
  const messages = await listContactMessages(pageIndex(page));

  return (
    <main className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Send a message</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Write once; the subject and the text cannot be changed afterwards.
          </p>
        </div>
        <ContactForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight">Your messages</h2>
        <MessageList page={messages} />
      </section>
    </main>
  );
}
