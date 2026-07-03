import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

function norm(row) {
  if (!row) return null;
  const subs = row.task_submissions ?? {};

  const actAt      = subs._act ?? null;
  const actExpires = actAt ? actAt + ONE_MONTH_MS : null;
  const activated  = actAt !== null && (!actExpires || Date.now() <= actExpires);

  const paidAt      = row.premium_paid_at ?? null;
  const premExpires = paidAt ? paidAt + ONE_MONTH_MS : null;
  const premium     = (row.premium ?? false) && paidAt !== null && (!premExpires || Date.now() <= premExpires);

  const suspended     = subs._suspended ?? false;
  const suspendedAt   = subs._suspendedAt ?? null;
  const suspendReason = subs._suspendReason ?? '';

  const quiz  = subs._quiz  ?? null;
  const ptest = subs._ptest ?? null;

  return {
    id:               row.id,
    fullName:         row.full_name        ?? '',
    email:            row.email            ?? '',
    phone:            row.phone            ?? '',
    country:          row.country          ?? '',
    password:         row.password         ?? '',
    activated,
    activatedAt:      actAt,
    activatedExpiresAt: actExpires,
    premium,
    premiumPaidAt:    paidAt,
    premiumExpiresAt: premExpires,
    balance:          Number(row.balance   ?? 0),
    referralCount:   Number(row.referral_count  ?? 0),
    referredBy:      row.referred_by      ?? null,
    completedTasks:  Number(row.completed_tasks ?? 0),
    activeBids:      Number(row.active_bids     ?? 0),
    taskSubmissions: row.task_submissions  ?? {},
    createdAt:       row.created_at,
    suspended,
    suspendedAt,
    suspendReason,
    quizDone:        quiz !== null,
    quizScore:       Number(quiz?.score  ?? 0),
    quizEarned:      Number(quiz?.earned ?? 0),
    premiumBalance:  Number(subs._pbal   ?? 0),
    premiumTestDone: ptest !== null,
    premiumTestScore: Number(ptest?.score ?? 0),
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
    amount:      Number(row.amount || 0),
    status:      row.status      ?? 'pending',
    deadline:    row.deadline,
    requestedAt: row.requested_at,
    updatedAt:   row.updated_at  ?? null,
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

      case 'migrateUser': {
        const u = p.user;
        if (!u?.id) return res.json({ data: null });

        // Return existing record if already in Supabase (by id or email)
        const { data: byId } = await db.from('users')
          .select('*').eq('id', u.id).maybeSingle();
        if (byId) return res.json({ data: norm(byId) });

        const { data: byEmail } = await db.from('users')
          .select('*').eq('email', u.email).maybeSingle();
        if (byEmail) return res.json({ data: norm(byEmail) });

        const { data: inserted, error: insertErr } = await db.from('users').insert({
          id:               u.id,
          full_name:        u.fullName        ?? u.full_name        ?? '',
          email:            u.email           ?? '',
          phone:            u.phone           ?? '',
          country:          u.country         ?? '',
          password:         u.password        ?? '',
          activated:        Boolean(u.activated),
          premium:          Boolean(u.premium),
          premium_paid_at:  u.premiumPaidAt   ?? u.premium_paid_at  ?? null,
          balance:          Number(u.balance  ?? 0),
          referral_count:   Number(u.referralCount ?? u.referral_count ?? 0),
          referred_by:      u.referredBy      ?? u.referred_by      ?? null,
          completed_tasks:  Number(u.completedTasks ?? u.completed_tasks ?? 0),
          active_bids:      Number(u.activeBids     ?? u.active_bids     ?? 0),
          task_submissions: u.taskSubmissions ?? u.task_submissions  ?? {},
        }).select().single();

        if (insertErr) return res.json({ data: null, error: insertErr.message });
        return res.json({ data: norm(inserted) });
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

        const updatedSubs = { ...(u.task_submissions || {}), _act: Date.now() };
        const { data: updated } = await db.from('users').update({
          activated:        true,
          task_submissions: updatedSubs,
          balance:          (u.balance || 0) + Number(amountPaid),
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

      case 'awardQuiz': {
        const { userId, correctCount } = p;
        const count  = Math.max(0, Math.min(5, Number(correctCount) || 0));
        const earned = count * 10;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const subs = { ...(u.task_submissions || {}) };
        if (subs._quiz) return res.json({ data: norm(u) });   // already claimed

        subs._quiz = { score: count, earned, at: Date.now() };
        const { data: updated } = await db.from('users').update({
          task_submissions: subs,
          balance:          (u.balance || 0) + earned,
        }).eq('id', userId).select().single();
        return res.json({ data: norm(updated) });
      }

      case 'awardPremiumTest': {
        const { userId, correctCount } = p;
        const count  = Math.max(0, Math.min(5, Number(correctCount) || 0));
        const earned = count * 42;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const subs = { ...(u.task_submissions || {}) };
        if (subs._ptest) return res.json({ data: norm(u) });   // already taken

        subs._ptest = { score: count, earned, at: Date.now() };
        subs._pbal  = Number(subs._pbal || 0) + earned;
        const { data: updated } = await db.from('users').update({
          task_submissions: subs,
        }).eq('id', userId).select().single();
        return res.json({ data: norm(updated) });
      }

      case 'upgradePremiumWithBalance': {
        const { userId } = p;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const subs     = { ...(u.task_submissions || {}) };
        const pbal     = Number(subs._pbal || 0);
        const consumed = Math.min(pbal, 480);
        subs._pbal     = pbal - consumed;
        const { data: updated } = await db.from('users').update({
          premium:          true,
          premium_paid_at:  Date.now(),
          task_submissions: subs,
        }).eq('id', userId).select().single();
        return res.json({ data: norm(updated) });
      }

      case 'activateWithBalance': {
        const { userId } = p;
        const { data: u } = await db.from('users')
          .select('*').eq('id', userId).maybeSingle();
        if (!u) return res.json({ data: null });

        const balance  = Number(u.balance || 0);
        const consumed = Math.min(balance, 50);
        const subs = { ...(u.task_submissions || {}), _act: Date.now() };
        const { data: updated } = await db.from('users').update({
          activated:        true,
          task_submissions: subs,
          balance:          balance - consumed,
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
        const { userId, fullName, phone, idNumber, amount } = p;
        const deadline = Date.now() + 2 * 60 * 60 * 1000;
        const { data, error } = await db.from('withdrawal_requests').insert({
          user_id:      userId,
          full_name:    fullName,
          phone,
          id_number:    idNumber,
          amount:       Number(amount),
          status:       'pending',
          deadline,
          requested_at: new Date().toISOString(),
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

      case 'listUsers': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { data: rows, error: listErr } = await db.from('users')
          .select('*').order('created_at', { ascending: false });
        if (listErr) return res.json({ data: [], error: listErr.message });
        return res.json({ data: (rows || []).map(norm) });
      }

      case 'adminUpdateUser': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { userId, balance, premium, premiumPaidAt, activatedAt, clearActivation } = p;

        const updates = {};
        if (balance   !== undefined) updates.balance    = Number(balance);
        if (premium   !== undefined) updates.premium    = Boolean(premium);
        if (premiumPaidAt !== undefined) updates.premium_paid_at = premiumPaidAt;
        if (p.fullName !== undefined && p.fullName.trim()) updates.full_name = p.fullName.trim();
        if (p.email    !== undefined && p.email.trim())    updates.email     = p.email.trim();
        if (p.phone    !== undefined)                      updates.phone     = p.phone.trim();

        if (clearActivation || activatedAt !== undefined || p.suspended !== undefined) {
          const { data: cur } = await db.from('users')
            .select('task_submissions').eq('id', userId).maybeSingle();
          const subs = { ...(cur?.task_submissions || {}) };

          if (clearActivation) delete subs._act;
          else if (activatedAt !== undefined) subs._act = activatedAt;

          if (p.suspended !== undefined) {
            subs._suspended   = Boolean(p.suspended);
            subs._suspendedAt = p.suspended ? Date.now() : null;
            subs._suspendReason = p.suspendReason ?? '';
          }

          updates.task_submissions = subs;
        }

        const { data: updated, error: updErr } = await db.from('users')
          .update(updates).eq('id', userId).select().single();
        if (updErr) return res.json({ success: false, error: updErr.message });
        return res.json({ success: true, user: norm(updated) });
      }

      case 'adminListWithdrawals': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { data: wRows, error: wErr } = await db.from('withdrawal_requests')
          .select('*').order('requested_at', { ascending: false });
        if (wErr) return res.json({ data: [], error: wErr.message });
        return res.json({ data: (wRows || []).map(normWd) });
      }

      case 'adminUpdateWithdrawal': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const wUpdates = { updated_at: new Date().toISOString() };
        if (p.status   !== undefined) wUpdates.status    = p.status;
        if (p.amount   !== undefined) wUpdates.amount    = Number(p.amount);
        if (p.phone    !== undefined) wUpdates.phone     = p.phone;
        if (p.idNumber !== undefined) wUpdates.id_number = p.idNumber;
        if (p.fullName !== undefined) wUpdates.full_name = p.fullName;
        const { data: wUp, error: wUpErr } = await db.from('withdrawal_requests')
          .update(wUpdates).eq('id', p.requestId).select().single();
        if (wUpErr) return res.json({ success: false, error: wUpErr.message });
        return res.json({ success: true, data: normWd(wUp) });
      }

      case 'adminDeleteWithdrawal': {
        if (p.adminSecret !== process.env.ADMIN_SECRET) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
        const { error: delErr } = await db.from('withdrawal_requests')
          .delete().eq('id', p.requestId);
        if (delErr) return res.json({ success: false, error: delErr.message });
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({ error: `Unknown op: ${op}` });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
