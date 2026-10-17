import { CONTEMPORARY_SOURCES } from "@/data/zakat/evidence";
import { RULES, COMPARE_IDS } from "@/lib/zakat/rules";
import { EvidenceList } from "./evidence";
import { Card, Collapsible, Label, Muted, Pill } from "./ui";

const yesNo = (b: boolean) => (b ? "Zakatable" : "Exempt");

export function Learn() {
  return (
    <div className="space-y-3">
      <Card className="space-y-2">
        <Label>Learn</Label>
        <Collapsible title="What is nisab (minimum threshold)?">
          <Muted>Nisab is the minimum amount of wealth that makes zakat due. It is 20 mithqal of gold or 200 dirhams of silver.</Muted>
          <div className="mt-2"><EvidenceList ids={["nisab-hawl-ali", "five-awaq", "five-awaq-muslim"]} /></div>
        </Collapsible>
        <Collapsible title="What is hawl (the zakat year)?">
          <Muted>Zakat is due once wealth at or above nisab has been owned for a full Hijri year.</Muted>
          <div className="mt-2"><EvidenceList ids={["hawl-ibn-majah", "nisab-hawl-ali"]} /></div>
        </Collapsible>
        <Collapsible title="Why schools differ">
          <Muted>Scholars weighed the same texts differently, for example the reports about jewelry and the texts about debts. Each school recorded its positions in its reference books.</Muted>
        </Collapsible>
        <Collapsible title="Jewelry rulings compared">
          {COMPARE_IDS.map((id) => <Muted key={id}>{RULES[id].name}: worn jewelry {yesNo(RULES[id].womensWornJewelryZakatable).toLowerCase()}, rental jewelry {yesNo(RULES[id].rentalJewelryZakatable).toLowerCase()}</Muted>)}
          <div className="mt-2"><EvidenceList ids={["jewelry-bracelets", "jewelry-umm-salamah", "jewelry-aisha-rings", "jewelry-companions-muwatta"]} /></div>
        </Collapsible>
        <Collapsible title="Debts compared">
          {COMPARE_IDS.map((id) => <Muted key={id}>{RULES[id].name}: {RULES[id].summary}</Muted>)}
          <div className="mt-2"><EvidenceList ids={["uthman-zakat-month"]} /></div>
        </Collapsible>
        <Collapsible title="Receivables compared">
          <Muted>Debts owed to you by someone able to pay: Hanafi, Hanbali and Ibn Uthaymeen pay every year when collected; Shafi'i and Ibn Baz every year even before collecting; Maliki one year when collected.</Muted>
          <Muted className="mt-1">Doubtful debts: Shafi'i and Hanbali pay all past years when collected; Maliki and Ibn Uthaymeen one year; Hanafi and Ibn Baz start a new year.</Muted>
          <div className="mt-2"><EvidenceList ids={["ali-doubtful-debt"]} /></div>
        </Collapsible>
        <Collapsible title="School reference books">
          {COMPARE_IDS.map((id) => <Muted key={id}><b>{RULES[id].name}:</b> {RULES[id].sources.join("; ")}</Muted>)}
          <Muted className="mt-1"><b>Contemporary bodies:</b> {CONTEMPORARY_SOURCES.join("; ")}</Muted>
        </Collapsible>
      </Card>

      <Card className="space-y-2">
        <Label>Who can receive zakat</Label>
        <Muted>Zakat goes to the eight categories named in Surah at-Tawbah 9:60.</Muted>
        <EvidenceList ids={["recipients-960"]} />
        <div className="text-[13px] font-semibold">Who cannot receive your zakat</div>
        <Muted>Your parents and grandparents, your children and grandchildren, and your wife.</Muted>
        <div className="text-[13px] font-semibold">A wife giving to her husband</div>
        <Muted>Scholars differ. It is permitted by the Shafi'i school and by Ibn Uthaymeen based on the hadith of Zaynab, the wife of Ibn Mas'ud, and not permitted by Abu Hanifa.</Muted>
        <EvidenceList ids={["zaynab-husband", "zaynab-husband-muslim"]} />
        <Muted>You cannot cancel a debt and count it as zakat.</Muted>
        <Muted>Giving to a needy relative who is not your dependent is better, since it is both charity and keeping family ties.</Muted>
      </Card>

      <Card className="space-y-2">
        <Label>Other zakat types</Label>
        <Pill>Not calculated here, ask a scholar</Pill>
        <Muted>Crops and fruits: 10% if rain fed, 5% if irrigated, after harvest.</Muted>
        <Muted>Livestock: has its own nisab and rates.</Muted>
        <Muted>Buried treasure (rikaz): one fifth.</Muted>
      </Card>

      <Card className="space-y-2">
        <Label>FAQ</Label>
        <Collapsible title="Is my house or car zakatable?"><Muted>No, personal use items are not.</Muted></Collapsible>
        <Collapsible title="Do I pay on my salary?"><Muted>Only on what you still own on your zakat date, following the timing rules of your school.</Muted></Collapsible>
        <Collapsible title="Can I pay my zakat in installments during the year?">
          <Muted>Paying before the due date is advancing your zakat. The Hanbali school and the Permanent Committee allow up to two years ahead, the Hanafi school allows it, the Shafi'i school one year, and the Maliki school only a short time before the due date.</Muted>
          <div className="mt-2"><EvidenceList ids={["abbas-advance"]} /></div>
        </Collapsible>
        <Collapsible title="Do I pay zakat on gemstones?"><Muted>No, unless they are held for trade.</Muted></Collapsible>
      </Card>
    </div>
  );
}
