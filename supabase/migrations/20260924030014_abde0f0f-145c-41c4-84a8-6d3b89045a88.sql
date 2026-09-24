CREATE TABLE public.widget_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('quran_verse','daily_dhikr','morning_adhkar','evening_adhkar','daily_dua','names_of_allah','sunnah_of_day')),
  arabic_text text NOT NULL,
  transliteration text,
  translation text NOT NULL,
  reference text,
  reward_note text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.widget_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_type text NOT NULL UNIQUE CHECK (widget_type IN ('quran_verse','daily_dhikr','morning_adhkar','evening_adhkar','daily_dua','name_of_allah','sunnah')),
  rotation_mode text NOT NULL DEFAULT 'sequential' CHECK (rotation_mode IN ('sequential','random','manual')),
  current_content_id uuid REFERENCES public.widget_content(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.widget_content TO service_role;
GRANT ALL ON public.widget_schedule TO service_role;
ALTER TABLE public.widget_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.widget_schedule ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.widget_touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER widget_content_touch BEFORE UPDATE ON public.widget_content FOR EACH ROW EXECUTE FUNCTION public.widget_touch_updated_at();
CREATE TRIGGER widget_schedule_touch BEFORE UPDATE ON public.widget_schedule FOR EACH ROW EXECUTE FUNCTION public.widget_touch_updated_at();

INSERT INTO public.widget_schedule (widget_type, rotation_mode) VALUES
('quran_verse','sequential'),('daily_dhikr','sequential'),('morning_adhkar','sequential'),('evening_adhkar','sequential'),('daily_dua','sequential'),('name_of_allah','sequential'),('sunnah','sequential');

INSERT INTO public.widget_content (category, arabic_text, transliteration, translation, reference, reward_note, display_order) VALUES
('quran_verse','لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',NULL,'Allah does not burden a soul beyond that it can bear.','Al-Baqarah 2:286',NULL,1),
('quran_verse','فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ الْعُسْرِ يُسْرًا',NULL,'For indeed, with hardship comes ease. Indeed, with hardship comes ease.','Ash-Sharh 94:5-6',NULL,2),
('quran_verse','فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',NULL,'So remember Me; I will remember you. And be grateful to Me and do not deny Me.','Al-Baqarah 2:152',NULL,3),
('quran_verse','أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',NULL,'Unquestionably, by the remembrance of Allah hearts are assured.','Ar-Ra''d 13:28',NULL,4),
('quran_verse','وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',NULL,'And whoever relies upon Allah, then He is sufficient for him.','At-Talaq 65:3',NULL,5),
('daily_dhikr','سُبْحَانَ اللَّهِ وَبِحَمْدِهِ','SubhanAllahi wa bihamdihi','Glory be to Allah and praise be to Him.','Sahih al-Bukhari 6405','Sins forgiven even if like the foam of the sea (said 100 times)',1),
('daily_dhikr','لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ','La hawla wa la quwwata illa billah','There is no power and no might except by Allah.','Sahih al-Bukhari 6384','A treasure of Paradise',2),
('daily_dhikr','سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ','SubhanAllahi wa bihamdihi, SubhanAllahil-Adheem','Glory be to Allah and praise be to Him, glory be to Allah the Magnificent.','Sahih al-Bukhari 6682','Light on the tongue, heavy on the scale, beloved to the Most Merciful',3),
('daily_dhikr','أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ','Astaghfirullaha wa atubu ilayh','I seek forgiveness from Allah and repent to Him.','Sahih al-Bukhari 6307','The Prophet ﷺ said it more than 70 times a day',4),
('daily_dhikr','لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ','La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamd, wa huwa ala kulli shay''in qadir','None has the right to be worshipped but Allah alone, without partner. His is the dominion and His is the praise, and He is over all things capable.','Sahih al-Bukhari 6403','Like freeing ten slaves (said 100 times)',5),
('morning_adhkar','أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ','Asbahna wa asbahal-mulku lillah, walhamdu lillah','We have entered the morning and the dominion belongs to Allah, and all praise is for Allah.','Sahih Muslim 2723',NULL,1),
('morning_adhkar','اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ','Allahumma bika asbahna, wa bika amsayna, wa bika nahya, wa bika namutu, wa ilaykan-nushur','O Allah, by You we enter the morning and by You we enter the evening, by You we live and by You we die, and to You is the resurrection.','Sunan at-Tirmidhi 3391',NULL,2),
('morning_adhkar','بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ','Bismillahil-ladhi la yadurru ma''asmihi shay''un fil-ardi wa la fis-sama''i wa huwas-Sami''ul-''Alim','In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.','Sunan Abi Dawud 5088','Nothing will harm him (said 3 times)',3),
('morning_adhkar','رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا','Raditu billahi rabba, wa bil-islami dina, wa bi-Muhammadin nabiyya','I am pleased with Allah as my Lord, Islam as my religion, and Muhammad ﷺ as my Prophet.','Sunan Abi Dawud 5072','Allah will surely please him on the Day of Resurrection',4),
('morning_adhkar','يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ','Ya Hayyu ya Qayyum, bi rahmatika astaghith, aslih li sha''ni kullahu, wa la takilni ila nafsi tarfata ''ayn','O Ever-Living, O Sustainer, by Your mercy I seek help. Rectify all my affairs and do not leave me to myself even for the blink of an eye.','Al-Hakim 1/545',NULL,5),
('evening_adhkar','أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ','Amsayna wa amsal-mulku lillah, walhamdu lillah','We have entered the evening and the dominion belongs to Allah, and all praise is for Allah.','Sahih Muslim 2723',NULL,1),
('evening_adhkar','اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ','Allahumma bika amsayna, wa bika asbahna, wa bika nahya, wa bika namutu, wa ilaykal-masir','O Allah, by You we enter the evening and by You we enter the morning, by You we live and by You we die, and to You is the final return.','Sunan at-Tirmidhi 3391',NULL,2),
('evening_adhkar','أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ','A''udhu bikalimatillahit-tammati min sharri ma khalaq','I seek refuge in the perfect words of Allah from the evil of what He has created.','Sahih Muslim 2709','No harm will reach him that night (said 3 times)',3),
('evening_adhkar','اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي','Allahumma ''afini fi badani, Allahumma ''afini fi sam''i, Allahumma ''afini fi basari','O Allah, grant me well-being in my body. O Allah, grant me well-being in my hearing. O Allah, grant me well-being in my sight.','Sunan Abi Dawud 5090',NULL,4),
('evening_adhkar','حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ','Hasbiyallahu la ilaha illa huwa, ''alayhi tawakkaltu wa huwa rabbul-''arshil-''adhim','Allah is sufficient for me; there is no deity except Him. Upon Him I rely, and He is the Lord of the Great Throne.','Sunan Abi Dawud 5081','Allah will suffice him (said 7 times)',5),
('daily_dua','رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',NULL,'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.','Al-Baqarah 2:201',NULL,1),
('daily_dua','رَبِّ زِدْنِي عِلْمًا',NULL,'My Lord, increase me in knowledge.','Ta-Ha 20:114',NULL,2),
('daily_dua','اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',NULL,'O Allah, I ask You for pardon and well-being in this world and the Hereafter.','Sunan Ibn Majah 3871',NULL,3),
('daily_dua','يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',NULL,'O Turner of hearts, keep my heart firm upon Your religion.','Sunan at-Tirmidhi 2140',NULL,4),
('daily_dua','اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',NULL,'O Allah, help me to remember You, thank You, and worship You in the best manner.','Sunan Abi Dawud 1522',NULL,5),
('names_of_allah','الرَّحْمَٰنُ','Ar-Rahman','The Entirely Merciful',NULL,NULL,1),
('names_of_allah','الرَّحِيمُ','Ar-Raheem','The Especially Merciful',NULL,NULL,2),
('names_of_allah','الْمَلِكُ','Al-Malik','The King, The Sovereign',NULL,NULL,3),
('names_of_allah','الْقُدُّوسُ','Al-Quddus','The Most Holy, The Pure',NULL,NULL,4),
('names_of_allah','السَّلَامُ','As-Salam','The Source of Peace',NULL,NULL,5),
('sunnah_of_day','السِّوَاكُ','As-Siwak','Use the miswak (siwak) before prayer; it purifies the mouth and pleases the Lord.','Sahih al-Bukhari 887',NULL,1),
('sunnah_of_day','التَّيَمُّنُ','At-Tayammun','Begin with the right side when putting on clothes, shoes, and entering the masjid.','Sahih al-Bukhari 168',NULL,2),
('sunnah_of_day','إِفْشَاءُ السَّلَامِ','Ifsha'' as-Salam','Spread the greeting of peace to those you know and those you do not know.','Sahih al-Bukhari 12',NULL,3),
('sunnah_of_day','التَّبَسُّمُ','At-Tabassum','Smiling at your brother is charity.','Sunan at-Tirmidhi 1956',NULL,4),
('sunnah_of_day','صَلَاةُ الضُّحَىٰ','Salat ad-Duha','Pray two units of Duha in the forenoon; they suffice as charity for every joint of the body.','Sahih Muslim 720',NULL,5);