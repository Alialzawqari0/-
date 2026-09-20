import type { SupabaseClient } from "@supabase/supabase-js";
import type { Ayah, Database, TafsirBook, TafsirEntry } from "@/types/db";

export interface TafsirProvider {
  getAyah(surah: number, ayah: number): Promise<Ayah | null>;
  getTafsir(bookId: number, surah: number, ayah: number): Promise<TafsirEntry | null>;
  listBooks(surah: number): Promise<TafsirBook[]>;
}

/** Default provider: reads the locally-seeded Postgres tables (spec section 3). */
export class LocalDbProvider implements TafsirProvider {
  constructor(private db: SupabaseClient<Database>) {}

  async getAyah(surah: number, ayah: number): Promise<Ayah | null> {
    const { data, error } = await this.db
      .from("ayahs")
      .select("*")
      .eq("surah", surah)
      .eq("number", ayah)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async getTafsir(bookId: number, surah: number, ayah: number): Promise<TafsirEntry | null> {
    const { data, error } = await this.db
      .from("tafsir_entries")
      .select("*")
      .eq("book_id", bookId)
      .eq("surah", surah)
      .lte("verse_from", ayah)
      .gte("verse_to", ayah)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async listBooks(surah: number): Promise<TafsirBook[]> {
    void surah; // every book covers every surah in this dataset (see DATA_AUDIT.md)
    const { data, error } = await this.db.from("tafsir_books").select("*").order("sort_order");
    if (error) throw error;
    return data ?? [];
  }
}

/**
 * Stub for https://api.quranpedia.net/v1 (spec section 3). NOT enabled unless
 * TAFSIR_PROVIDER=quranpedia is explicitly set. Server-side only: never call this from
 * client code, and never bulk-scrape — respect the documented 120 req/min and
 * 10,000 req/day per IP, cache responses, and identify the app with a contact address
 * in the User-Agent header.
 */
export class QuranpediaProvider implements TafsirProvider {
  private baseUrl = "https://api.quranpedia.net/v1";
  private userAgent: string;

  constructor(contactAddress: string) {
    if (!contactAddress) {
      throw new Error("QuranpediaProvider requires a contact address for the User-Agent header");
    }
    this.userAgent = `Diraya/1.0 (${contactAddress})`;
  }

  private async request(path: string) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { "User-Agent": this.userAgent },
      next: { revalidate: 60 * 60 * 24 }, // cache: this dataset does not change often
    });
    if (!res.ok) throw new Error(`Quranpedia request failed: ${res.status}`);
    return res.json();
  }

  async getAyah(): Promise<Ayah | null> {
    throw new Error("QuranpediaProvider.getAyah: not implemented — stub only, disabled by default");
  }

  async getTafsir(): Promise<TafsirEntry | null> {
    throw new Error("QuranpediaProvider.getTafsir: not implemented — stub only, disabled by default");
  }

  async listBooks(): Promise<TafsirBook[]> {
    throw new Error("QuranpediaProvider.listBooks: not implemented — stub only, disabled by default");
  }
}

export function createTafsirProvider(db: SupabaseClient<Database>): TafsirProvider {
  const which = process.env.TAFSIR_PROVIDER ?? "local";
  if (which === "quranpedia") {
    const contact = process.env.QURANPEDIA_CONTACT_ADDRESS;
    if (!contact) {
      throw new Error("TAFSIR_PROVIDER=quranpedia requires QURANPEDIA_CONTACT_ADDRESS to be set");
    }
    return new QuranpediaProvider(contact);
  }
  return new LocalDbProvider(db);
}
