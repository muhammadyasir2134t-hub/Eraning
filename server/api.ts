import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getDbPool } from './db';
import { authenticateToken, requireRole, AuthRequest } from './middleware';

export const apiRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'earning_platform_jwt_secret_key_2026';

// All routes here require authentication
apiRouter.use(authenticateToken);

// ==========================================
// 1. DASHBOARD SUMMARY
// ==========================================
apiRouter.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Fetch user & profile
    const userRes = await query('SELECT full_name, email, mobile_number, referral_code FROM users WHERE id = $1', [userId]);
    // Fetch wallet
    const walletRes = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    // Fetch task counts
    const completedTasksRes = await query(`
      SELECT COUNT(*) as count FROM task_submissions 
      WHERE user_id = $1 AND status IN ('approved', 'paid')
    `, [userId]);

    const pendingTasksRes = await query(`
      SELECT COUNT(*) as count FROM task_submissions 
      WHERE user_id = $1 AND status IN ('submitted', 'under_review')
    `, [userId]);

    // Recent transactions (up to 5)
    const recentTxns = await query(`
      SELECT * FROM transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `, [userId]);

    // Recent withdrawal status
    const latestWithdrawal = await query(`
      SELECT * FROM withdrawals 
      WHERE user_id = $1 
      ORDER BY requested_at DESC 
      LIMIT 1
    `, [userId]);

    // Top recommended available tasks
    const availableTasks = await query(`
      SELECT t.* FROM tasks t
      WHERE t.status = 'active' 
      AND t.id NOT IN (
        SELECT task_id FROM task_submissions WHERE user_id = $1
      )
      ORDER BY t.reward_amount DESC
      LIMIT 3
    `, [userId]);

    return res.json({
      user: userRes.rows[0],
      wallet: walletRes.rows[0] || {
        available_balance: '0.00',
        pending_balance: '0.00',
        total_earned: '0.00',
        total_withdrawn: '0.00',
        currency: 'PKR',
      },
      stats: {
        completedTasks: parseInt(completedTasksRes.rows[0].count, 10),
        pendingTasks: parseInt(pendingTasksRes.rows[0].count, 10),
      },
      latestWithdrawal: latestWithdrawal.rows[0] || null,
      recentTransactions: recentTxns.rows,
      availableTasks: availableTasks.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
});

// ==========================================
// 2. PROFILE MANAGEMENT
// ==========================================
apiRouter.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRes = await query('SELECT id, full_name, email, mobile_number, referral_code, is_verified, created_at FROM users WHERE id = $1', [userId]);
    const profileRes = await query('SELECT * FROM profiles WHERE user_id = $1', [userId]);

    return res.json({
      user: userRes.rows[0],
      profile: profileRes.rows[0] || {},
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve profile data.' });
  }
});

apiRouter.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fullName, mobileNumber, bio, city, skills, education, idDocumentType, idDocumentNumber } = req.body;

    if (fullName) {
      await query('UPDATE users SET full_name = $1, mobile_number = COALESCE($2, mobile_number), updated_at = NOW() WHERE id = $3', [fullName.trim(), mobileNumber?.trim(), userId]);
    }

    await query(`
      INSERT INTO profiles (user_id, bio, city, skills, education, id_document_type, id_document_number, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        city = EXCLUDED.city,
        skills = EXCLUDED.skills,
        education = EXCLUDED.education,
        id_document_type = EXCLUDED.id_document_type,
        id_document_number = EXCLUDED.id_document_number,
        updated_at = NOW()
    `, [userId, bio || '', city || '', skills || '', education || '', idDocumentType || null, idDocumentNumber || null]);

    return res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==========================================
