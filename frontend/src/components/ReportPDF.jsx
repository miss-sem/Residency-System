import {
  Document, Page, View, Text, StyleSheet, Font,
} from '@react-pdf/renderer';
import { DAYS, DAY_LABELS } from '../utils/helpers';

const PRIMARY  = '#2563EB';
const DARK     = '#1F2937';
const GRAY     = '#6B7280';
const LIGHT    = '#F3F4F6';
const BORDER   = '#E5E7EB';
const GREEN    = '#16A34A';
const BLUE     = '#2563EB';

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9, color: DARK, paddingHorizontal: 36, paddingVertical: 32, backgroundColor: '#fff' },

  /* Header */
  header:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerText: { flex: 1 },
  orgName:    { fontSize: 15, fontFamily: 'Helvetica-Bold', color: PRIMARY, letterSpacing: 1 },
  docTitle:   { fontSize: 9, color: GRAY, marginTop: 2, letterSpacing: 0.5 },
  redLine:    { height: 2.5, backgroundColor: PRIMARY, marginBottom: 14, marginTop: 2 },

  /* Info band */
  infoGrid:   { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: LIGHT, padding: 10, marginBottom: 14, gap: 6 },
  infoCell:   { width: '31%', marginBottom: 2 },
  infoLabel:  { fontSize: 7, color: GRAY, fontFamily: 'Helvetica-Bold', marginBottom: 1.5, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue:  { fontSize: 9, color: DARK, fontFamily: 'Helvetica-Bold' },

  /* Status badge */
  badgeRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 6 },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  badgeText:  { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  /* Section header */
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  sectionLine:   { flex: 1, height: 0.5, backgroundColor: BORDER },
  sectionTitle:  { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: PRIMARY, textTransform: 'uppercase', letterSpacing: 0.6 },

  /* Day block */
  dayBlock:     { marginBottom: 10, border: `0.5px solid ${BORDER}` },
  dayHeader:    { backgroundColor: PRIMARY, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', justifyContent: 'space-between' },
  dayName:      { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  dayBody:      { padding: 10, gap: 8 },
  fieldLabel:   { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GRAY, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  fieldValue:   { fontSize: 8.5, color: DARK, lineHeight: 1.6 },
  fieldEmpty:   { fontSize: 8.5, color: '#D1D5DB', fontStyle: 'italic' },
  divider:      { height: 0.5, backgroundColor: BORDER, marginVertical: 4 },

  /* Notes & Feedback */
  noteBox:      { backgroundColor: LIGHT, padding: 10, marginBottom: 14 },

  /* Footer */
  footer:       { position: 'absolute', bottom: 18, left: 36, right: 36, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTop: `0.5px solid ${BORDER}`, paddingTop: 6 },
  footerText:   { fontSize: 7, color: '#9CA3AF' },
});

const statusStyle = (status) => {
  if (status === 'reviewed')  return { badge: { backgroundColor: '#DCFCE7' }, text: { color: GREEN } };
  if (status === 'submitted') return { badge: { backgroundColor: '#DBEAFE' }, text: { color: BLUE } };
  return { badge: { backgroundColor: LIGHT }, text: { color: GRAY } };
};

const fmt = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtWeek = (iso) => {
  if (!iso) return '—';
  const start = new Date(iso);
  const end = new Date(start);
  end.setDate(end.getDate() + 4);
  const opts = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', { ...opts, year: 'numeric' })}`;
};

/* ── Single report page ───────────────────────────────────────────────────── */
const ReportPage = ({ report, pageNumber, totalPages }) => {
  const st = statusStyle(report.status);
  const resident = report.resident ?? {};

  return (
    <Page size="A4" style={s.page}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.orgName}>LOGBOOK SYSTEM</Text>
          <Text style={s.docTitle}>WEEKLY ACTIVITY LOG</Text>
        </View>
      </View>
      <View style={s.redLine} />

      {/* Resident info */}
      <View style={s.infoGrid}>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Student Name</Text>
          <Text style={s.infoValue}>{resident.name ?? '—'}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Email</Text>
          <Text style={s.infoValue}>{resident.email ?? '—'}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Clinical Unit</Text>
          <Text style={s.infoValue}>{report.unit ?? '—'}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Week</Text>
          <Text style={s.infoValue}>{fmtWeek(report.weekStartDate)}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Submitted</Text>
          <Text style={s.infoValue}>{fmt(report.submittedAt)}</Text>
        </View>
      </View>

      {/* Status badge */}
      <View style={s.badgeRow}>
        <Text style={s.infoLabel}>Status:</Text>
        <View style={[s.badge, st.badge]}>
          <Text style={[s.badgeText, st.text]}>{(report.status ?? '').toUpperCase()}</Text>
        </View>
      </View>

      {/* Daily logs */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Daily Activity Log</Text>
        <View style={s.sectionLine} />
      </View>

      {DAYS.map((day) => {
        const entry = report.days?.[day] ?? {};
        return (
          <View key={day} style={s.dayBlock} wrap={false}>
            <View style={s.dayHeader}>
              <Text style={s.dayName}>{DAY_LABELS[day]}</Text>
            </View>
            <View style={s.dayBody}>
              <View>
                <Text style={s.fieldLabel}>Activities</Text>
                {entry.activities
                  ? <Text style={s.fieldValue}>{entry.activities}</Text>
                  : <Text style={s.fieldEmpty}>No activities recorded</Text>}
              </View>
              <View style={s.divider} />
              <View>
                <Text style={s.fieldLabel}>Competencies Acquired</Text>
                {entry.competenciesAcquired
                  ? <Text style={s.fieldValue}>{entry.competenciesAcquired}</Text>
                  : <Text style={s.fieldEmpty}>None recorded</Text>}
              </View>
              {entry.additionalNotes ? (
                <>
                  <View style={s.divider} />
                  <View>
                    <Text style={s.fieldLabel}>Additional Notes</Text>
                    <Text style={s.fieldValue}>{entry.additionalNotes}</Text>
                  </View>
                </>
              ) : null}
            </View>
          </View>
        );
      })}

      {/* Additional notes */}
      {report.additionalNotes && (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Additional Notes</Text>
            <View style={s.sectionLine} />
          </View>
          <View style={s.noteBox}>
            <Text style={s.fieldValue}>{report.additionalNotes}</Text>
          </View>
        </>
      )}

      {/* Supervisor feedback */}
      {report.status === 'reviewed' && (
        <>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Supervisor / HOD Feedback</Text>
            <View style={s.sectionLine} />
          </View>
          <View style={[s.noteBox, { borderLeft: `2px solid ${PRIMARY}` }]}>
            {report.adminFeedback
              ? <Text style={s.fieldValue}>{report.adminFeedback}</Text>
              : <Text style={s.fieldEmpty}>No feedback provided</Text>}
            <Text style={[s.fieldLabel, { marginTop: 6 }]}>Reviewed on: {fmt(report.reviewedAt)}</Text>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>LogBook — Confidential</Text>
        <Text style={s.footerText}>
          Page {pageNumber} of {totalPages}
        </Text>
      </View>
    </Page>
  );
};

/* ── Single-report document ───────────────────────────────────────────────── */
export const SingleReportDoc = ({ report }) => (
  <Document title={`Weekly Report — ${report?.resident?.name ?? 'Resident'}`}>
    <ReportPage report={report} pageNumber={1} totalPages={1} />
  </Document>
);

/* ── Multi-report document ────────────────────────────────────────────────── */
export const MultiReportDoc = ({ reports }) => (
  <Document title="LogBook — Weekly Reports">
    {reports.map((r, i) => (
      <ReportPage key={r._id} report={r} pageNumber={i + 1} totalPages={reports.length} />
    ))}
  </Document>
);

/* ── Single-day document ──────────────────────────────────────────────────── */
const DayPage = ({ report, day }) => {
  const resident = report.resident ?? {};
  const entry    = report.days?.[day] ?? {};

  return (
    <Page size="A4" style={s.page}>
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.orgName}>LOGBOOK SYSTEM</Text>
          <Text style={s.docTitle}>DAILY ACTIVITY LOG</Text>
        </View>
      </View>
      <View style={s.redLine} />

      <View style={s.infoGrid}>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Student Name</Text>
          <Text style={s.infoValue}>{resident.name ?? '—'}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Clinical Unit</Text>
          <Text style={s.infoValue}>{report.unit ?? '—'}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Week</Text>
          <Text style={s.infoValue}>{fmtWeek(report.weekStartDate)}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Day</Text>
          <Text style={s.infoValue}>{DAY_LABELS[day] ?? day}</Text>
        </View>
        <View style={s.infoCell}>
          <Text style={s.infoLabel}>Email</Text>
          <Text style={s.infoValue}>{resident.email ?? '—'}</Text>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Activity Log — {DAY_LABELS[day] ?? day}</Text>
        <View style={s.sectionLine} />
      </View>

      <View style={[s.dayBlock, { marginBottom: 14 }]}>
        <View style={s.dayHeader}>
          <Text style={s.dayName}>{DAY_LABELS[day] ?? day}</Text>
        </View>
        <View style={s.dayBody}>
          <View>
            <Text style={s.fieldLabel}>Activities</Text>
            {entry.activities
              ? <Text style={s.fieldValue}>{entry.activities}</Text>
              : <Text style={s.fieldEmpty}>No activities recorded</Text>}
          </View>
          <View style={s.divider} />
          <View>
            <Text style={s.fieldLabel}>Competencies Acquired</Text>
            {entry.competenciesAcquired
              ? <Text style={s.fieldValue}>{entry.competenciesAcquired}</Text>
              : <Text style={s.fieldEmpty}>None recorded</Text>}
          </View>
          {entry.additionalNotes ? (
            <>
              <View style={s.divider} />
              <View>
                <Text style={s.fieldLabel}>Additional Notes</Text>
                <Text style={s.fieldValue}>{entry.additionalNotes}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <View style={s.footer} fixed>
        <Text style={s.footerText}>LogBook — Confidential</Text>
        <Text style={s.footerText}>Daily Report · {DAY_LABELS[day] ?? day}</Text>
      </View>
    </Page>
  );
};

export const SingleDayDoc = ({ report, day }) => (
  <Document title={`Daily Log — ${DAY_LABELS[day] ?? day}`}>
    <DayPage report={report} day={day} />
  </Document>
);
