import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

function norm(row) {
  if (!row) return null;
  return {
    id:              row.id,
    fullName:        row.full_name        ?? '',
    email:           row.email            ?? '',
    phone:           row.phone            ?? '',
    country:         row.country          ?? '',
    password:        row.password         ?? '',
    activated:       row.activated        ?? false,
    premium:         row.premium          ?? false,
    premiumPaidAt:   row.premium_paid_at  ?? null,
    balance:         Number(row.balance   ?? 0),
    referralCount:   Number(row.referral_count  ?? 0),
    referredBy:      row.referred_by      ?? null,
    completedTasks:  Number(row.completed_tasks ?? 0),
    activeBids:      Number(row.active_bids     ?? 0),
    taskSubmissions: row.task_submissions  ?? {},
    createdAt:       row.created_at,
  };
}

function normWd(row) {
  if (!row) return null;
  return {
    id:          row.id,
    userId:      row.user_id,
    fullName:    row.full_name,
    phone:       row.phone,
    idNumber:    row.id_number,
    kraPin:      row.kra_pin,
    amount:      Number(row.amount || 0),
    status:      row.status      ?? 'pending',
    deadline:    row.deadline,
    requestedAt: row.requested_at,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const db = getAdmin();
  const { op, ...p } = req.body;

  try {
    switch (op) {

      case 'registerUser': {
        const { fullName, email, phone, country, password,
                activated, premium, premiumPaidAt, balance,
                referralCount, referredBy } = p;

        const { data: existing } = await db.from('users')
          .select('id').eq('email', email).maybeSingle();
        if (existing) return res.json({ success: false, message: 'Email already registered.' });

        const id = Date.now().toString();
        const { data, error } = await db.from('users').insert({
          id, full_name: fullName, email, phone, country, password,
          activated, premium, premium_paid_at: premiumPaidAt,
          balance, referral_count: referralCount, referred_by: referredBy,
          completed_tasks: 0, active_bids: 0, task_submissions: {},
        }).select().single();

        if (error) return res.json({ success: false, message: error.message });

        if (referredBy && referredBy !== id) {
          const { data: ref } = await db.from('users')
            .select('balance').eq('id', referredBy).maybeSingle();
          if (ref) {
            await db.from('users')
              .update({ balance: (ref.balance || 0) + 70 }).eq('id', referredBy);
          }
        }

        return res.json({ success: true, user: norm(data) });
      }

      case 'loginUser': {
        const { email, password } = p;
        const { data } = await db.from('users')
          .select('*').eq('email', email).eq('password', password).maybeSingle();
        if (!data) return res.json({ success: false, message: 'Invalid email or password.' });
        return res.json({ success: true, user: norm(data) });
      }

      case 'getUser': {
        const { data } = await db.from('users')
          .select('*').eq('id', p.id).maybeSingle();
        return res.json({ data: norm(data) });
      }

      case 'activateUser': {
        const { userId, amountPaid } = p;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const { data: updated } = await db.from('users').update({
          activated: true,
          balance: (u.balance || 0) + Number(amountPaid),
        }).eq('id', userId).select().single();

        if (u.referred_by && u.referred_by !== userId) {
          const { data: ref } = await db.from('users')
            .select('balance,referral_count').eq('id', u.referred_by).maybeSingle();
          if (ref) {
            await db.from('users').update({
              balance:        (ref.balance || 0) + 132,
              referral_count: (ref.referral_count || 0) + 1,
            }).eq('id', u.referred_by);
          }
        }

        return res.json({ data: norm(updated) });
      }

      case 'upgradeToPremium': {
        const { data } = await db.from('users').update({
          premium: true, premium_paid_at: Date.now(),
        }).eq('id', p.userId).select().single();
        return res.json({ data: norm(data) });
      }

      case 'submitTask': {
        const { userId, taskId, rewardAmount } = p;
        const key = String(taskId);
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ success: false, message: 'User not found.' });

        const subs = u.task_submissions || {};
        if (subs[key]) {
          return res.json({
            success: false,
            alreadySubmitted: true,
            message: `Already submitted on ${new Date(subs[key].submittedAt).toLocaleDateString('en-KE', { dateStyle: 'medium' })}.`,
          });
        }

        subs[key] = { submittedAt: new Date().toISOString(), reward: rewardAmount };
        const { data: updated } = await db.from('users').update({
          task_submissions: subs,
          completed_tasks:  (u.completed_tasks || 0) + 1,
          balance:          (u.balance || 0) + rewardAmount,
        }).eq('id', userId).select().single();

        return res.json({ success: true, user: norm(updated) });
      }

      case 'createBid': {
        const { data: u } = await db.from('users')
          .select('active_bids').eq('id', p.userId).maybeSingle();
        if (!u) return res.json({ data: null });
        const { data } = await db.from('users').update({
          active_bids: (u.active_bids || 0) + 1,
        }).eq('id', p.userId).select().single();
        return res.json({ data: norm(data) });
      }

      case 'createWithdrawal': {
        const { userId, fullName, phone, idNumber, kraPin, amount } = p;
        const deadline = Date.now() + 2 * 60 * 60 * 1000;
        const { data, error } = await db.from('withdrawal_requests').insert({
          user_id:   userId,
          full_name: fullName,
          phone,
          id_number: idNumber,
          kra_pin:   kraPin,
          amount:    Number(amount),
          status:    'pending',
          deadline,
        }).select().single();
        if (error) return res.json({ data: null });
        return res.json({ data: normWd(data) });
      }

      case 'getWithdrawal': {
        const { data } = await db.from('withdrawal_requests')
          .select('*').eq('user_id', p.userId)
          .order('requested_at', { ascending: false }).limit(1).maybeSingle();
        return res.json({ data: normWd(data) });
      }

      case 'updateWithdrawal': {
        const { data } = await db.from('withdrawal_requests')
          .update({ status: p.status, updated_at: new Date().toISOString() })
          .eq('id', p.requestId).select().single();
        return res.json({ data: normWd(data) });
      }

      default:
        return res.status(400).json({ error: `Unknown op: ${op}` });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
