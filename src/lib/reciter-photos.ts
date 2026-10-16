// Local portraits for reciters that Quran.com has no photo for.
// Keys are normalized name fragments; a reciter matches when their
// normalized name contains the key. URLs come from Lovable Assets.
import { normalizeQuery } from "@/lib/quran";
import p0 from "@/assets/reciters/abdul-mun-im-abdul-mubdi.png.asset.json";
import p1 from "@/assets/reciters/abdulazeez-al-ahmad.png.asset.json";
import p2 from "@/assets/reciters/abdulbari-ath-thubaity.png.asset.json";
import p3 from "@/assets/reciters/abdulkareem-al-hazmi.png.asset.json";
import p4 from "@/assets/reciters/abdullah-awad-al-juhani.png.asset.json";
import p5 from "@/assets/reciters/abdullah-basfar.png.asset.json";
import p6 from "@/assets/reciters/abdullah-khayat.png.asset.json";
import p7 from "@/assets/reciters/abdullah-matroud.png.asset.json";
import p8 from "@/assets/reciters/abdulmuhsin-al-qasim.png.asset.json";
import p9 from "@/assets/reciters/abdulwadud-haneef.png.asset.json";
import p10 from "@/assets/reciters/abdur-rashid-sufi.png.asset.json";
import p11 from "@/assets/reciters/abdur-razaq-bin-abtan-al-dulaimi.png.asset.json";
import p12 from "@/assets/reciters/adel-al-kalbani.png.asset.json";
import p13 from "@/assets/reciters/ahmad-nauina.png.asset.json";
import p14 from "@/assets/reciters/ahmed-ibn-ali-al-ajmy.png.asset.json";
import p15 from "@/assets/reciters/akram-al-alaqmi.png.asset.json";
import p16 from "@/assets/reciters/al-hussayni-al-azazy.png.asset.json";
import p17 from "@/assets/reciters/ali-abdur-rahman-al-huthaify.png.asset.json";
import p18 from "@/assets/reciters/ali-hajjaj-alsouasi.png.asset.json";
import p19 from "@/assets/reciters/asim-abdul-aleem.png.asset.json";
import p20 from "@/assets/reciters/aziz-alili.png.asset.json";
import p21 from "@/assets/reciters/bandar-baleela.png.asset.json";
import p22 from "@/assets/reciters/dr-shawqy-hamed.png.asset.json";
import p23 from "@/assets/reciters/fares-abbad.png.asset.json";
import p24 from "@/assets/reciters/fatih-seferagic.png.asset.json";
import p25 from "@/assets/reciters/hadi-toure.png.asset.json";
import p26 from "@/assets/reciters/hamad-sinan.png.asset.json";
import p27 from "@/assets/reciters/hatem-farid.png.asset.json";
import p28 from "@/assets/reciters/ibrahim-al-akhdar.png.asset.json";
import p29 from "@/assets/reciters/idrees-akbar.png.asset.json";
import p30 from "@/assets/reciters/imad-zuhair-hafez.png.asset.json";
import p31 from "@/assets/reciters/khalid-al-jalil.png.asset.json";
import p32 from "@/assets/reciters/khalid-al-qahtani.png.asset.json";
import p33 from "@/assets/reciters/maher-al-muaiqly.png.asset.json";
import p34 from "@/assets/reciters/mahmood-ali-al-bana.png.asset.json";
import p35 from "@/assets/reciters/mohammad-al-tablawi.png.asset.json";
import p36 from "@/assets/reciters/mohammad-ismaeel-al-muqaddim.png.asset.json";
import p37 from "@/assets/reciters/mostafa-ismaeel.png.asset.json";
import p38 from "@/assets/reciters/muhammad-abdul-kareem.png.asset.json";
import p39 from "@/assets/reciters/muhammad-al-mehysni.png.asset.json";
import p40 from "@/assets/reciters/muhammad-ayyoob.png.asset.json";
import p41 from "@/assets/reciters/muhammad-hassan.png.asset.json";
import p42 from "@/assets/reciters/muhammad-jibreel.png.asset.json";
import p43 from "@/assets/reciters/muhammad-sulaiman-patel.png.asset.json";
import p44 from "@/assets/reciters/mustafa-al-azawi.png.asset.json";
import p45 from "@/assets/reciters/nabil-ar-rifai.png.asset.json";
import p46 from "@/assets/reciters/nasser-al-qatami.png.asset.json";
import p47 from "@/assets/reciters/noreen-siddiq.png.asset.json";
import p48 from "@/assets/reciters/saad-al-ghamdi.png.asset.json";
import p49 from "@/assets/reciters/sadaqat-ali.png.asset.json";
import p50 from "@/assets/reciters/sahl-yasin.png.asset.json";
import p51 from "@/assets/reciters/salah-al-budair.png.asset.json";
import p52 from "@/assets/reciters/salah-al-hashim.png.asset.json";
import p53 from "@/assets/reciters/salah-bukhatir.png.asset.json";
import p54 from "@/assets/reciters/shakir-qasami.png.asset.json";
import p55 from "@/assets/reciters/tawfeeq-ibn-sa-id-as-sawa-igh.png.asset.json";
import p56 from "@/assets/reciters/yasser-ad-dossari.png.asset.json";