// 3. TASKS SYSTEM
// ==========================================
// Available Tasks list
apiRouter.get('/tasks', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { category, difficulty, search } = req.query;

    let sql = `
      SELECT t.*, 
        ts.status as user_submission_status,
        ts.id as user_submission_id
      FROM tasks t
      LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.user_id = $1
      WHERE t.status = 'active'
    `;
    const params: any[] = [userId];

    if (category && category !== 'All') {
      params.push(category);
      sql += ` AND t.category = $${params.length}`;
    }

    if (difficulty && difficulty !== 'All') {
      params.push(difficulty);
      sql += ` AND t.difficulty = $${params.length}`;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(t.title) LIKE $${params.length} OR LOWER(t.description) LIKE $${params.length})`;
    }

    sql += ' ORDER BY t.created_at DESC';

    const tasksRes = await query(sql, params);
    return res.json({ tasks: tasksRes.rows });
  } catch (error) {
    console.error('Tasks list error:', error);
    return res.status(500).json({ error: 'Failed to retrieve tasks.' });
  }
});

// Task Details by ID
apiRouter.get('/tasks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const taskId = req.params.id;

    const taskRes = await query(`
      SELECT t.*,
        ts.id as submission_id,
        ts.status as submission_status,
        ts.proof_submission,
        ts.feedback,
        ts.submitted_at,
        ts.reviewed_at
      FROM tasks t
      LEFT JOIN task_submissions ts ON ts.task_id = t.id AND ts.user_id = $1
      WHERE t.id = $2
    `, [userId, taskId]);

    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or is no longer active.' });
    }

    return res.json({ task: taskRes.rows[0] });
  } catch (error) {
    console.error('Task detail error:', error);
    return res.status(500).json({ error: 'Failed to retrieve task details.' });
  }
});

// Submit Task Work
apiRouter.post('/tasks/:id/submit', async (req: AuthRequest, res: Response) => {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const userId = req.user!.userId;
    const taskId = req.params.id;
    const { proofSubmission } = req.body;

    if (!proofSubmission || proofSubmission.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide valid proof or completion text (minimum 10 characters).' });
    }

    await client.query('BEGIN');

    // Check task validity
    const taskRes = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [taskId]);
    if (taskRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task does not exist.' });
    }

    const task = taskRes.rows[0];
    if (task.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This task is no longer accepting submissions.' });
    }

    // Check duplicate submission
    const existingSubmission = await client.query('SELECT id, status FROM task_submissions WHERE task_id = $1 AND user_id = $2', [taskId, userId]);
    if (existingSubmission.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `You have already submitted this task. Current status: ${existingSubmission.rows[0].status}` });
    }

    // Insert task submission
    const subRes = await client.query(`
      INSERT INTO task_submissions (task_id, user_id, status, proof_submission, reward_amount)
      VALUES ($1, $2, 'under_review', $3, $4)
      RETURNING *
    `, [taskId, userId, proofSubmission.trim(), task.reward_amount]);

    // Update remaining slots
    await client.query(`
      UPDATE tasks 
      SET remaining_slots = GREATEST(0, remaining_slots - 1)
      WHERE id = $1
    `, [taskId]);

    // Increase user pending balance in wallet
    await client.query(`
      UPDATE wallets 
      SET pending_balance = pending_balance + $1, updated_at = NOW()
      WHERE user_id = $2
    `, [task.reward_amount, userId]);

    // Add notification
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ($1, 'Task Submitted for Review', $2, 'info', '/my-tasks')
    `, [userId, `Your submission for "${task.title}" is under review. ${task.reward_amount} PKR was added to your pending earnings.`]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Task submitted successfully and placed under review.',
      submission: subRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Task submission error:', error);
    return res.status(500).json({ error: 'Failed to process task submission.' });
  } finally {
    client.release();
  }
});

// My Tasks (User's submissions across all statuses)
apiRouter.get('/my-tasks', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { status } = req.query;

    let sql = `
      SELECT ts.*, t.title as task_title, t.category as task_category, t.difficulty as task_difficulty
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.user_id = $1
    `;
    const params: any[] = [userId];

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND ts.status = $${params.length}`;
    }

    sql += ' ORDER BY ts.submitted_at DESC';

    const submissionsRes = await query(sql, params);
    return res.json({ submissions: submissionsRes.rows });
  } catch (error) {
    console.error('My tasks fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve your task history.' });
  }
});

// ==========================================
// 4. EARNINGS & WALLET
// ==========================================
apiRouter.get('/wallet', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const walletRes = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    const recentTxns = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [userId]);

    return res.json({
      wallet: walletRes.rows[0] || {
        available_balance: '0.00',
        pending_balance: '0.00',
        total_earned: '0.00',
        total_withdrawn: '0.00',
        currency: 'PKR',
      },
      recentTransactions: recentTxns.rows,
      rules: {
        minimumWithdrawal: 500.00,
        maximumWithdrawal: 50000.00,
        serviceFeePercentage: 0, // Zero fee disclosed
        supportedMethods: ['Easypaisa', 'JazzCash', 'Bank Transfer'],
        processingTime: 'Within 24-48 business hours (Standard batch verification)',
      }
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve wallet information.' });
  }
});

// Earnings Dashboard with weekly breakdown
apiRouter.get('/earnings-overview', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const walletRes = await query('SELECT * FROM wallets WHERE user_id = $1', [userId]);

    // Breakdown by category
    const categoryBreakdown = await query(`
      SELECT t.category, SUM(ts.reward_amount) as total_earned, COUNT(ts.id) as count
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      WHERE ts.user_id = $1 AND ts.status IN ('approved', 'paid')
      GROUP BY t.category
      ORDER BY total_earned DESC
    `, [userId]);

    // Monthly transactions for chart
    const earningsHistory = await query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as date,
        SUM(CASE WHEN type = 'task_earning' THEN amount ELSE 0 END) as earned,
        SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END) as withdrawn
      FROM transactions
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC
    `, [userId]);

    return res.json({
      wallet: walletRes.rows[0],
      categoryBreakdown: categoryBreakdown.rows,
      earningsHistory: earningsHistory.rows,
    });
  } catch (error) {
    console.error('Earnings overview error:', error);
    return res.status(500).json({ error: 'Failed to retrieve earnings summary.' });
  }
});

