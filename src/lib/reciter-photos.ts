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
import p0 from "@/assets/reciters/abdul-mun-im-abdul-mubdi.asset.json";
import p1 from "@/assets/reciters/abdulazeez-al-ahmad.asset.json";
import p2 from "@/assets/reciters/abdulbari-ath-thubaity.asset.json";
import p3 from "@/assets/reciters/abdulkareem-al-hazmi.asset.json";
import p4 from "@/assets/reciters/abdullah-ali-jabir-ali-jaber.asset.json";
import p5 from "@/assets/reciters/abdullah-awad-al-juhani.asset.json";
import p6 from "@/assets/reciters/abdullah-basfar.asset.json";
import p7 from "@/assets/reciters/abdullah-khayat.asset.json";
import p8 from "@/assets/reciters/abdullah-matroud.asset.json";
import p9 from "@/assets/reciters/abdulmuhsin-al-qasim.asset.json";
import p10 from "@/assets/reciters/abdulwadud-haneef.asset.json";
import p11 from "@/assets/reciters/abdur-rashid-sufi.asset.json";
import p12 from "@/assets/reciters/abdur-razaq-bin-abtan-al-dulaimi.asset.json";
import p13 from "@/assets/reciters/adel-al-kalbani.asset.json";
import p14 from "@/assets/reciters/ahmad-nauina.asset.json";
import p15 from "@/assets/reciters/ahmed-ibn-ali-al-ajmy.asset.json";
import p16 from "@/assets/reciters/akram-al-alaqmi.asset.json";
import p17 from "@/assets/reciters/al-hussayni-al-azazy.asset.json";
import p18 from "@/assets/reciters/ali-abdur-rahman-al-huthaify.asset.json";
import p19 from "@/assets/reciters/ali-hajjaj-alsouasi.asset.json";
import p20 from "@/assets/reciters/asim-abdul-aleem.asset.json";
import p21 from "@/assets/reciters/aziz-alili.asset.json";
import p22 from "@/assets/reciters/bandar-baleela.asset.json";
import p23 from "@/assets/reciters/dr-shawqy-hamed.asset.json";
import p24 from "@/assets/reciters/fares-abbad.asset.json";
import p25 from "@/assets/reciters/fatih-seferagic.asset.json";
import p26 from "@/assets/reciters/hadi-toure.asset.json";
import p27 from "@/assets/reciters/hamad-sinan.asset.json";
import p28 from "@/assets/reciters/hatem-farid.asset.json";
import p29 from "@/assets/reciters/ibrahim-al-akhdar.asset.json";
import p30 from "@/assets/reciters/idrees-akbar.asset.json";
import p31 from "@/assets/reciters/imad-zuhair-hafez.asset.json";
import p32 from "@/assets/reciters/khalid-al-jalil.asset.json";
import p33 from "@/assets/reciters/khalid-al-qahtani.asset.json";
import p34 from "@/assets/reciters/maher-al-muaiqly.asset.json";
import p35 from "@/assets/reciters/mahmood-ali-al-bana.asset.json";
import p36 from "@/assets/reciters/mohammad-al-tablawi.asset.json";
import p37 from "@/assets/reciters/mohammad-ismaeel-al-muqaddim.asset.json";
import p38 from "@/assets/reciters/mostafa-ismaeel.asset.json";
import p39 from "@/assets/reciters/muhammad-abdul-kareem.asset.json";
import p40 from "@/assets/reciters/muhammad-al-mehysni.asset.json";
import p41 from "@/assets/reciters/muhammad-ayyoob.asset.json";
import p42 from "@/assets/reciters/muhammad-hassan.asset.json";
import p43 from "@/assets/reciters/muhammad-jibreel.asset.json";
import p44 from "@/assets/reciters/muhammad-sulaiman-patel.asset.json";
import p45 from "@/assets/reciters/mustafa-al-azawi.asset.json";
import p46 from "@/assets/reciters/nabil-ar-rifai.asset.json";
import p47 from "@/assets/reciters/nasser-al-qatami.asset.json";
import p48 from "@/assets/reciters/noreen-siddiq.asset.json";
import p49 from "@/assets/reciters/saad-al-ghamdi.asset.json";
import p50 from "@/assets/reciters/sadaqat-ali.asset.json";
import p51 from "@/assets/reciters/sahl-yasin.asset.json";
import p52 from "@/assets/reciters/salah-al-budair.asset.json";
import p53 from "@/assets/reciters/salah-al-hashim.asset.json";
import p54 from "@/assets/reciters/salah-bukhatir.asset.json";
import p55 from "@/assets/reciters/shakir-qasami.asset.json";
import p56 from "@/assets/reciters/tawfeeq-ibn-sa-id-as-sawa-igh.asset.json";
import p57 from "@/assets/reciters/wadee-hammadi-al-yamani-wadi-al-yamani.asset.json";
import p58 from "@/assets/reciters/yasser-ad-dossari.asset.json";

const LOCAL_PHOTOS: [string, string][] = [
  ["abdulmunimabdulmubdi", p0],
  ["abdulazezahmad", p1],
  ["abdulbarithubaiti", p2],
  ["abdulkaremhazmi", p3],
  ["abdulaalijabir", p4],
  ["abdulaawadjuhani", p5],
  ["abdulabasfar", p6],
  ["abdulakhaiat", p7],
  ["abdulamatroud", p8],
  ["abdulmuhsinqasim", p9],
  ["abdulwadudhanef", p10],
  ["abdurrashidsufi", p11],
  ["abdurrazaqbinabtandulaimi", p12],
  ["adelkalbani", p13],
  ["ahmadnauina", p14],
  ["ahmedibnaliajmi", p15],
  ["akramalaqmi", p16],
  ["husainiazazi", p17],
  ["aliabdurrahmanhuthaifi", p18],
  ["alihajajalsouasi", p19],
  ["asimabdulalem", p20],
  ["azizalili", p21],
  ["bandarbalela", p22],
  ["drshawqihamed", p23],
  ["faresabad", p24],
  ["fatihseferagic", p25],
  ["haditoure", p26],
  ["hamadsinan", p27],
  ["hatemfarid", p28],
  ["ibrahimakhdar", p29],
  ["idresakbar", p30],
  ["imadzuhairhafez", p31],
  ["khalidjalil", p32],
  ["khalidqahtani", p33],
  ["mahermuaiqli", p34],
  ["mahmodalibana", p35],
  ["mohamadtablawi", p36],
  ["mohamadismaelmuqadim", p37],
  ["mostafaismael", p38],
  ["muhamadabdulkarem", p39],
  ["muhamadmehisni", p40],
  ["muhamadaiob", p41],
  ["muhamadhasan", p42],
  ["muhamadjibrel", p43],
  ["muhamadsulaimanpatel", p44],
  ["mustafaazawi", p45],
  ["nabilrifai", p46],
  ["naserqatami", p47],
  ["norensidiq", p48],
  ["sadghamdi", p49],
  ["sadaqatali", p50],
  ["sahliasin", p51],
  ["salabudair", p52],
  ["salahashim", p53],
  ["salabukhatir", p54],
  ["shakirqasami", p55],
  ["tawfeqibnsaidsawaigh", p56],
  ["wadehamadiiamani", p57],
  ["iaserdosari", p58],
];

/** Portrait for a reciter name, or null when none was supplied. */
export function localReciterPhoto(name: string): string | null {
  const n = normalizeQuery(name.replace(/\[.*?\]/g, " ").replace(/\(.*?\)/g, " "));
  for (const [key, url] of LOCAL_PHOTOS) if (n.includes(key)) return url;
  return null;
}
