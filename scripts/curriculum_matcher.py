"""
Curriculum Matcher for Tunisian Primary Education.
Loads 147 official curriculum chapters from src/app/core/data/curriculum-chapters.data.ts
and matches extracted parascolaire topics to official topicIds.
"""
import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple

SUBJECT_CANONICAL = {
    'math': 'Mathématiques',
    'mathematiques': 'Mathématiques',
    'mathématiques': 'Mathématiques',
    'الرياضيات': 'Mathématiques',
    'رياضيات': 'Mathématiques',
    'arabe': 'اللغة العربية',
    'arab': 'اللغة العربية',
    'العربية': 'اللغة العربية',
    'اللغة العربية': 'اللغة العربية',
    'francais': 'Français',
    'français': 'Français',
    'الفرنسية': 'Français',
    'eveil': 'Éveil Scientifique',
    'éveil': 'Éveil Scientifique',
    'éveil scientifique': 'Éveil Scientifique',
    'eveil scientifique': 'Éveil Scientifique',
    'الإيقاظ العلمي': 'Éveil Scientifique',
    'ايقاظ': 'Éveil Scientifique',
    'إيقاظ': 'Éveil Scientifique',
}

GRADE_CANONICAL = {
    '1ere': '1ère Année',
    '1': '1ère Année',
    '1ère': '1ère Année',
    '1ère année': '1ère Année',
    '2eme': '2ème Année',
    '2': '2ème Année',
    '2ème': '2ème Année',
    '2ème année': '2ème Année',
    '3eme': '3ème Année',
    '3': '3ème Année',
    '3ème': '3ème Année',
    '3ème année': '3ème Année',
    '4eme': '4ème Année',
    '4': '4ème Année',
    '4ème': '4ème Année',
    '4ème année': '4ème Année',
    '5eme': '5ème Année',
    '5': '5ème Année',
    '5ème': '5ème Année',
    '5ème année': '5ème Année',
    '6eme': '6ème Année',
    '6': '6ème Année',
    '6ème': '6ème Année',
    '6ème année': '6ème Année',
}

STOP_WORDS = {
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux', 'en', 'dans', 'sur', 'pour', 'par', 'avec',
    'et', 'ou', 'est', 'sont', 'dans', 'que', 'qui', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'du', 'd',
    'cours', 'exercices', 'exercice', 'leçon', 'lecon', 'activite', 'activité', 'évaluation', 'evaluation',
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'و', 'ثم', 'أو', 'هذا', 'هذه', 'الذي', 'التي', 'كل', 'تمارين', 'درس', 'تقييم'
}

def tokenize(text: str) -> List[str]:
    if not text:
        return []
    words = re.findall(r'[\w\u0600-\u06FF]+', text.lower())
    return [w for w in words if len(w) > 1 and w not in STOP_WORDS]


class CurriculumIndex:
    def __init__(self, data_file: Path = Path('src/app/core/data/curriculum-chapters.data.ts')):
        self.chapters: List[Dict] = []
        self._load(data_file)

    def _load(self, path: Path):
        content = path.read_text(encoding='utf-8')
        m = re.search(r'TUNISIAN_CURRICULUM_CHAPTERS:\s*CurriculumChapter\[\]\s*=\s*(\[[\s\S]*?\]);', content)
        if not m:
            raise ValueError(f"Could not parse TUNISIAN_CURRICULUM_CHAPTERS from {path}")
        self.chapters = json.loads(m.group(1))

    def normalize_subject(self, subject: str) -> str:
        if not subject:
            return ''
        s = subject.strip().lower()
        return SUBJECT_CANONICAL.get(s, subject.strip())

    def normalize_grade(self, grade: str) -> str:
        if not grade:
            return ''
        g = grade.strip().lower()
        return GRADE_CANONICAL.get(g, grade.strip())

    def match_topic(self, topic_guess: str, grade: str = '', subject: str = '') -> Tuple[Optional[str], float, Optional[Dict]]:
        """
        Returns (topicId, confidenceScore, chapterDict)
        """
        norm_grade = self.normalize_grade(grade)
        norm_subject = self.normalize_subject(subject)
        
        candidates = self.chapters
        if norm_grade:
            filtered = [c for c in candidates if c.get('grade') == norm_grade]
            if filtered:
                candidates = filtered

        if norm_subject:
            filtered = [c for c in candidates if self.normalize_subject(c.get('subject', '')) == norm_subject]
            if filtered:
                candidates = filtered

        if not candidates:
            candidates = self.chapters

        topic_tokens = tokenize(topic_guess)
        if not topic_tokens:
            # Fallback to the first chapter in the filtered grade/subject
            first = candidates[0] if candidates else None
            return (first.get('id') if first else None, 0.3, first)

        best_score = -1.0
        best_chapter = candidates[0]

        for ch in candidates:
            corpus = " ".join([
                ch.get('titleAr', ''),
                ch.get('titleFr', ''),
                ch.get('keyCompetencyAr', ''),
                ch.get('keyCompetencyFr', ''),
            ])
            ch_tokens = set(tokenize(corpus))
            if not ch_tokens:
                continue

            matches = sum(1 for t in topic_tokens if t in ch_tokens)
            score = matches / max(len(topic_tokens), 1)

            # Substring exact matches give a big boost
            lower_corpus = corpus.lower()
            if topic_guess and topic_guess.lower() in lower_corpus:
                score += 0.5

            if score > best_score:
                best_score = score
                best_chapter = ch

        confidence = min(max(best_score, 0.4), 0.99)
        return (best_chapter.get('id'), confidence, best_chapter)