// ==========================================
// 5. WITHDRAWAL SYSTEM
// ==========================================
apiRouter.post('/withdrawals', async (req: AuthRequest, res: Response) => {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const userId = req.user!.userId;
    const { amount, paymentMethod, accountTitle, accountNumber, bankName } = req.body;

    const numAmount = parseFloat(amount);
    const MIN_WITHDRAWAL = 500;
    const MAX_WITHDRAWAL = 50000;

    if (isNaN(numAmount) || numAmount < MIN_WITHDRAWAL) {
      return res.status(400).json({ error: `Minimum withdrawal amount is PKR ${MIN_WITHDRAWAL.toFixed(2)}.` });
    }

    if (numAmount > MAX_WITHDRAWAL) {
      return res.status(400).json({ error: `Maximum single withdrawal request is PKR ${MAX_WITHDRAWAL.toFixed(2)}.` });
    }

    if (!paymentMethod || !['easypaisa', 'jazzcash', 'bank_transfer'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Please select a valid payment method (Easypaisa, JazzCash, or Bank Transfer).' });
    }

    if (!accountTitle || accountTitle.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide the complete account holder title.' });
    }

    if (!accountNumber || accountNumber.trim().length < 8) {
      return res.status(400).json({ error: 'Please provide a valid account number or IBAN.' });
    }

    if (paymentMethod === 'bank_transfer' && (!bankName || bankName.trim().length < 3)) {
      return res.status(400).json({ error: 'Please provide your Bank Name for Bank Transfer.' });
    }

    await client.query('BEGIN');

    // Check wallet available balance with lock
    const walletRes = await client.query('SELECT available_balance FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);
    if (walletRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Wallet not found.' });
    }

    const availableBalance = parseFloat(walletRes.rows[0].available_balance);
    if (availableBalance < numAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient available balance. You have PKR ${availableBalance.toFixed(2)} available.` });
    }

    // Check for pending duplicate withdrawal requests
    const pendingWithdrawals = await client.query(`
      SELECT id FROM withdrawals 
      WHERE user_id = $1 AND status IN ('pending', 'processing')
    `, [userId]);

    if (pendingWithdrawals.rows.length >= 3) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have 3 active pending withdrawal requests. Please await completion before submitting new ones.' });
    }

    const withdrawalNumber = 'WD-' + Math.floor(100000 + Math.random() * 900000).toString();
    const feeAmount = 0.00; // Zero fee clearly disclosed
    const netAmount = numAmount - feeAmount;

    // Deduct available balance and record withdrawal
    await client.query(`
      UPDATE wallets 
      SET available_balance = available_balance - $1,
          total_withdrawn = total_withdrawn + $1,
          updated_at = NOW()
      WHERE user_id = $2
    `, [numAmount, userId]);

    // Insert withdrawal record
    const withdrawalRes = await client.query(`
      INSERT INTO withdrawals (user_id, withdrawal_number, amount, fee_amount, net_amount, payment_method, account_title, accountNumber, bank_name, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending')
      RETURNING *
    `, [userId, withdrawalNumber, numAmount, feeAmount, netAmount, paymentMethod, accountTitle.trim(), accountNumber.trim(), bankName?.trim() || null]);

    // Insert transaction audit record
    const txnNumber = 'TXN-' + Math.floor(100000 + Math.random() * 900000).toString();
    await client.query(`
      INSERT INTO transactions (user_id, transaction_number, type, amount, status, description, metadata)
      VALUES ($1, $2, 'withdrawal', $3, 'completed', $4, $5)
    `, [
      userId, 
      txnNumber, 
      numAmount, 
      `Withdrawal request #${withdrawalNumber} via ${paymentMethod.toUpperCase()}`,
      JSON.stringify({ withdrawalId: withdrawalRes.rows[0].id, method: paymentMethod, target: accountNumber.slice(-4) })
    ]);

    // Add notification
    await client.query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ($1, 'Withdrawal Request Submitted', $2, 'info', '/withdrawals')
    `, [userId, `Your withdrawal request of PKR ${numAmount.toFixed(2)} (${withdrawalNumber}) has been submitted for batch verification.`]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Withdrawal request submitted successfully. Processing typically takes 24-48 business hours.',
      withdrawal: withdrawalRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', error);
    return res.status(500).json({ error: 'Failed to process withdrawal request.' });
  } finally {
    client.release();
  }
});

// List User Withdrawals
apiRouter.get('/withdrawals', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const withdrawalsRes = await query(`
      SELECT * FROM withdrawals 
      WHERE user_id = $1 
      ORDER BY requested_at DESC
    `, [userId]);

    return res.json({ withdrawals: withdrawalsRes.rows });
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve withdrawal history.' });
  }
});

// ==========================================
// 6. TRANSACTION HISTORY
// ==========================================
apiRouter.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { type, status } = req.query;

    let sql = 'SELECT * FROM transactions WHERE user_id = $1';
    const params: any[] = [userId];

    if (type && type !== 'All') {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    sql += ' ORDER BY created_at DESC';

    const txnsRes = await query(sql, params);
    return res.json({ transactions: txnsRes.rows });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve transaction history.' });
  }
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================
apiRouter.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const notifsRes = await query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [userId]);

    const unreadCountRes = await query(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = $1 AND is_read = false
    `, [userId]);

    return res.json({
      notifications: notifsRes.rows,
      unreadCount: parseInt(unreadCountRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

apiRouter.post('/notifications/mark-read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.body;

    if (id) {
      await query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [id, userId]);
    } else {
      await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [userId]);
    }

    return res.json({ message: 'Marked as read.' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ error: 'Failed to update notification state.' });
  }
});

// ==========================================
// 8. HELP & SUPPORT TICKETS
// ==========================================
apiRouter.get('/support-tickets', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const ticketsRes = await query(`
      SELECT * FROM support_tickets 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, [userId]);

    return res.json({ tickets: ticketsRes.rows });
  } catch (error) {
    console.error('Support tickets fetch error:', error);
    return res.status(500).json({ error: 'Failed to retrieve support tickets.' });
  }
});

apiRouter.post('/support-tickets', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { subject, category, priority, message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ error: 'Please provide subject, category, and message.' });
    }

    const ticketNumber = 'TICK-' + Math.floor(1000 + Math.random() * 9000).toString();
    const initialReply = JSON.stringify([
      { sender: 'User', message: message.trim(), timestamp: new Date().toISOString() },
      { sender: 'Support Team', message: 'Thank you for reaching out. Ticket #' + ticketNumber + ' has been assigned to our queue. We usually respond within 4-12 hours.', timestamp: new Date().toISOString() }
    ]);

    const newTicketRes = await query(`
      INSERT INTO support_tickets (user_id, ticket_number, subject, category, priority, status, message, replies)
      VALUES ($1, $2, $3, $4, $5, 'open', $6, $7)
      RETURNING *
    `, [userId, ticketNumber, subject.trim(), category, priority || 'Medium', message.trim(), initialReply]);

    return res.status(201).json({
      message: 'Support ticket opened successfully.',
      ticket: newTicketRes.rows[0],
    });
  } catch (error) {
    console.error('Support ticket creation error:', error);
    return res.status(500).json({ error: 'Failed to submit support ticket.' });
  }
});

// ==========================================
// 9. ACCOUNT SETTINGS & SECURITY
// ==========================================
apiRouter.post('/account/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please enter your current and new password.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }

    const userRes = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password provided is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    return res.status(500).json({ error: 'Failed to update password.' });
  }
});

apiRouter.put('/account/preferences', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { notificationPreferences } = req.body;

    if (notificationPreferences) {
      await query('UPDATE profiles SET notification_preferences = $1, updated_at = NOW() WHERE user_id = $2', [
        typeof notificationPreferences === 'string' ? notificationPreferences : JSON.stringify(notificationPreferences),
        userId,
      ]);
    }

    return res.json({ message: 'Preferences saved.' });
  } catch (error) {
    console.error('Preferences save error:', error);
    return res.status(500).json({ error: 'Failed to save account preferences.' });
  }
});

// ==========================================
// 10. RBAC PROTOCOL & ROLE-BASED ACCESS CONTROL
// ==========================================

// Get RBAC Protocol status & active permissions
apiRouter.get('/rbac/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRes = await query('SELECT id, full_name, email, role FROM users WHERE id = $1', [userId]);
    const role = userRes.rows[0]?.role || 'performer';

    const permissions = {
      role,
      canAccessTasks: true,
      canSubmitWork: true,
      canRequestWithdrawal: true,
      canReviewSubmissions: ['admin', 'manager'].includes(role),
      canDisbursePayouts: role === 'admin',
      canManageUsers: role === 'admin',
      canManageRoles: role === 'admin',
      canAccessAuditLogs: ['admin', 'manager'].includes(role)
    };

    return res.json({
      role,
      permissions,
      rolesAvailable: [
        { id: 'admin', name: 'Platform Administrator', description: 'Full system authorization, payout approvals, user & role configuration' },
        { id: 'manager', name: 'Task & Quality Manager', description: 'Audit task submissions, review evidence, resolve dispute tickets' },
        { id: 'performer', name: 'Verified Performer', description: 'Perform tasks, earn PKR rewards, withdraw funds via verified channels' }
      ]
    });
  } catch (error) {
    console.error('RBAC status error:', error);
    return res.status(500).json({ error: 'Failed to retrieve RBAC status.' });
  }
});

// Switch active role (for RBAC testing and protocol simulation)
apiRouter.post('/rbac/switch-role', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { role } = req.body;

    const allowed = ['admin', 'manager', 'performer'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ error: `Invalid role requested. Allowed: ${allowed.join(', ')}` });
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);
    const userRes = await query('SELECT id, full_name, email, mobile_number, referral_code, role, is_verified FROM users WHERE id = $1', [userId]);
    const updatedUser = userRes.rows[0];

    const newToken = jwt.sign(
      { userId: updatedUser.id, email: updatedUser.email, fullName: updatedUser.full_name, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: `Role switched to ${role.toUpperCase()} successfully.`,
      role,
      token: newToken,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.full_name,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobile_number,
        referralCode: updatedUser.referral_code,
        role: updatedUser.role,
        isVerified: updatedUser.is_verified,
      }
    });
  } catch (error) {
    console.error('RBAC switch role error:', error);
    return res.status(500).json({ error: 'Failed to switch role.' });
  }
});

// Admin: Get all users with RBAC roles and metrics
apiRouter.get('/admin/users', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
  try {
    const usersRes = await query(`
      SELECT u.id, u.full_name, u.email, u.mobile_number, u.role, u.is_verified, u.created_at,
             w.available_balance, w.pending_balance, w.total_earned,
             p.city, p.is_kyc_verified
      FROM users u
      LEFT JOIN wallets w ON w.user_id = u.id
      LEFT JOIN profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 100
    `);

    return res.json({ users: usersRes.rows });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch users list.' });
  }
});

// Admin: Assign / Update user role
apiRouter.post('/admin/users/:userId/role', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const allowed = ['admin', 'manager', 'performer'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Allowed: ${allowed.join(', ')}` });
    }

    await query('UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2', [role, userId]);
    return res.json({ message: `User role updated to ${role} successfully.`, userId, role });
  } catch (error) {
    console.error('Admin update role error:', error);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Admin & Manager: Pending submissions and withdrawals audit queue
apiRouter.get('/admin/audit-queue', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
  try {
    // Pending task submissions
    const pendingSubmissions = await query(`
      SELECT s.*, t.title as task_title, t.category as task_category, u.full_name as performer_name, u.email as performer_email, u.mobile_number as performer_mobile
      FROM task_submissions s
      JOIN tasks t ON t.id = s.task_id
      JOIN users u ON u.id = s.user_id
      WHERE s.status IN ('submitted', 'under_review')
      ORDER BY s.submitted_at ASC
    `);

    // Pending withdrawal requests
    const pendingWithdrawals = await query(`
      SELECT w.*, u.full_name as performer_name, u.email as performer_email, u.mobile_number as performer_mobile
      FROM withdrawals w
      JOIN users u ON u.id = w.user_id
      WHERE w.status IN ('pending', 'processing')
      ORDER BY w.requested_at ASC
    `);

    return res.json({
      pendingSubmissions: pendingSubmissions.rows,
      pendingWithdrawals: pendingWithdrawals.rows
    });
  } catch (error) {
    console.error('Audit queue error:', error);
    return res.status(500).json({ error: 'Failed to fetch audit queue.' });
  }
});