const LOCAL_PHOTOS: [string, string][] = [
  ["abdulmunimabdulmubdi", p0],
  ["abdulazezahmad", p1],
  ["abdulbarithubaiti", p2],
  ["abdulkaremhazmi", p3],
  ["abdulaawadjuhani", p4],
  ["abdulabasfar", p5],
  ["abdulakhaiat", p6],
  ["abdulamatroud", p7],
  ["abdulmuhsinqasim", p8],
  ["abdulwadudhanef", p9],
  ["abdurrashidsufi", p10],
  ["abdurrazaqbinabtandulaimi", p11],
  ["adelkalbani", p12],
  ["ahmadnauina", p13],
  ["ahmedibnaliajmi", p14],
  ["akramalaqmi", p15],
  ["husainiazazi", p16],
  ["aliabdurrahmanhuthaifi", p17],
  ["alihajajalsouasi", p18],
  ["asimabdulalem", p19],
  ["azizalili", p20],
  ["bandarbalela", p21],
  ["drshawqihamed", p22],
  ["faresabad", p23],
  ["fatihseferagic", p24],
  ["haditoure", p25],
  ["hamadsinan", p26],
  ["hatemfarid", p27],
  ["ibrahimakhdar", p28],
  ["idresakbar", p29],
  ["imadzuhairhafez", p30],
  ["khalidjalil", p31],
  ["khalidqahtani", p32],
  ["mahermuaiqli", p33],
  ["mahmodalibana", p34],
  ["mohamadtablawi", p35],
  ["mohamadismaelmuqadim", p36],
  ["mostafaismael", p37],
  ["muhamadabdulkarem", p38],
  ["muhamadmehisni", p39],
  ["muhamadaiob", p40],
  ["muhamadhasan", p41],
  ["muhamadjibrel", p42],
  ["muhamadsulaimanpatel", p43],
  ["mustafaazawi", p44],
  ["nabilrifai", p45],
  ["naserqatami", p46],
  ["norensidiq", p47],
  ["sadghamdi", p48],
  ["sadaqatali", p49],
  ["sahliasin", p50],
  ["salabudair", p51],
  ["salahashim", p52],
  ["salabukhatir", p53],
  ["shakirqasami", p54],
  ["tawfeqibnsaidsawaigh", p55],
  ["iaserdosari", p56],
];

/** Portrait for a reciter name, or null when none was supplied. */
export function localReciterPhoto(name: string): string | null {
  const n = normalizeQuery(name.replace(/\[.*?\]/g, " ").replace(/\(.*?\)/g, " "));
  for (const [key, url] of LOCAL_PHOTOS) if (n.includes(key)) return url;
  return null;
}
