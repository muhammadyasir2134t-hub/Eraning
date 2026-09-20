import { query } from './db';
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  try {
    // Clean up any remaining demo accounts
    await query(`
      DELETE FROM users WHERE email = 'demo@earningplatform.com';
    `);

    // Ensure all accounts require payment approval before earning unless explicitly approved in activation_payments
    await query(`
      UPDATE users 
      SET payment_status = 'unpaid' 
      WHERE id NOT IN (SELECT user_id FROM activation_payments WHERE status = 'approved');
    `);

    // Seed sample pending activation payments if empty
    const checkActs = await query('SELECT COUNT(*) FROM activation_payments');
    if (parseInt(checkActs.rows[0].count, 10) === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Pak@123456', salt);
      const p1 = await query(`
        INSERT INTO users (full_name, email, mobile_number, password_hash, referral_code, is_verified, role, payment_status)
        VALUES ('Usman Ali', 'usman.performer@gmail.com', '+92 301 8492011', $1, 'EARN-USMAN1', true, 'performer', 'pending')
        ON CONFLICT (email) DO UPDATE SET payment_status = 'pending'
        RETURNING id
      `, [hash]);

      if (p1.rows.length > 0) {
        const uId = p1.rows[0].id;
        await query(`
          INSERT INTO activation_payments (user_id, amount, payment_method, sender_name, sender_number, trx_id, notes, status, created_at)
          VALUES ($1, 1500.00, 'easypaisa', 'Usman Ali', '03018492011', 'EP-9482019482', 'Sent Rs 1500 via Easypaisa App. Please activate account.', 'pending', NOW() - INTERVAL '35 minutes')
        `, [uId]);
      }

      const p2 = await query(`
        INSERT INTO users (full_name, email, mobile_number, password_hash, referral_code, is_verified, role, payment_status)
        VALUES ('Hamza Khan', 'hamza.tasks@gmail.com', '+92 321 7721094', $1, 'EARN-HAMZA2', true, 'performer', 'pending')
        ON CONFLICT (email) DO UPDATE SET payment_status = 'pending'
        RETURNING id
      `, [hash]);

      if (p2.rows.length > 0) {
        const uId = p2.rows[0].id;
        await query(`
          INSERT INTO activation_payments (user_id, amount, payment_method, sender_name, sender_number, trx_id, notes, status, created_at)
          VALUES ($1, 1500.00, 'jazzcash', 'Hamza Khan', '03217721094', 'JC-8839210041', '1500 PKR sent through JazzCash till. Waiting for approval.', 'pending', NOW() - INTERVAL '15 minutes')
        `, [uId]);
      }
    }

    const checkUsers = await query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(checkUsers.rows[0].count, 10);

    const checkTasks = await query('SELECT COUNT(*) FROM tasks');
    const taskCount = parseInt(checkTasks.rows[0].count, 10);

    if (taskCount === 0) {
      console.log('Seeding initial legitimate micro-tasks...');
      const sampleTasks = [
        {
          title: 'E-commerce Search Quality Evaluation',
          category: 'Data Quality & AI Evaluation',
          description: 'Evaluate search query relevance for 20 consumer electronics queries. Compare search keywords with top 3 ranked product results and rate accuracy.',
          instructions: '1. Review the provided search query and the 3 target products.\n2. Rate relevance on a 1-5 scale according to guidelines.\n3. Provide a 2-sentence rationale explaining the score.\n4. Submit your completed evaluation sheet link or text output.',
          rewardAmount: '120.00',
          estimatedMinutes: 15,
          totalSlots: 200,
          remainingSlots: 184,
          difficulty: 'Beginner',
          requiredProofType: 'Text Evaluation and Verification ID'
        },
        {
          title: 'Urdu & English Audio Transcription Verification',
          category: 'Transcription & Linguistics',
          description: 'Listen to 3 short 30-second audio clips in Pakistani English and Urdu. Check automated captions for spelling, terminology, and timestamp errors.',
          instructions: '1. Listen to Audio Clip #1, #2, and #3 carefully.\n2. Correct any misspelled terms or brand names.\n3. Note any inaudible segments using [inaudible 00:12] tags.\n4. Submit the corrected transcript text below.',
          rewardAmount: '250.00',
          estimatedMinutes: 20,
          totalSlots: 150,
          remainingSlots: 129,
          difficulty: 'Intermediate',
          requiredProofType: 'Transcript corrections'
        },
        {
          title: 'Mobile App Usability Feedback & Bug Audit',
          category: 'QA & App Testing',
          description: 'Test the navigation and checkout flow of an educational learning mobile app on Android or iOS. Log any visual defects or sluggish buttons.',
          instructions: '1. Navigate through Home, Course Catalog, Video Player, and Checkout.\n2. Check button responsiveness on your mobile device.\n3. Take 2 screenshots showing successful completion.\n4. Submit your device model, OS version, and brief 3-point bug/usability review.',
          rewardAmount: '350.00',
          estimatedMinutes: 25,
          totalSlots: 100,
          remainingSlots: 78,
          difficulty: 'Intermediate',
          requiredProofType: 'Test report with device details'
        },
        {
          title: 'Digital Financial Literacy Consumer Survey',
          category: 'Market Research',
          description: 'Participate in an academic research survey regarding digital wallet usage habits (Easypaisa, JazzCash, Raast, banking apps) in South Asia.',
          instructions: '1. Answer all 18 survey questions candidly.\n2. Must have active experience using mobile wallets.\n3. Complete the survey confirmation code at the end.\n4. Paste the 8-digit survey completion token.',
          rewardAmount: '80.00',
          estimatedMinutes: 10,
          totalSlots: 500,
          remainingSlots: 412,
          difficulty: 'Beginner',
          requiredProofType: 'Survey Completion Token'
        },
        {
          title: 'Local Merchant Business Listing Verification',
          category: 'Data Validation',
          description: 'Verify operating hours, phone numbers, and address formats for 10 local retail stores and pharmacies in major metropolitan areas.',
          instructions: '1. Check the business name, address, and contact number.\n2. Verify against official directory listing.\n3. Mark as Open, Relocated, or Closed with verified operational hours.\n4. Submit the verified structured dataset.',
          rewardAmount: '180.00',
          estimatedMinutes: 18,
          totalSlots: 120,
          remainingSlots: 95,
          difficulty: 'Beginner',
          requiredProofType: 'Verified business data list'
        },
        {
          title: 'Technical Article Proofreading & Grammar Review',
          category: 'Proofreading & Editing',
          description: 'Proofread a 1,200-word introductory tutorial on cybersecurity basics. Catch grammatical mistakes, typos, and formatting oversights.',
          instructions: '1. Read the article thoroughly.\n2. Highlight and list all grammatical errors and typos.\n3. Suggest improved sentence structures where clarity is lacking.\n4. Submit your structured error log.',
          rewardAmount: '300.00',
          estimatedMinutes: 30,
          totalSlots: 80,
          remainingSlots: 64,
          difficulty: 'Advanced',
          requiredProofType: 'Detailed revision notes'
        },
        {
          title: 'Landing Page Website Creation (HTML/CSS & Tailwind)',
          category: 'Website Building & Development',
          description: 'Build a responsive 1-page modern product landing page template for a local bakery or services business using clean HTML/CSS/Tailwind.',
          instructions: '1. Create a clean responsive single-page landing structure (Header, Hero with Call-to-Action, 3 Services, Testimonials, Contact Footer).\n2. Ensure mobile-friendly responsive layout.\n3. Host on GitHub Pages, CodePen, or provide clean ZIP/Code link.\n4. Submit live preview link and source code snippet.',
          rewardAmount: '850.00',
          estimatedMinutes: 45,
          totalSlots: 50,
          remainingSlots: 42,
          difficulty: 'Advanced',
          requiredProofType: 'Live URL link or Code repository'
        },
        {
          title: 'Urdu & English SEO Blog Article Writing (800 Words)',
          category: 'Article Writing & Translation',
          description: 'Write an informative 800-word SEO-optimized blog article on "Best Freelancing Skills to Learn in Pakistan in 2026".',
          instructions: '1. Write an engaging title and clear introduction.\n2. Include 4 distinct subheadings (H2/H3) covering Web Development, Content Writing, Graphic Design, and Virtual Assistance.\n3. Ensure 100% human-written, plagiarism-free text.\n4. Submit Google Docs view link or full article text output.',
          rewardAmount: '600.00',
          estimatedMinutes: 35,
          totalSlots: 75,
          remainingSlots: 68,
          difficulty: 'Intermediate',
          requiredProofType: 'Google Docs Link or Full Article Text'
        }
      ];

      for (const t of sampleTasks) {
        await query(`
          INSERT INTO tasks (title, category, description, instructions, reward_amount, estimated_minutes, total_slots, remaining_slots, difficulty, required_proof_type, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active')
        `, [t.title, t.category, t.description, t.instructions, t.rewardAmount, t.estimatedMinutes, t.totalSlots, t.remainingSlots, t.difficulty, t.requiredProofType]);
      }
      console.log('Seeded 6 active micro-tasks successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}
