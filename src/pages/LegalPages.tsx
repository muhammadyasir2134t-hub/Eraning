import React from 'react';
import { ShieldCheck, ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

interface LegalPageProps {
  onNavigate: (page: string) => void;
}

export const TermsConditionsPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Terms of Service & Performer Agreement</h2>
        <p className="text-xs text-stone-400">
          Last revised: January 2026 • Governs performer contracts and reward disbursements.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-6 text-xs sm:text-sm text-stone-300 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>1. Independent Contractor Relationship</span>
          </h3>
          <p className="text-stone-400">
            Task performers on WorkPoint are independent third-party contractors and not direct employees. Work is performed voluntarily on a per-task basis according to client specifications.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>2. No Guaranteed Earnings or Passive Yields</span>
          </h3>
          <p className="text-stone-400">
            WorkPoint does not guarantee specific daily, monthly, or fixed income yields. Earnings are directly tied to the quantity, accuracy, and client acceptance of legitimate tasks successfully completed by the user.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>3. Strict Non-Recruitment Policy</span>
          </h3>
          <p className="text-stone-400">
            Performers are strictly NOT required to recruit, invite, or sponsor new members in order to earn or withdraw task compensation. WorkPoint is not a multi-level marketing (MLM) or pyramid scheme.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>4. Quality Standards & Anti-Fraud</span>
          </h3>
          <p className="text-stone-400">
            Submissions made via automated bots, scripts, or fraudulent proofs will result in immediate rejection and potential account termination. All outputs must reflect genuine human effort.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>5. Payouts & Disclosures</span>
          </h3>
          <p className="text-stone-400">
            Withdrawal requests are processed with transparent 0% platform deductions. The minimum withdrawal threshold is clearly set at PKR 500.00 to offset banking network transfer overheads.
          </p>
        </section>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC<LegalPageProps> = ({ onNavigate }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => onNavigate('dashboard')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-stone-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-stone-100 tracking-tight">Privacy Policy & Data Protection</h2>
        <p className="text-xs text-stone-400">
          Last revised: January 2026 • Clear disclosures on what data we collect and how it is secured.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-stone-900 border border-stone-800 space-y-6 text-xs sm:text-sm text-stone-300 leading-relaxed">
        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>1. Information We Collect</span>
          </h3>
          <p className="text-stone-400">
            We collect basic contact details (Name, Email, Mobile Number) and payout identifiers (Easypaisa/JazzCash account numbers or Bank IBANs) solely to remit earned funds.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>2. No Card Data Storage</span>
          </h3>
          <p className="text-stone-400">
            We do not request or store raw debit/credit card CVVs or banking PINs. All disbursements are push payouts directly to your designated mobile wallet or bank account.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>3. No Selling of User Data</span>
          </h3>
          <p className="text-stone-400">
            WorkPoint never sells personal information to third-party marketing brokers. Data is processed exclusively for task audit integrity and regulatory compliance.
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>4. Right to Deletion</span>
          </h3>
          <p className="text-stone-400">
            Users may request full account closure and purge of identifiable data at any time via the Help & Support desk, provided there are no active pending financial disputes.
          </p>
        </section>
      </div>
    </div>
  );
};
