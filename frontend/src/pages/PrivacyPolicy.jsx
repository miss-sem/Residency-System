const PrivacyPolicy = () => (
  <div className="min-h-screen bg-white">
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: 22 August 2026</p>

      <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
        <section>
          <p>
            LogBook ("the app", "we", "us") is a weekly activity submission and review
            system for residents and administrators. This policy explains what
            information we collect, how we use it, and how it is protected.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Account details: full name, email address, department/unit, and role.</li>
            <li>Your password, stored only as a salted hash — never in plain text.</li>
            <li>Weekly activity reports you submit, including daily entries, notes, and any files you attach.</li>
            <li>Admin/reviewer feedback and comments left on your reports.</li>
            <li>Basic usage metadata such as submission and review timestamps.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">How we use it</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To authenticate you and keep your account secure.</li>
            <li>To let you create, save, and submit weekly reports, and let admins/reviewers review them.</li>
            <li>To send you account-related emails (e.g. invitations, password resets).</li>
            <li>To show dashboards and summaries of your own submission history.</li>
          </ul>
          <p className="mt-2">We do not use your data for advertising, and we do not sell your data to anyone.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Where your data is stored</h2>
          <p>
            Data is stored in a managed MongoDB Atlas database and transmitted over
            encrypted (HTTPS) connections. Account emails are sent through Resend, a
            transactional email provider, solely to deliver messages you'd expect
            (invites, password resets, notifications).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Who can see your reports</h2>
          <p>
            Your weekly reports and feedback are visible to you and to administrators/
            reviewers responsible for reviewing residency activity within your
            organization. They are not made public and are not shared with any other
            third party.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Data retention & deletion</h2>
          <p>
            We retain your account and report data for as long as your account is
            active. To request deletion of your account or data, contact us using the
            details below.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Children's privacy</h2>
          <p>This app is intended for use by residency program participants and administrators, and is not directed at children.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Changes to this policy</h2>
          <p>We may update this policy from time to time. Material changes will be reflected by updating the date at the top of this page.</p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-800 mb-2">Contact us</h2>
          <p>
            Questions about this policy or your data? Email{' '}
            <a href="mailto:admin@beaver-llc.com" className="text-primary font-medium hover:underline">
              admin@beaver-llc.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicy;
