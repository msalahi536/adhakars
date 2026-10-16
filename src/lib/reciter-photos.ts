// Local portraits for reciters that Quran.com has no photo for.
// Keys are normalized name fragments; a reciter matches when their
// normalized name contains the key. URLs come from Lovable Assets.
// Same normalization as normalizeQuery in quran.ts, kept local to avoid a
// circular import (quran.ts imports this module).
function normalizeQuery(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[`'’‘ʿʾ.\-_]/g, " ")
    .replace(/\b(surah|surat|sura|sheikh|shaykh|al|an|ar|as|ash|ad|at|az|adh|ath)\b/g, " ")
    .replace(/(.)\1+/g, "$1")
    .replace(/ah\b/g, "a").replace(/ee/g, "i").replace(/oo/g, "u").replace(/y/g, "i")
    .replace(/\s+/g, "").trim();
}
import p0 from "@/assets/reciters/abdul-mun-im-abdul-mubdi.png.asset.json";
import p1 from "@/assets/reciters/abdulazeez-al-ahmad.png.asset.json";
import p2 from "@/assets/reciters/abdulbari-ath-thubaity.png.asset.json";
import p3 from "@/assets/reciters/abdulkareem-al-hazmi.png.asset.json";
import p4 from "@/assets/reciters/abdullah-ali-jabir-ali-jaber.png.asset.json";
import p5 from "@/assets/reciters/abdullah-awad-al-juhani.png.asset.json";
import p6 from "@/assets/reciters/abdullah-basfar.png.asset.json";
import p7 from "@/assets/reciters/abdullah-khayat.png.asset.json";
import p8 from "@/assets/reciters/abdullah-matroud.png.asset.json";
import p9 from "@/assets/reciters/abdulmuhsin-al-qasim.png.asset.json";
import p10 from "@/assets/reciters/abdulwadud-haneef.png.asset.json";
import p11 from "@/assets/reciters/abdur-rashid-sufi.png.asset.json";
import p12 from "@/assets/reciters/abdur-razaq-bin-abtan-al-dulaimi.png.asset.json";
import p13 from "@/assets/reciters/adel-al-kalbani.png.asset.json";
import p14 from "@/assets/reciters/ahmad-nauina.png.asset.json";
import p15 from "@/assets/reciters/ahmed-ibn-ali-al-ajmy.png.asset.json";
import p16 from "@/assets/reciters/akram-al-alaqmi.png.asset.json";
import p17 from "@/assets/reciters/al-hussayni-al-azazy.png.asset.json";
import p18 from "@/assets/reciters/ali-abdur-rahman-al-huthaify.png.asset.json";
import p19 from "@/assets/reciters/ali-hajjaj-alsouasi.png.asset.json";
import p20 from "@/assets/reciters/asim-abdul-aleem.png.asset.json";
import p21 from "@/assets/reciters/aziz-alili.png.asset.json";
import p22 from "@/assets/reciters/bandar-baleela.png.asset.json";
import p23 from "@/assets/reciters/dr-shawqy-hamed.png.asset.json";
import p24 from "@/assets/reciters/fares-abbad.png.asset.json";
import p25 from "@/assets/reciters/fatih-seferagic.png.asset.json";
import p26 from "@/assets/reciters/hadi-toure.png.asset.json";
import p27 from "@/assets/reciters/hamad-sinan.png.asset.json";
import p28 from "@/assets/reciters/hatem-farid.png.asset.json";
import p29 from "@/assets/reciters/ibrahim-al-akhdar.png.asset.json";
import p30 from "@/assets/reciters/idrees-akbar.png.asset.json";
import p31 from "@/assets/reciters/imad-zuhair-hafez.png.asset.json";
import p32 from "@/assets/reciters/khalid-al-jalil.png.asset.json";
import p33 from "@/assets/reciters/khalid-al-qahtani.png.asset.json";
import p34 from "@/assets/reciters/maher-al-muaiqly.png.asset.json";
import p35 from "@/assets/reciters/mahmood-ali-al-bana.png.asset.json";
import p36 from "@/assets/reciters/mohammad-al-tablawi.png.asset.json";
import p37 from "@/assets/reciters/mohammad-ismaeel-al-muqaddim.png.asset.json";
import p38 from "@/assets/reciters/mostafa-ismaeel.png.asset.json";
import p39 from "@/assets/reciters/muhammad-abdul-kareem.png.asset.json";
import p40 from "@/assets/reciters/muhammad-al-mehysni.png.asset.json";
import p41 from "@/assets/reciters/muhammad-ayyoob.png.asset.json";
import p42 from "@/assets/reciters/muhammad-hassan.png.asset.json";
import p43 from "@/assets/reciters/muhammad-jibreel.png.asset.json";
import p44 from "@/assets/reciters/muhammad-sulaiman-patel.png.asset.json";
import p45 from "@/assets/reciters/mustafa-al-azawi.png.asset.json";
import p46 from "@/assets/reciters/nabil-ar-rifai.png.asset.json";
import p47 from "@/assets/reciters/nasser-al-qatami.png.asset.json";
import p48 from "@/assets/reciters/noreen-siddiq.png.asset.json";
import p49 from "@/assets/reciters/saad-al-ghamdi.png.asset.json";
import p50 from "@/assets/reciters/sadaqat-ali.png.asset.json";
import p51 from "@/assets/reciters/sahl-yasin.png.asset.json";
import p52 from "@/assets/reciters/salah-al-budair.png.asset.json";
import p53 from "@/assets/reciters/salah-al-hashim.png.asset.json";
import p54 from "@/assets/reciters/salah-bukhatir.png.asset.json";
import p55 from "@/assets/reciters/shakir-qasami.png.asset.json";
import p56 from "@/assets/reciters/tawfeeq-ibn-sa-id-as-sawa-igh.png.asset.json";
import p57 from "@/assets/reciters/wadee-hammadi-al-yamani-wadi-al-yamani.png.asset.json";
import p58 from "@/assets/reciters/yasser-ad-dossari.png.asset.json";

const LOCAL_PHOTOS: [string, string][] = [
  ["abdulmunimabdulmubdi", p0.url],
  ["abdulazezahmad", p1.url],
  ["abdulbarithubaiti", p2.url],
  ["abdulkaremhazmi", p3.url],
  ["abdulaalijabir", p4.url],
  ["abdulaawadjuhani", p5.url],
  ["abdulabasfar", p6.url],
  ["abdulakhaiat", p7.url],
  ["abdulamatroud", p8.url],
  ["abdulmuhsinqasim", p9.url],
  ["abdulwadudhanef", p10.url],
  ["abdurrashidsufi", p11.url],
  ["abdurrazaqbinabtandulaimi", p12.url],
  ["adelkalbani", p13.url],
  ["ahmadnauina", p14.url],
  ["ahmedibnaliajmi", p15.url],
  ["akramalaqmi", p16.url],
  ["husainiazazi", p17.url],
  ["aliabdurrahmanhuthaifi", p18.url],
  ["alihajajalsouasi", p19.url],
  ["asimabdulalem", p20.url],
  ["azizalili", p21.url],
  ["bandarbalela", p22.url],
  ["drshawqihamed", p23.url],
  ["faresabad", p24.url],
  ["fatihseferagic", p25.url],
  ["haditoure", p26.url],
  ["hamadsinan", p27.url],
  ["hatemfarid", p28.url],
  ["ibrahimakhdar", p29.url],
  ["idresakbar", p30.url],
  ["imadzuhairhafez", p31.url],
  ["khalidjalil", p32.url],
  ["khalidqahtani", p33.url],
  ["mahermuaiqli", p34.url],
  ["mahmodalibana", p35.url],
  ["mohamadtablawi", p36.url],
  ["mohamadismaelmuqadim", p37.url],
  ["mostafaismael", p38.url],
  ["muhamadabdulkarem", p39.url],
  ["muhamadmehisni", p40.url],
  ["muhamadaiob", p41.url],
  ["muhamadhasan", p42.url],
  ["muhamadjibrel", p43.url],
  ["muhamadsulaimanpatel", p44.url],
  ["mustafaazawi", p45.url],
  ["nabilrifai", p46.url],
  ["naserqatami", p47.url],
  ["norensidiq", p48.url],
  ["sadghamdi", p49.url],
  ["sadaqatali", p50.url],
  ["sahliasin", p51.url],
  ["salabudair", p52.url],
  ["salahashim", p53.url],
  ["salabukhatir", p54.url],
  ["shakirqasami", p55.url],
  ["tawfeqibnsaidsawaigh", p56.url],
  ["wadehamadiiamani", p57.url],
  ["iaserdosari", p58.url],
];

/** Portrait for a reciter name, or null when none was supplied. */
export function localReciterPhoto(name: string): string | null {
  const n = normalizeQuery(name.replace(/\[.*?\]/g, " ").replace(/\(.*?\)/g, " "));
  for (const [key, url] of LOCAL_PHOTOS) if (n.includes(key)) return url;
  return null;
}
