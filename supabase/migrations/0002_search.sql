-- Topic search (spec section 10, retrieval step 3): ranks verses by trigram similarity
-- of the topic against normalized verse text and against tafsir text (for the caller's
-- selected books), returns at most `match_limit` distinct verses, best first.
create or replace function search_verses_by_topic(
  topic_normalized text,
  p_book_ids smallint[],
  match_limit int default 3
)
returns table (surah smallint, ayah smallint, score real)
language sql
stable
as $$
  with ayah_scores as (
    select a.surah, a.number as ayah, similarity(a.text_normalized, topic_normalized) as score
    from ayahs a
    where a.text_normalized % topic_normalized
  ),
  tafsir_scores as (
    select t.surah, gs.n as ayah, similarity(t.text, topic_normalized) as score
    from tafsir_entries t
    cross join lateral generate_series(t.verse_from, t.verse_to) as gs(n)
    where t.book_id = any(p_book_ids)
      and t.text % topic_normalized
  ),
  combined as (
    select surah, ayah, score from ayah_scores
    union all
    select surah, ayah, score from tafsir_scores
  )
  select surah, ayah, max(score) as score
  from combined
  group by surah, ayah
  order by score desc
  limit match_limit;
$$;
