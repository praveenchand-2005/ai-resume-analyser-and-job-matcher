
# nlp_utils.py - sectioning, skill extraction & utilities
import spacy
from collections import defaultdict
nlp = spacy.load('en_core_web_sm')

COMMON_SKILLS = set([
    "python","java","sql","pandas","numpy","scikit-learn","tensorflow","keras",
    "pytorch","nlp","transformers","aws","docker","kubernetes","git","spark",
    "tableau","powerbi","matplotlib","seaborn","streamlit","langchain","bedrock",
    "xgboost","lstm","opencv","tesseract"
])

SECTION_HEADERS = ["experience","work experience","professional experience","education","projects","skills","certifications","summary","contact","objective"]

def split_into_sections(text):
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    sections = defaultdict(list)
    current = "header"
    for line in lines:
        low = line.lower()
        if any(h in low for h in SECTION_HEADERS):
            current = low if len(low) < 30 else "other"
        else:
            sections[current].append(line)
    return {k: "\n".join(v) for k,v in sections.items()}

def extract_skills(text):
    text_low = text.lower()
    found = set()
    for skill in COMMON_SKILLS:
        if skill in text_low:
            found.add(skill)
    return sorted(found)

def extract_experience_sentences(text):
    doc = nlp(text)
    sents = [s.text.strip() for s in doc.sents if len(s.text.strip())>20]
    return sents