// Manager/Admin: Review task submission (Approve / Reject)
apiRouter.post('/admin/submissions/:id/review', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }

    const subRes = await query('SELECT * FROM task_submissions WHERE id = $1', [id]);
    if (subRes.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    const sub = subRes.rows[0];
    await query(`
      UPDATE task_submissions 
      SET status = $1, feedback = $2, reviewed_at = NOW() 
      WHERE id = $3
    `, [status, feedback || (status === 'approved' ? 'Verified and approved by quality auditor.' : 'Requirements not met.'), id]);

    if (status === 'approved') {
      const reward = parseFloat(sub.reward_amount);
      // Credit to available balance, decrement pending
      await query(`
        UPDATE wallets 
        SET available_balance = available_balance + $1,
            pending_balance = GREATEST(0, pending_balance - $1),
            total_earned = total_earned + $1
        WHERE user_id = $2
      `, [reward, sub.user_id]);

      // Record transaction
      const txnNum = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      await query(`
        INSERT INTO transactions (user_id, transaction_number, type, amount, status, description)
        VALUES ($1, $2, 'task_earning', $3, 'completed', 'Audit Approval: Reward credited to wallet')
      `, [sub.user_id, txnNum, reward]);

      // Notify performer
      await query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, 'Submission Approved', $2, 'success', '/wallet')
      `, [sub.user_id, `Your submission was verified and PKR ${reward.toFixed(2)} has been added to your available cash balance.`]);
    }

    return res.json({ message: `Submission ${status} successfully.`, id, status });
  } catch (error) {
    console.error('Submission review error:', error);
    return res.status(500).json({ error: 'Failed to process submission review.' });
  }
});

// Admin: Disburse / Review withdrawal request
apiRouter.post('/admin/withdrawals/:id/review', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be completed or rejected.' });
    }

    const wdRes = await query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    if (wdRes.rows.length === 0) {
      return res.status(404).json({ error: 'Withdrawal not found.' });
    }

    const wd = wdRes.rows[0];
    await query(`
      UPDATE withdrawals 
      SET status = $1, admin_notes = $2, processed_at = NOW() 
      WHERE id = $3
    `, [status, adminNotes || 'Disbursed via automated payout gateway.', id]);

    if (status === 'rejected') {
      // Refund amount back to available balance
      const refundAmount = parseFloat(wd.amount);
      await query(`
        UPDATE wallets 
        SET available_balance = available_balance + $1,
            total_withdrawn = GREATEST(0, total_withdrawn - $1)
        WHERE user_id = $2
      `, [refundAmount, wd.user_id]);

      await query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, 'Withdrawal Rejected', $2, 'warning', '/wallet')
      `, [wd.user_id, `Withdrawal request for PKR ${refundAmount.toFixed(2)} was rejected. Funds restored to your balance.`]);
    } else {
      await query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, 'Payout Completed', $2, 'success', '/transactions')
      `, [wd.user_id, `Your payout of PKR ${parseFloat(wd.net_amount).toFixed(2)} has been disbursed to your account.`]);
    }

    return res.json({ message: `Withdrawal marked as ${status}.`, id, status });
  } catch (error) {
    console.error('Withdrawal review error:', error);
    return res.status(500).json({ error: 'Failed to process withdrawal review.' });
  }
});

// ==========================================
// 12. ACTIVATION PAYMENTS (PKR 1500)
// ==========================================

// Get current user activation status & payment history
apiRouter.get('/activation/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const userRes = await query('SELECT id, full_name, email, mobile_number, role, payment_status FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    const paymentStatus = user.payment_status || 'unpaid';

    const paymentRes = await query(`
      SELECT * FROM activation_payments 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [userId]);

    return res.json({
      paymentStatus,
      isAdmin: user.role === 'admin',
      isApproved: paymentStatus === 'approved',
      latestPayment: paymentRes.rows[0] || null,
      officialAccounts: {
        easypaisa: {
          accountNumber: '0327 4397413',
          accountTitle: 'Muhammad Yasir Siddique',
          currency: 'PKR',
        },
        jazzcash: {
          accountNumber: '0327 4397413',
          accountTitle: 'Muhammad Yasir Siddique',
          currency: 'PKR',
        }
      }
    });
  } catch (error) {
    console.error('Activation status error:', error);
    return res.status(500).json({ error: 'Failed to retrieve activation status.' });
  }
});

