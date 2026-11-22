import { sql } from '@/lib/db'

// One atomic statement: the update only fires while count < limit, so a returned row means "allowed".
export async function takeQuota(userId: string, day: string, limit = 30): Promise<boolean> {
  const rows = await sql`
    insert into ai_usage (user_id, day, count) values (${userId}, ${day}, 1)
    on conflict (user_id, day) do update set count = ai_usage.count + 1
    where ai_usage.count < ${limit}
    returning count`
  return rows.length > 0
}
