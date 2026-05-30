drop policy if exists "anyone can hide reviews in prototype" on public.reviews;

create policy "anyone can hide reviews in prototype"
on public.reviews
for update
using (true)
with check (true);

grant select, insert, update on public.reviews to anon;
