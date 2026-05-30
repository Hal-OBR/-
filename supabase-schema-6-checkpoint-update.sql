drop policy if exists "anyone can update checkpoints in prototype" on public.checkpoints;

create policy "anyone can update checkpoints in prototype"
on public.checkpoints
for update
using (true)
with check (true);

grant select, insert, update on public.checkpoints to anon;
