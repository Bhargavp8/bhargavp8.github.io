/* ============================================================
   KRISHNASHTAMI QUIZ — QUESTIONS
   Loaded by the SCREEN only. Phones never receive this file,
   so the answers cannot be read out of a player's browser.

   Format:
     {
       q:       "The question text shown on the big screen",
       options: ["Option 1", "Option 2", "Option 3", "Option 4"],
       answer:  0,           // index of the correct option (0,1,2,3)
       time:    20,          // OPTIONAL seconds (default: CONFIG.DEFAULT_TIME)
       double:  true,        // OPTIONAL 2x points
       note:    "Shown on the reveal screen"   // OPTIONAL
     }

   Exactly 4 options per question. Order below = order played.
   ============================================================ */

const QUESTIONS = [
  {
    q: "In which yuga was Krishna born?",
    options: ["Sat", "Treta", "Dvapara", "Kali"],
    answer: 2,
    note: "The Dvapara Yuga — the third of the four ages. His departure closes it."
  },
  {
    q: "How is Devaki related to Kamsa?",
    options: ["Mother", "Aunt", "Sister", "Cousin"],
    answer: 3,
    note: "Devaki was the daughter of Devaka; Kamsa the son of Devaka's brother Ugrasena. He called her sister — but the relation is cousin."
  },
  {
    q: "How many sons of Devaki were killed by Kamsa?",
    options: ["9", "8", "6", "5"],
    answer: 2,
    note: "Six. The seventh was drawn into Rohini's womb and became Balarama; the eighth was Krishna."
  },
  {
    q: "Under which star (nakshatra) was Krishna born?",
    options: ["Ashwini", "Rohini", "Swati", "Revati"],
    answer: 1,
    note: "Rohini nakshatra, on the ashtami of Krishna paksha — the very conjunction this day is named for."
  },
  {
    q: "When Krishna was born, where was he taken by Vasudeva?",
    options: ["Vrindavan", "Gokul", "Mathura", "Dwaraka"],
    answer: 1,
    note: "Carried across the Yamuna that same night, to Nanda and Yashoda in Gokul."
  },
  {
    q: "Which Rishi conducted the naming ceremony of Krishna?",
    options: ["Agastya", "Garga", "Vishwamitra", "Vashishtha"],
    answer: 1,
    note: "Gargacharya, priest of the Yadus — who performed it in secret at Nanda's request, so as not to draw Kamsa's notice."
  },
  {
    q: "When Yashoda Ma sought to bind the mischievous Krishna, by how much did the rope fall short every time?",
    options: ["One foot", "A palm", "4 fingers", "2 fingers"],
    answer: 3,
    note: "Two fingers' width, however much rope she gathered — until she gave up in love, and he let himself be bound. Hence Damodara."
  },
  {
    q: "Who trapped the Gopa Balas and their cows in a cave for a year?",
    options: ["Indra", "Brahma", "Kubera", "Kama Deva"],
    answer: 1,
    note: "Brahma hid them to test him. Krishna simply became every boy and every calf for a full year — and nobody noticed."
  },
  {
    q: "Nalakubera and Manigriva were divine entities who were cursed to become trees and to be liberated by Krishna. Who cursed them?",
    options: ["Kubera", "Narada", "Durwasa", "Angira"],
    answer: 1,
    note: "Narada cursed Kubera's two sons to stand as the twin arjuna trees — so that Krishna, dragging his mortar, would one day pull them down and free them."
  },
  {
    q: "In the context of Bhagawatam, who or what is Kalindi?",
    options: ["The serpent Kaliya's wife", "A demoness killed by Krishna", "Garuda's mother", "The river Yamuna"],
    answer: 3,
    note: "Kalindi is the Yamuna, daughter of Surya, named for Mount Kalinda where she rises. She later became one of Krishna's eight queens."
  },
  {
    q: "For how long did Krishna study in Saandeepani?",
    options: ["6 years", "3 years", "108 days", "64 days"],
    answer: 3,
    note: "Sixty-four days — one for each of the sixty-four arts he mastered under Sandipani at Avantipura."
  },
  {
    q: "Who was Kuchela?",
    options: ["One of the demons killed by Krishna", "Kamsa's friend", "Gopa friend of Krishna", "Krishna's friend from Saandeepani"],
    answer: 3,
    note: "Kuchela — 'the one in rags' — is Sudama, his fellow student at Sandipani's ashram. Not a cowherd friend from Vraja."
  },
  {
    q: "Who was sent by Kamsa to bring Krishna from Vraja to Mathura?",
    options: ["Vidura", "Akrura", "Uddhava", "Aniruddha"],
    answer: 1,
    note: "Akrura, sent with a chariot on the pretext of the bow sacrifice — and he went knowing exactly whom he was fetching."
  },
  {
    q: "Which weapon did Krishna use to kill Kamsa?",
    options: ["Knife", "Mace", "Sword", "No weapon"],
    answer: 3,
    note: "None. He dragged Kamsa down from his throne and finished it bare-handed."
  },
  {
    q: "Who was Sishupala in his previous birth?",
    options: ["Ravana", "Hiranyakashipu", "Hiranyaksha", "Jai"],
    answer: 0,
    note: "The third of three births for Jaya, gatekeeper of Vaikuntha: Hiranyakashipu, then Ravana, then Sishupala."
  },
  {
    q: "Which of the following is NOT Krishna's wife?",
    options: ["Mitravinda", "Lakshmana", "Bhadra", "Rati"],
    answer: 3,
    note: "Mitravinda, Lakshmana and Bhadra are all among the Ashtabharya, his eight principal queens. Rati is the consort of Kamadeva."
  },
  {
    q: "Which jewel was Krishna wrongfully accused of stealing?",
    options: ["Kaustubha", "Panchajanya", "Syamantaka", "Muktavali"],
    answer: 2,
    note: "The Syamantaka gem. Clearing his own name led him to Jambavati and to Satyabhama both."
  },
  {
    q: "How was Kunti related to Krishna?",
    options: ["Maternal Aunt", "Paternal Aunt", "Cousin", "Not related — only a Devotee"],
    answer: 1,
    note: "Kunti was Vasudeva's sister — which made the Pandavas Krishna's first cousins."
  },
  {
    q: "Which son of Krishna was cursed, leading to the destruction of the Yadu dynasty?",
    options: ["Pradyumna", "Samba", "Chitraketu", "Subahu"],
    answer: 1,
    note: "Samba's prank on the visiting sages drew the curse that ended the Yadava line."
  },
  {
    q: "In which yuga did Krishna give up his manifested avatara?",
    options: ["Treta yuga", "Dwapara Yuga", "In between Dwapara yuga and Kali Yuga", "Kali yuga"],
    answer: 1,
    double: true,
    note: "He departed at the close of Dvapara — and Kali Yuga is said to have begun in that very moment. DOUBLE POINTS."
  }
];