// Submit 1500 PKR activation payment proof
apiRouter.post('/activation/submit', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { paymentMethod, senderName, senderNumber, trxId, receiptUrl, notes, amount = 1500, planName = 'Starter Plan' } = req.body;

    if (!paymentMethod || !senderName || !senderNumber || !trxId) {
      return res.status(400).json({ error: 'Please provide payment method, sender account title, sender number, and transaction ID (TRX ID).' });
    }

    const numericAmount = parseFloat(amount) || 1500.00;
    const combinedNotes = `Plan: ${planName} | ${notes || ''}`.trim();

    // Insert into activation_payments
    const insertRes = await query(`
      INSERT INTO activation_payments (user_id, amount, payment_method, sender_name, sender_number, trx_id, receipt_url, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
      RETURNING *
    `, [userId, numericAmount, paymentMethod, senderName.trim(), senderNumber.trim(), trxId.trim().toUpperCase(), receiptUrl || '', combinedNotes]);

    // Update user status
    await query(`
      UPDATE users 
      SET payment_status = 'pending' 
      WHERE id = $1 AND role != 'admin'
    `, [userId]);

    // Create notification
    await query(`
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES ($1, 'Earning Plan Payment Submitted', 'Your ' || $3 || ' fee of PKR ' || $4 || ' (TRX: ' || $2 || ') was submitted for admin verification. You will start earning once approved.', 'info', '/activation-payment')
    `, [userId, trxId.trim().toUpperCase(), planName, numericAmount.toFixed(0)]);

    return res.status(201).json({
      message: `Payment proof of PKR ${numericAmount.toFixed(0)} for ${planName} submitted successfully. Awaiting Admin verification.`,
      payment: insertRes.rows[0],
      paymentStatus: 'pending',
    });
  } catch (error) {
    console.error('Activation submit error:', error);
    return res.status(500).json({ error: 'Failed to submit activation payment.' });
  }
});

