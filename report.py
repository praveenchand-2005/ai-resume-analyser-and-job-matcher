# report.py - assemble analysis report
from matcher import Matcher
from nlp_utils import extract_skills, extract_experience_sentences, split_into_sections
from utils import generate_pr_snapshot, compute_hireability_score, github_quick_scan

matcher = Matcher()

def build_report(resume_text, jd_text, github_url=None):
    sections = split_into_sections(resume_text)
    skills = extract_skills(resume_text)
    resume_sents = extract_experience_sentences(resume_text)
    jd_sents = extract_experience_sentences(jd_text)

    matches = matcher.semantic_match(resume_sents, jd_sents, top_k=2)
    coverage, avg_sim = matcher.coverage_score(resume_sents, jd_sents)
    reranked = matcher.llm_rerank(matches, jd_text, resume_text)

    jd_skills = extract_skills(jd_text)
    missing_skills = [s for s in jd_skills if s not in skills]

    plan = {
        '30_days': [f'Learn basics of {ms}' for ms in missing_skills[:3]],
        '60_days': [f'Implement mini project using {ms}' for ms in missing_skills[:3]],
        '90_days': [f"Build portfolio integrating {', '.join(missing_skills[:3])}"]
    }

    interview_qs = [
        f'Explain how you would use {s} to solve a real-world problem.'
        for s in set(jd_skills)
    ][:10]

    report = {
        'skills_found': skills,
        'jd_skills': jd_skills,
        'missing_skills': missing_skills,
        'coverage_score': coverage,
        'avg_similarity': avg_sim,
        'matches': reranked,
        '30_60_90_plan': plan,
        'interview_questions': interview_qs
    }

    if github_url:
        report['github_evidence'] = github_quick_scan(github_url, jd_text)

    return report