// Admin: Fetch all activation payment requests
apiRouter.get('/admin/activation-payments', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const payments = await query(`
      SELECT ap.*, u.full_name as user_name, u.email as user_email, u.mobile_number as user_mobile
      FROM activation_payments ap
      JOIN users u ON u.id = ap.user_id
      ORDER BY ap.created_at DESC
    `);

    const pendingCount = payments.rows.filter((p: any) => p.status === 'pending').length;

    return res.json({
      payments: payments.rows,
      pendingCount,
    });
  } catch (error) {
    console.error('Admin activation payments error:', error);
    return res.status(500).json({ error: 'Failed to fetch activation payments.' });
  }
});

// Admin: Approve / Reject 1500 PKR activation payment
apiRouter.post('/admin/activation-payments/:id/review', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected.' });
    }

    const payRes = await query('SELECT * FROM activation_payments WHERE id = $1', [id]);
    if (payRes.rows.length === 0) {
      return res.status(404).json({ error: 'Activation payment record not found.' });
    }

    const pay = payRes.rows[0];

    // Update activation_payments
    await query(`
      UPDATE activation_payments 
      SET status = $1, admin_notes = $2, reviewed_at = NOW() 
      WHERE id = $3
    `, [status, adminNotes || (status === 'approved' ? 'Payment verified and performer unlocked by Admin.' : 'Transaction details could not be verified.'), id]);

    // Update user's payment_status
    await query(`
      UPDATE users 
      SET payment_status = $1 
      WHERE id = $2
    `, [status, pay.user_id]);

    if (status === 'approved') {
      const txnNum = 'ACT-' + Math.floor(100000 + Math.random() * 900000);
      await query(`
        INSERT INTO transactions (user_id, transaction_number, type, amount, status, description)
        VALUES ($1, $2, 'fee', 1500.00, 'completed', 'Account Activation Fee (1500 PKR Approved by Admin)')
      `, [pay.user_id, txnNum]);

      await query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, 'Account Activated!', 'Congratulations! Your PKR 1,500 activation payment was approved by Admin. Your dashboard and all micro-tasks are now unlocked.', 'success', '/dashboard')
      `, [pay.user_id]);
    } else {
      await query(`
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES ($1, 'Activation Payment Rejected', $2, 'warning', '/activation-payment')
      `, [pay.user_id, adminNotes || 'Your 1500 PKR activation payment proof could not be verified. Please re-check your TRX ID and re-submit.']);
    }

    return res.json({
      message: `Activation payment marked as ${status} successfully.`,
      status,
      id
    });
  } catch (error) {
    console.error('Activation review error:', error);
    return res.status(500).json({ error: 'Failed to process activation review.' });
  }
});

// ==========================================
// 13. DEDICATED ADMIN PANEL APIs (Tasks, Stats, Submissions)
// ==========================================

// Admin: Comprehensive Overview Statistics
apiRouter.get('/admin/overview-stats', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const [
      usersCountRes,
      approvedUsersRes,
      pendingActRes,
      totalActRevenueRes,
      tasksCountRes,
      submissionsRes,
      pendingWdRes,
      completedWdRes
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'"),
      query("SELECT COUNT(*) as count FROM users WHERE payment_status = 'approved' AND role != 'admin'"),
      query("SELECT COUNT(*) as count FROM activation_payments WHERE status = 'pending'"),
      query("SELECT COALESCE(SUM(amount), 0) as total FROM activation_payments WHERE status = 'approved'"),
      query("SELECT COUNT(*) as count FROM tasks"),
      query(`
        SELECT 
          COUNT(*) as total_submissions,
          COUNT(*) FILTER (WHERE status = 'under_review') as pending_submissions,
          COUNT(*) FILTER (WHERE status = 'approved') as approved_submissions,
          COALESCE(SUM(reward_amount) FILTER (WHERE status = 'approved'), 0) as total_rewards_paid
        FROM task_submissions
      `),
      query("SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count, COALESCE(SUM(net_amount), 0) as total FROM withdrawals WHERE status = 'completed'")
    ]);

    const subData = submissionsRes.rows[0];

    return res.json({
      totalPerformers: parseInt(usersCountRes.rows[0].count, 10),
      approvedPerformers: parseInt(approvedUsersRes.rows[0].count, 10),
      pendingActivations: parseInt(pendingActRes.rows[0].count, 10),
      totalActivationRevenue: parseFloat(totalActRevenueRes.rows[0].total),
      totalTasks: parseInt(tasksCountRes.rows[0].count, 10),
      totalSubmissions: parseInt(subData.total_submissions, 10),
      pendingSubmissions: parseInt(subData.pending_submissions, 10),
      approvedSubmissions: parseInt(subData.approved_submissions, 10),
      totalRewardsPaid: parseFloat(subData.total_rewards_paid),
      pendingWithdrawals: parseInt(pendingWdRes.rows[0].count, 10),
      pendingWithdrawalsAmount: parseFloat(pendingWdRes.rows[0].total),
      totalWithdrawalsDisbursed: parseFloat(completedWdRes.rows[0].total),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin overview statistics.' });
  }
});

// Admin: Get all tasks with submission metrics
apiRouter.get('/admin/tasks', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const tasksRes = await query(`
      SELECT t.*,
        COUNT(ts.id) as total_submissions,
        COUNT(ts.id) FILTER (WHERE ts.status = 'under_review') as pending_submissions,
        COUNT(ts.id) FILTER (WHERE ts.status = 'approved') as approved_submissions
      FROM tasks t
      LEFT JOIN task_submissions ts ON ts.task_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    return res.json({ tasks: tasksRes.rows });
  } catch (error) {
    console.error('Admin tasks fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks for admin.' });
  }
});

// Admin: Create a new Task
apiRouter.post('/admin/tasks', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      category,
      description,
      instructions,
      rewardAmount,
      estimatedMinutes,
      totalSlots,
      difficulty,
      requiredProofType
    } = req.body;

    if (!title || !category || !instructions || !rewardAmount) {
      return res.status(400).json({ error: 'Title, category, reward amount, and instructions are required.' });
    }

    const rewardNum = parseFloat(rewardAmount);
    if (isNaN(rewardNum) || rewardNum <= 0) {
      return res.status(400).json({ error: 'Reward amount must be a positive number.' });
    }

    const slots = parseInt(totalSlots, 10) || 100;
    const estMin = parseInt(estimatedMinutes, 10) || 15;

    const insertRes = await query(`
      INSERT INTO tasks (
        title, category, description, instructions, reward_amount, 
        estimated_minutes, total_slots, remaining_slots, difficulty, required_proof_type, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9, 'active')
      RETURNING *
    `, [
      title.trim(),
      category.trim(),
      description ? description.trim() : title.trim(),
      instructions.trim(),
      rewardNum.toFixed(2),
      estMin,
      slots,
      difficulty || 'Beginner',
      requiredProofType || 'text_and_url'
    ]);

    return res.status(201).json({
      message: 'Task created successfully and published to performers.',
      task: insertRes.rows[0]
    });
  } catch (error) {
    console.error('Admin task creation error:', error);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
});

// Admin: Update existing Task
apiRouter.put('/admin/tasks/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      category,
      description,
      instructions,
      rewardAmount,
      estimatedMinutes,
      totalSlots,
      remainingSlots,
      difficulty,
      requiredProofType,
      status
    } = req.body;

    const taskCheck = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const current = taskCheck.rows[0];

    const updateRes = await query(`
      UPDATE tasks SET
        title = $1,
        category = $2,
        description = $3,
        instructions = $4,
        reward_amount = $5,
        estimated_minutes = $6,
        total_slots = $7,
        remaining_slots = $8,
        difficulty = $9,
        required_proof_type = $10,
        status = $11
      WHERE id = $12
      RETURNING *
    `, [
      title !== undefined ? title.trim() : current.title,
      category !== undefined ? category.trim() : current.category,
      description !== undefined ? description.trim() : current.description,
      instructions !== undefined ? instructions.trim() : current.instructions,
      rewardAmount !== undefined ? parseFloat(rewardAmount).toFixed(2) : current.reward_amount,
      estimatedMinutes !== undefined ? parseInt(estimatedMinutes, 10) : current.estimated_minutes,
      totalSlots !== undefined ? parseInt(totalSlots, 10) : current.total_slots,
      remainingSlots !== undefined ? parseInt(remainingSlots, 10) : current.remaining_slots,
      difficulty !== undefined ? difficulty : current.difficulty,
      requiredProofType !== undefined ? requiredProofType : current.required_proof_type,
      status !== undefined ? status : current.status,
      id
    ]);

    return res.json({
      message: 'Task updated successfully.',
      task: updateRes.rows[0]
    });
  } catch (error) {
    console.error('Admin task update error:', error);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// Admin: Delete Task
apiRouter.delete('/admin/tasks/:id', requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    return res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Admin task delete error:', error);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// Admin: Get all task submissions with filters
apiRouter.get('/admin/all-submissions', requireRole(['admin', 'manager']), async (req: AuthRequest, res: Response) => {
  try {
    const { status, taskId } = req.query;

    let sql = `
      SELECT ts.*,
        t.title as task_title,
        t.category as task_category,
        t.difficulty as task_difficulty,
        u.full_name as performer_name,
        u.email as performer_email,
        u.mobile_number as performer_mobile
      FROM task_submissions ts
      JOIN tasks t ON t.id = ts.task_id
      JOIN users u ON u.id = ts.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND ts.status = $${params.length}`;
    }

    if (taskId) {
      params.push(taskId);
      sql += ` AND ts.task_id = $${params.length}`;
    }

    sql += ' ORDER BY ts.submitted_at DESC';

    const subRes = await query(sql, params);
    return res.json({ submissions: subRes.rows });
  } catch (error) {
    console.error('Admin all submissions error:', error);
    return res.status(500).json({ error: 'Failed to fetch task submissions.' });
  }
});

